import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { salesData, queryHistory } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { QueryDashboardBody, UploadCsvBody } from "@workspace/api-zod";
import { generateSQL } from "./sql-generator";
import { selectCharts } from "./chart-selector";
import { generateInsights } from "./insight-generator";
import pg from "pg";

const router: IRouter = Router();

function getDbClient() {
  return new pg.Client({ connectionString: process.env.DATABASE_URL });
}

async function getSchemaContext(): Promise<string> {
  const client = getDbClient();
  await client.connect();
  try {
    const res = await client.query<{ table_name: string; column_name: string; data_type: string }>(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`,
    );

    const tables: Record<string, { column: string; type: string }[]> = {};
    for (const row of res.rows) {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push({ column: row.column_name, type: row.data_type });
    }

    return Object.entries(tables)
      .map(([tableName, cols]) => {
        const colDefs = cols.map((c) => `  ${c.column} ${c.type}`).join(",\n");
        return `${tableName}(\n${colDefs}\n)`;
      })
      .join("\n\n");
  } finally {
    await client.end();
  }
}

router.post("/query", async (req, res) => {
  try {
    const parsed = QueryDashboardBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { query, tableContext } = parsed.data;

    const schemaContext = tableContext || (await getSchemaContext());
    const sql = await generateSQL(query, schemaContext);

    if (sql === "CANNOT_ANSWER") {
      return res.json({
        sql: "",
        data: [],
        chartConfigs: [],
        insights: [],
        cannotAnswer: true,
        rowCount: 0,
      });
    }

    const client = getDbClient();
    await client.connect();
    let queryResult: Record<string, unknown>[] = [];
    try {
      const result = await client.query(sql);
      queryResult = result.rows as Record<string, unknown>[];
    } finally {
      await client.end();
    }

    await db.insert(queryHistory).values({ query, sql });

    const chartConfigs = selectCharts(queryResult, query);
    const insights = await generateInsights(query, queryResult, sql);

    return res.json({
      sql,
      data: queryResult,
      chartConfigs,
      insights,
      cannotAnswer: false,
      rowCount: queryResult.length,
    });
  } catch (err) {
    console.error("Dashboard query error:", err);
    return res.status(500).json({ error: "Failed to process query: " + String(err) });
  }
});

router.post("/upload-csv", async (req, res) => {
  try {
    const parsed = UploadCsvBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { tableName, csvContent } = parsed.data;

    const safeTableName = tableName.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV must have at least a header row and one data row" });
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/[^a-z0-9_]/gi, "_").toLowerCase());
    const rows = lines.slice(1).filter((l) => l.trim().length > 0);

    const client = getDbClient();
    await client.connect();
    try {
      await client.query(`DROP TABLE IF EXISTS "${safeTableName}"`);
      const colDefs = headers.map((h) => `"${h}" TEXT`).join(", ");
      await client.query(`CREATE TABLE "${safeTableName}" (id SERIAL PRIMARY KEY, ${colDefs})`);

      for (const row of rows) {
        const values = row.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        const cols = headers.map((h) => `"${h}"`).join(", ");
        await client.query(
          `INSERT INTO "${safeTableName}" (${cols}) VALUES (${placeholders})`,
          values,
        );
      }
    } finally {
      await client.end();
    }

    return res.json({
      success: true,
      tableName: safeTableName,
      rowCount: rows.length,
      columns: headers,
    });
  } catch (err) {
    console.error("CSV upload error:", err);
    return res.status(500).json({ error: "Failed to upload CSV: " + String(err) });
  }
});

router.get("/tables", async (_req, res) => {
  const client = getDbClient();
  await client.connect();
  try {
    const tableRes = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );

    const tables = await Promise.all(
      tableRes.rows.map(async (row) => {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        const colRes = await client.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
          [row.table_name],
        );
        return {
          name: row.table_name,
          rowCount: parseInt(countRes.rows[0].count, 10),
          columns: colRes.rows.map((c) => c.column_name),
        };
      }),
    );

    return res.json(tables);
  } catch (err) {
    console.error("List tables error:", err);
    return res.status(500).json({ error: "Failed to list tables" });
  } finally {
    await client.end();
  }
});

router.get("/schema", async (_req, res) => {
  const client = getDbClient();
  await client.connect();
  try {
    const tableRes = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );

    const tables = await Promise.all(
      tableRes.rows.map(async (row) => {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
        const colRes = await client.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
          [row.table_name],
        );
        return {
          name: row.table_name,
          rowCount: parseInt(countRes.rows[0].count, 10),
          columns: colRes.rows.map((c) => c.column_name),
        };
      }),
    );

    return res.json({ tables });
  } catch (err) {
    console.error("Get schema error:", err);
    return res.status(500).json({ error: "Failed to get schema" });
  } finally {
    await client.end();
  }
});

router.get("/history", async (_req, res) => {
  try {
    const history = await db
      .select()
      .from(queryHistory)
      .orderBy(desc(queryHistory.createdAt))
      .limit(20);
    return res.json(history);
  } catch (err) {
    console.error("Get history error:", err);
    return res.status(500).json({ error: "Failed to get history" });
  }
});

export default router;
