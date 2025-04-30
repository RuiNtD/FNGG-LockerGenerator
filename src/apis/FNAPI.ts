import * as v from "valibot";
import pMemoize from "p-memoize";
import axios from "axios";

const FNAPICosmetics = v.object({
  status: v.literal(200),
  data: v.array(
    v.object({
      id: v.string(),
      builtInEmoteIds: v.optional(v.array(v.string())),
    }),
  ),
});

async function _getFNAPICosmetics() {
  const { data } = await axios.get("https://fortnite-api.com/v2/cosmetics/br");
  return v.parse(FNAPICosmetics, data);
}
export const getFNAPICosmetics = pMemoize(_getFNAPICosmetics);
