import * as v from "valibot";
import pMemoize from "p-memoize";
import { cache } from "../paths.ts";
import axios from "axios";

const FNGGItems = v.record(v.string(), v.string());

async function _getFNGGItems() {
  const { data } = await axios.get("https://fortnite.gg/api/items.json");
  return v.parse(FNGGItems, await data);
}
export const getFNGGItems = pMemoize(_getFNGGItems);

const FNGGBundle = v.object({
  items: v.array(v.string()),
});
const FNGGBundles = v.record(v.string(), FNGGBundle);

async function _getFNGGBundles() {
  const { data } = await axios.get("https://fortnite.gg/api/bundles.json");
  return v.parse(FNGGBundles, data);
}
export const getFNGGBundles = pMemoize(_getFNGGBundles);

const cacheDir = cache.join("packs");
const PackCache = v.array(v.string());
export async function getPackContents(id: string | number) {
  const cacheFile = cacheDir.join(`${id}.json`);
  const cacheData = v.safeParse(PackCache, await cacheFile.readMaybeJson());
  if (cacheData.success) return cacheData.output;

  const { data } = await axios.get<string>(
    `https://fortnite.gg/item-details?id=${id}`,
    { responseType: "text" }
  );

  const matches = data.matchAll(/a href='\/cosmetics\?id=(\d+)'/gi);
  const ret = matches.toArray().map((v) => v[1]);
  if (!ret.length) return undefined;
  await cacheFile.ensureFile();
  await cacheFile.writeJson(ret);
  return ret;
}
