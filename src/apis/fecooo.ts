import axios from "axios";
import * as v from "valibot";
import pMemoize from "p-memoize";

// APIs provided by Fecooo on GitHub:
// https://github.com/Fecooo/FNGGLocker

const FecoooOffers = v.record(v.string(), v.number());

async function _getFecoooOffers() {
  const { data } = await axios.get("https://api.fecooo.hu/fngg/offers");
  return v.parse(FecoooOffers, await data);
}
export const getFecoooOffers = pMemoize(_getFecoooOffers);

const FecoooBuiltins = v.record(v.string(), v.string());

async function _getFecoooBuiltins() {
  const { data } = await axios.get("https://api.fecooo.hu/fngg/builtins");
  return v.parse(FecoooBuiltins, await data);
}
export const getFecoooBuiltins = pMemoize(_getFecoooBuiltins);
