import axios from "axios";
import { z } from "zod/v4-mini";
import pMemoize from "p-memoize";

// APIs provided by Fecooo on GitHub:
// https://github.com/Fecooo/FNGGLocker

const FecoooOffers = z.record(z.string(), z.number());

async function _getFecoooOffers() {
  const { data } = await axios.get("https://api.fecooo.hu/fngg/offers");
  return FecoooOffers.parse(data);
}
export const getFecoooOffers = pMemoize(_getFecoooOffers);

const FecoooBuiltins = z.record(z.string(), z.string());

async function _getFecoooBuiltins() {
  const { data } = await axios.get("https://api.fecooo.hu/fngg/builtins");
  return FecoooBuiltins.parse(data);
}
export const getFecoooBuiltins = pMemoize(_getFecoooBuiltins);
