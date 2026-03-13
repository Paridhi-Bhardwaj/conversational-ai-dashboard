import { ai } from "@workspace/integrations-gemini-ai";

export async function generateInsights(
  userQuery: string,
  data: Record<string, unknown>[],
  sql: string,
): Promise<string[]> {
  if (!data || data.length === 0) {
    return ["No data was returned for this query."];
  }

  const sampleData = JSON.stringify(data.slice(0, 50), null, 2);

  const prompt = `You are a business data analyst. Given the following SQL query result data, generate 3-5 concise, actionable business insights.

User Question: ${userQuery}

SQL Used: ${sql}

Data Sample (first 50 rows):
${sampleData}

Total rows returned: ${data.length}

Rules:
1. Generate exactly 3-5 insights as a JSON array of strings
2. Each insight should be a single clear sentence
3. Focus on patterns, trends, top performers, anomalies
4. Use specific numbers/percentages from the data when possible
5. Return ONLY a valid JSON array, no markdown, no explanation
6. Example format: ["West region generated the highest revenue at $X.", "Electronics contributed 42% of total sales."]

Insights:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    const text = (response.text ?? "").trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
      return parsed.slice(0, 5);
    }
  } catch {
    // fallback below
  }

  return [
    `Query returned ${data.length} rows of data.`,
    "Review the charts above for visual patterns and trends.",
  ];
}
