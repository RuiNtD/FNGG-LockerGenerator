import { z } from "zod/v4-mini";
import pMemoize from "p-memoize";
import axios from "axios";

const FNAPICosmetics = z.object({
  status: z.literal(200),
  data: z.array(
    z.object({
      id: z.string(),
      builtInEmoteIds: z.optional(z.array(z.string())),
    })
  ),
});

async function _getFNAPICosmetics() {
  const { data } = await axios.get("https://fortnite-api.com/v2/cosmetics/br");
  return FNAPICosmetics.parse(data);
}
/** @deprecated Fecooo API is preferred */
export const getFNAPICosmetics = pMemoize(_getFNAPICosmetics);
