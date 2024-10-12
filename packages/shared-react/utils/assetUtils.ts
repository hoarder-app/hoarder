export function getAssetUrl(assetId: string, preview?: boolean) {
  return `/api/assets/${assetId}${preview ? "?preview" : ""}`;
}
