import type { Result as PDFResult } from "pdf-parse";
import pdf from "pdf-parse";

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

export async function readPDFText(buffer: Buffer): Promise<PDFResult> {
  return new Promise((resolve, reject) => {
    pdf(buffer).then((data) => {
      if (!data) reject(new Error("Failed to read PDF"));
      resolve(data);
    });
  });
}
