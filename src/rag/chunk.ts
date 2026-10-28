export function chunkText(text: string, chunkSize = 50, overlap = 20): string[] {
  if (chunkSize <= overlap) {
    throw new Error("chunkSize must be greater than overlap");
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));

    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}
