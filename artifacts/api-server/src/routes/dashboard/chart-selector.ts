type ChartType = "line" | "bar" | "pie" | "horizontalBar" | "table";

interface ChartConfig {
  type: ChartType;
  title: string;
  xKey?: string | null;
  yKey?: string | null;
  dataKeys: string[];
  data: Record<string, unknown>[];
  columns?: string[];
}

function isNumeric(val: unknown): boolean {
  return typeof val === "number" || (typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "");
}

function isDateLike(key: string): boolean {
  return /date|month|year|quarter|week|day|time|period/i.test(key);
}

function isCategoryLike(key: string): boolean {
  return /region|category|product|name|type|segment|group/i.test(key);
}

export function selectCharts(
  data: Record<string, unknown>[],
  userQuery: string,
): ChartConfig[] {
  if (!data || data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const numericCols = columns.filter((c) => data.some((row) => isNumeric(row[c])));
  const dateCols = columns.filter((c) => isDateLike(c));
  const categoryCols = columns.filter((c) => isCategoryLike(c) && !numericCols.includes(c));

  const charts: ChartConfig[] = [];
  const queryLower = userQuery.toLowerCase();

  if (data.length === 1 && columns.length <= 3) {
    return [
      {
        type: "table",
        title: "Query Result",
        dataKeys: columns,
        data,
        columns,
      },
    ];
  }

  const isTimeSeries = dateCols.length > 0 ||
    queryLower.includes("trend") ||
    queryLower.includes("over time") ||
    queryLower.includes("monthly") ||
    queryLower.includes("yearly") ||
    queryLower.includes("2023") ||
    queryLower.includes("2024");

  const isComparison =
    queryLower.includes("compare") ||
    queryLower.includes("by region") ||
    queryLower.includes("by category") ||
    queryLower.includes("by product");

  const isPieChart =
    queryLower.includes("share") ||
    queryLower.includes("percentage") ||
    queryLower.includes("distribution") ||
    queryLower.includes("breakdown");

  const isRanking =
    queryLower.includes("top") ||
    queryLower.includes("ranking") ||
    queryLower.includes("best") ||
    queryLower.includes("worst");

  const primaryNumCol = numericCols.find((c) => /revenue|sales|amount|total|count|units/i.test(c)) || numericCols[0];
  const primaryCatCol = dateCols[0] || categoryCols[0] || columns[0];

  if (isTimeSeries && dateCols.length > 0 && primaryNumCol) {
    charts.push({
      type: "line",
      title: `${primaryNumCol.replace(/_/g, " ")} Trend Over Time`,
      xKey: dateCols[0],
      yKey: primaryNumCol,
      dataKeys: numericCols.slice(0, 3),
      data,
    });
  }

  if ((isComparison || categoryCols.length > 0) && primaryNumCol) {
    const catCol = categoryCols[0] || primaryCatCol;
    if (catCol !== dateCols[0]) {
      charts.push({
        type: "bar",
        title: `${primaryNumCol.replace(/_/g, " ")} by ${catCol.replace(/_/g, " ")}`,
        xKey: catCol,
        yKey: primaryNumCol,
        dataKeys: numericCols.slice(0, 3),
        data,
      });
    }
  }

  if (isPieChart && primaryNumCol && primaryCatCol) {
    charts.push({
      type: "pie",
      title: `${primaryNumCol.replace(/_/g, " ")} Distribution`,
      xKey: primaryCatCol,
      yKey: primaryNumCol,
      dataKeys: [primaryNumCol],
      data,
    });
  }

  if (isRanking && primaryNumCol) {
    const catCol = categoryCols[0] || columns[0];
    charts.push({
      type: "horizontalBar",
      title: `Top ${primaryNumCol.replace(/_/g, " ")} Ranking`,
      xKey: primaryNumCol,
      yKey: catCol,
      dataKeys: [primaryNumCol],
      data: [...data].sort((a, b) => Number(b[primaryNumCol] ?? 0) - Number(a[primaryNumCol] ?? 0)).slice(0, 10),
    });
  }

  if (charts.length === 0) {
    if (numericCols.length > 0 && primaryCatCol) {
      charts.push({
        type: "bar",
        title: "Data Overview",
        xKey: primaryCatCol,
        yKey: primaryNumCol,
        dataKeys: numericCols.slice(0, 3),
        data,
      });
    } else {
      charts.push({
        type: "table",
        title: "Query Result",
        dataKeys: columns,
        data,
        columns,
      });
    }
  }

  charts.push({
    type: "table",
    title: "Raw Data",
    dataKeys: columns,
    data: data.slice(0, 100),
    columns,
  });

  return charts;
}
