import * as z from "zod";
import pMemoize from "p-memoize";
import { USER_AGENT } from "../const.ts";

const FNAPICosmetics = z.object({
  status: z.literal(200),
  data: z.array(
    z.object({
      id: z.string(),
      builtInEmoteIds: z.optional(z.array(z.string())),
    }),
  ),
});

async function _getFNAPICosmetics() {
  const resp = await fetch("https://fortnite-api.com/v2/cosmetics/br", {
    headers: { "User-Agent": USER_AGENT },
  });
  const json = await resp.json();
  return FNAPICosmetics.parse(json);
}
/** @deprecated Fecooo API is preferred */
export const getFNAPICosmetics = pMemoize(_getFNAPICosmetics);
