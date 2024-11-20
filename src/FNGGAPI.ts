import * as v from "valibot";
import pMemoize from "p-memoize";

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
