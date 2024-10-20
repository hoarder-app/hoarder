import os from "os";
import PDFParser from "pdf2json";
import { createWorker } from "tesseract.js";

import serverConfig from "@hoarder/shared/config";

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

export async function readImageText(buffer: Buffer) {
  if (serverConfig.ocr.langs.length == 1 && serverConfig.ocr.langs[0] == "") {
    return null;
  }
  const worker = await createWorker(serverConfig.ocr.langs, undefined, {
    cachePath: serverConfig.ocr.cacheDir ?? os.tmpdir(),
  });
  try {
    const ret = await worker.recognize(buffer);
    if (ret.data.confidence <= serverConfig.ocr.confidenceThreshold) {
      return null;
    }
    return ret.data.text;
  } finally {
    await worker.terminate();
  }
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
