import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

import serverConfig from "./config";

const ROOT_PATH = path.join(serverConfig.dataDir, "assets");

function getAssetDir(userId: string, assetId: string) {
  return path.join(ROOT_PATH, userId, assetId);
}

export const zAssetMetadataSchema = z.object({
  contentType: z.string(),
});

export async function saveAsset({
  userId,
  assetId,
  asset,
  metadata,
}: {
  userId: string;
  assetId: string;
  asset: Buffer;
  metadata: z.infer<typeof zAssetMetadataSchema>;
}) {
  const assetDir = getAssetDir(userId, assetId);
  await fs.promises.mkdir(assetDir, { recursive: true });

  await Promise.all([
    fs.promises.writeFile(path.join(assetDir, "asset.bin"), asset),
    fs.promises.writeFile(
      path.join(assetDir, "metadata.json"),
      JSON.stringify(metadata),
    ),
  ]);
}

export async function readAsset({
  userId,
  assetId,
}: {
  userId: string;
  assetId: string;
}) {
  const assetDir = getAssetDir(userId, assetId);

  const [asset, metadataStr] = await Promise.all([
    fs.promises.readFile(path.join(assetDir, "asset.bin")),
    fs.promises.readFile(path.join(assetDir, "metadata.json"), {
      encoding: "utf8",
    }),
  ]);

  const metadata = zAssetMetadataSchema.parse(JSON.parse(metadataStr));
  return { asset, metadata };
}

export async function deleteAsset({
  userId,
  assetId,
}: {
  userId: string;
  assetId: string;
}) {
  const assetDir = getAssetDir(userId, assetId);
  await fs.promises.rm(path.join(assetDir), { recursive: true });
}

export async function deleteUserAssets({ userId }: { userId: string }) {
  const userDir = path.join(ROOT_PATH, userId);
  const dirExists = await fs.promises
    .access(userDir)
    .then(() => true)
    .catch(() => false);
  if (!dirExists) {
    return;
  }
  await fs.promises.rm(userDir, { recursive: true });
}
