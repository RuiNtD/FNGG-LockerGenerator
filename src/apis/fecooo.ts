import * as z from "zod";
import pMemoize from "p-memoize";
import { USER_AGENT } from "../const.ts";

// APIs provided by Fecooo on GitHub:
// https://github.com/Fecooo/FNGGLocker

const FecoooOffers = z.record(z.string(), z.number());

async function _getFecoooOffers() {
  const resp = await fetch("https://api.fecooo.hu/fngg/offers", {
    headers: { "User-Agent": USER_AGENT },
  });
  const json = await resp.json();
  return FecoooOffers.parse(json);
}
export const getFecoooOffers = pMemoize(_getFecoooOffers);

const FecoooBuiltins = z.record(z.string(), z.string());

async function _getFecoooBuiltins() {
  const resp = await fetch("https://api.fecooo.hu/fngg/builtins", {
    headers: { "User-Agent": USER_AGENT },
  });
  const json = await resp.json();
  return FecoooBuiltins.parse(json);
}
export const getFecoooBuiltins = pMemoize(_getFecoooBuiltins);
