const API_URL = "http://127.0.0.1:8000/analyze_labs";

export async function analyzeLabs(labs) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labs }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Unable to analyze labs.");
  }

  return data;
}
