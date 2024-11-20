import * as v from "valibot";
import pMemoize from "p-memoize";

const FNAPICosmetics = v.object({
  status: v.literal(200),
  data: v.array(
    v.object({
      id: v.string(),
      builtInEmoteIds: v.optional(v.array(v.string())),
    })
  ),
});

async function _getFNAPICosmetics() {
  const resp = await fetch("https://fortnite-api.com/v2/cosmetics/br");
  return v.parse(FNAPICosmetics, await resp.json());
}
export const getFNAPICosmetics = pMemoize(_getFNAPICosmetics);
