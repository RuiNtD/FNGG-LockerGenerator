import * as z from "zod";
import pMemoize from "p-memoize";
import { USER_AGENT } from "../const.ts";
import { assert } from "@std/assert";

// APIs provided by Fecooo on GitHub:
// https://github.com/Fecooo/FNGGLocker

const FecoooOffers = z.record(z.string(), z.number());

async function _getFecoooOffers() {
  const resp = await fetch("https://api.fecooo.hu/fngg/offers", {
    headers: { "User-Agent": USER_AGENT },
  });
  assert(resp.ok, resp.statusText);

  const json = await resp.json();
  return FecoooOffers.parse(json);
}
export const getFecoooOffers = pMemoize(_getFecoooOffers);

const FecoooBuiltins = z.record(z.string(), z.string());

async function _getFecoooBuiltins() {
  const resp = await fetch("https://api.fecooo.hu/fngg/builtins", {
    headers: { "User-Agent": USER_AGENT },
  });
  assert(resp.ok, resp.statusText);

  const json = await resp.json();
  return FecoooBuiltins.parse(json);
}
export const getFecoooBuiltins = pMemoize(_getFecoooBuiltins);
