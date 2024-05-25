function extractUrls(html: string): string[] {
  const regex = /<a\s+(?:[^>]*?\s+)?href="(http[^"]*)"/gi;
  let match;
  const urls = [];

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

export async function parseNetscapeBookmarkFile(file: File) {
  const textContent = await file.text();
  if (!textContent.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>")) {
    throw Error("The uploaded html file does not seem to be a bookmark file");
  }

  return extractUrls(textContent).map((url) => new URL(url));
}
