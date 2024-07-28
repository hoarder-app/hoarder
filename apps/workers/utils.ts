import PDFParser from "pdf2json";

export function withTimeout<T, Ret>(
  func: (param: T) => Promise<Ret>,
  timeoutSec: number,
) {
  return async (param: T): Promise<Ret> => {
    return await Promise.race([
      func(param),
      new Promise<Ret>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error(`Timed-out after ${timeoutSec} secs`)),
          timeoutSec * 1000,
        ),
      ),
    ]);
  };
}

export async function readPDFText(buffer: Buffer): Promise<{
  text: string;
  metadata: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true); // Changed 1 to true
    pdfParser.on("pdfParser_dataError", reject);
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const metadata: Record<string, string> = Object.entries(
        pdfData.Meta,
      ).reduce(
        (acc, [key, value]) => {
          acc[key] =
            typeof value === "object" ? JSON.stringify(value) : String(value); // Convert object values to strings
          return acc;
        },
        {} as Record<string, string>,
      );

      resolve({
        text: (
          pdfParser as unknown as { getRawTextContent: () => string }
        ).getRawTextContent(),
        metadata: metadata,
      });
    });
    pdfParser.parseBuffer(buffer);
  });
}

export function truncateContent(content: string, length = 1500) {
  let words = content.split(" ");
  if (words.length > length) {
    words = words.slice(0, length);
    content = words.join(" ");
  }
  return content;
}
