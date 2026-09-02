const API_URL = "http://127.0.0.1:8000/analyze_labs";
const STREAM_API_URL = "http://127.0.0.1:8000/analyze_labs/stream";

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

export async function analyzeLabsStream(labs, onEvent) {
  const response = await fetch(STREAM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ labs }),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Unable to stream lab analysis.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.event === "error") {
        throw new Error(event.detail);
      }
      onEvent(event);
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer);
    if (event.event === "error") {
      throw new Error(event.detail);
    }
    onEvent(event);
  }
}
