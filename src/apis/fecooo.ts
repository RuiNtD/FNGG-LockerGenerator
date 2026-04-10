import * as z from "zod";
import pMemoize from "p-memoize";
import { USER_AGENT } from "../const.ts";
import ky from "ky";

// APIs provided by Fecooo on GitHub:
// https://github.com/Fecooo/FNGGLocker

const api = ky.create({
  baseUrl: "https://api.fecooo.hu/fngg/",
  headers: { "User-Agent": USER_AGENT },
});

const FecoooOffers = z.record(z.string(), z.number());
async function _getFecoooOffers() {
  return await api("offers").json(FecoooOffers);
}
export const getFecoooOffers = pMemoize(_getFecoooOffers);

const FecoooBuiltins = z.record(z.string(), z.string());
async function _getFecoooBuiltins() {
  return await api("builtins").json(FecoooBuiltins);
}
export const getFecoooBuiltins = pMemoize(_getFecoooBuiltins);
