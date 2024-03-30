import { MeiliSearch, Index } from "meilisearch";
import serverConfig from "./config";
import { z } from "zod";

export const zBookmarkIdxSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string().nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  content: z.string().nullish(),
  note: z.string().nullish(),
  tags: z.array(z.string()).default([]),
});

export type ZBookmarkIdx = z.infer<typeof zBookmarkIdxSchema>;

let searchClient: MeiliSearch | undefined;

if (serverConfig.meilisearch) {
  searchClient = new MeiliSearch({
    host: serverConfig.meilisearch.address,
    apiKey: serverConfig.meilisearch.key,
  });
}

const BOOKMARKS_IDX_NAME = "bookmarks";

let idxClient: Index<ZBookmarkIdx> | undefined;

export async function getSearchIdxClient(): Promise<Index<ZBookmarkIdx> | null> {
  if (idxClient) {
    return idxClient;
  }
  if (!searchClient) {
    return null;
  }

  const indicies = await searchClient.getIndexes();
  let idxFound = indicies.results.find((i) => i.uid == BOOKMARKS_IDX_NAME);
  if (!idxFound) {
    const idx = await searchClient.createIndex(BOOKMARKS_IDX_NAME, {
      primaryKey: "id",
    });
    await searchClient.waitForTask(idx.taskUid);
    idxFound = await searchClient.getIndex<ZBookmarkIdx>(BOOKMARKS_IDX_NAME);
    const taskId = await idxFound.updateFilterableAttributes(["id", "userId"]);
    await searchClient.waitForTask(taskId.taskUid);
  }
  return idxFound;
}
