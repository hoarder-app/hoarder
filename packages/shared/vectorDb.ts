import path from "path";
import * as lancedb from "@lancedb/lancedb";
import { Field, FixedSizeList, Float32, Schema, Utf8 } from "apache-arrow";

import serverConfig from "./config";

export async function getBookmarkVectorDb() {
  const dbPath = path.join(serverConfig.dataDir, "vectordb");
  const db = await lancedb.connect(dbPath);
  const table = db.createEmptyTable(
    "bookmarks",
    new Schema([
      new Field(
        "vector",
        new FixedSizeList(1536, new Field("item", new Float32(), true)),
      ),
      new Field("bookmarkid", new Utf8()),
    ]),
    {
      mode: "create",
      existOk: true,
    },
  );
  return table;
}
