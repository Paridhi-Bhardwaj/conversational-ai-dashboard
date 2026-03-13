import { ai } from "@workspace/integrations-gemini-ai";

export async function generateSQL(
  userQuery: string,
  schemaContext: string,
): Promise<string> {
  const prompt = `You are an expert SQL generator. Convert the following natural language query to valid PostgreSQL SQL.

Available schema:
${schemaContext}

Rules:
1. Return ONLY the SQL query, no explanations, no markdown, no backticks
2. Use exact column names from the schema
3. Always use proper SQL syntax
4. For date operations, the date column is stored as TEXT in format 'YYYY-MM-DD'
5. Limit results to 1000 rows maximum unless the query asks for specific counts
6. If you cannot answer from the available schema, return exactly: CANNOT_ANSWER

User query: ${userQuery}

SQL:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const sql = (response.text ?? "").trim();

  if (!sql || sql === "CANNOT_ANSWER") {
    return "CANNOT_ANSWER";
  }

  const cleaned = sql
    .replace(/^```sql\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return cleaned;
}
