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
    // Need raw text flag represents as number (1), reference : https://github.com/modesty/pdf2json/issues/76#issuecomment-236569265
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", reject);
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      resolve({
        // The type isn't set correctly, reference : https://github.com/modesty/pdf2json/issues/327
        // eslint-disable-next-line
        text: (pdfParser as any).getRawTextContent(),
        metadata: pdfData.Meta,
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
