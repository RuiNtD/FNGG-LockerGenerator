import * as v from "@valibot/valibot";
import pMemoize from "p-memoize";
import $ from "@david/dax";

const FNGGItems = v.record(v.string(), v.string());

async function _getFNGGItems() {
  const resp = await fetch("https://fortnite.gg/api/items.json");
  return v.parse(FNGGItems, await resp.json());
}
export const getFNGGItems = pMemoize(_getFNGGItems);

const FNGGBundle = v.object({
  items: v.array(v.string()),
});
const FNGGBundles = v.record(v.string(), FNGGBundle);

async function _getFNGGBundles() {
  const resp = await fetch("https://fortnite.gg/api/bundles.json");
  return v.parse(FNGGBundles, await resp.json());
}
export const getFNGGBundles = pMemoize(_getFNGGBundles);

const cacheDir = await $.path("cache/packs").ensureDir();
const PackCache = v.array(v.string());
export async function getPackContents(id: string) {
  const cacheFile = cacheDir.join(`${id}.json`);
  const cacheData = v.safeParse(PackCache, await cacheFile.readMaybeJson());
  if (cacheData.success) return cacheData.output;

  const url = `https://fortnite.gg/item-details?id=${id}`;
  const resp = await fetch(url);
  const text = await resp.text();

  const matches = text.matchAll(/a href='\/cosmetics\?id=(\d+)'/gi);
  const ret = matches.toArray().map((v) => v[1]);
  if (!ret.length) return undefined;
  await cacheFile.writeJson(ret);
  return ret;
}
