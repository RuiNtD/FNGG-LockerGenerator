import * as z from "zod";
import pMemoize from "p-memoize";
import { cache } from "../paths.ts";
import { USER_AGENT } from "../const.ts";
import { isTruthy } from "../util.ts";

const FNGGItems = z.record(z.string(), z.string());

async function _getFNGGItems() {
  const resp = await fetch("https://fortnite.gg/api/items.json", {
    headers: { "User-Agent": USER_AGENT },
  });
  const json = await resp.json();
  return FNGGItems.parse(json);
}
export const getFNGGItems = pMemoize(_getFNGGItems);

async function _getFNGGItemsKeys() {
  return Object.keys(await getFNGGItems());
}
export const getFNGGItemsKeys = pMemoize(_getFNGGItemsKeys);

async function _getFNGGItemsLowercase() {
  const keys = await getFNGGItemsKeys();
  return keys.map((x) => x.toLowerCase());
}
export const getFNGGItemsLowercase = pMemoize(_getFNGGItemsLowercase);

export async function fixFnId(templateId: string) {
  const keys = await getFNGGItemsKeys();
  const lowercase = await getFNGGItemsLowercase();
  return keys[lowercase.indexOf(templateId.toLowerCase())];
}

export async function fnToFngg(templateId: string) {
  const items = await getFNGGItems();
  const fixed = await fixFnId(templateId);
  if (!fixed) return;
  const item = items[fixed];
  if (!item) return;
  return parseInt(item);
}

export async function fnggToFn(id: string | number) {
  id = `${id}`;
  const items = await getFNGGItems();
  for (const [key, value] of Object.entries(items))
    if (value === id) return key;
  return undefined;
}

const FNGGBundle = z.object({
  items: z
    .array(z.string().or(z.literal(false)))
    .transform((arr) => arr.filter(isTruthy)),
});
const FNGGBundles = z.record(z.string(), FNGGBundle);

async function _getFNGGBundles() {
  const resp = await fetch("https://fortnite.gg/api/bundles.json", {
    headers: { "User-Agent": USER_AGENT },
  });
  const json = await resp.json();
  return FNGGBundles.parse(json);
}
export const getFNGGBundles = pMemoize(_getFNGGBundles);

const cacheDir = cache.join("packs");
const PackCache = z.array(z.string());
/** @deprecated Fecooo API is preferred */
export async function getPackContents(id: string | number) {
  const cacheFile = cacheDir.join(`${id}.json`);
  const cacheData = PackCache.safeParse(await cacheFile.readMaybeJson());
  if (cacheData.success) return cacheData.data;

  const resp = await fetch(`https://fortnite.gg/item-details?id=${id}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  const data = await resp.text();

  const matches = data.matchAll(/a href='\/cosmetics\?id=(\d+)'/gi);
  const ret = matches.toArray().map((v) => v[1]);
  if (!ret.length) return;
  await cacheFile.ensureFile();
  await cacheFile.writeJson(ret);
  return ret;
}
