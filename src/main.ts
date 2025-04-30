#!/usr/bin/env -S deno -A

import {
  createDeviceAuth,
  getProfile,
  getAccessToken,
  waitForDeviceCodeCompletion,
  getBannerProfile,
  EpicAccount,
} from "./apis/Epic.ts";
import { getFNGGBundles, getFNGGItems, getPackContents } from "./apis/FNGG.ts";
import { getFNAPICosmetics } from "./apis/FNAPI.ts";
import * as zlib from "node:zlib";
import { shortenURL } from "./apis/shortener.ts";
import $ from "@david/dax";
import { bold, blue, underline } from "@std/fmt/colors";
import { format as formatDuration } from "@std/fmt/duration";
import { parseArgs } from "@std/cli/parse-args";
import { delay } from "@std/async/delay";
import axios from "axios";

const _USER_AGENT_ = "github.com/RuiNtD/FNGG-LockerGenerator";
let _VERSION_ = "1.0.1";

const argv = parseArgs(Deno.args, {
  boolean: ["compiled"],
});

const isCompiled = argv.compiled;
if (!isCompiled) _VERSION_ += " (dev)";
export { _VERSION_ };

axios.defaults.headers["User-Agent"] = `${_USER_AGENT_} v${_VERSION_}`;

const header = bold(underline(`Fortnite.GG Locker Generator v${_VERSION_}`));

console.clear();
$.log(header);
// Articifical delay so the version still shows even if it crashes
await delay(1000);

let account: EpicAccount | undefined;
while (!account) {
  try {
    const accessToken = await getAccessToken();
    const deviceAuth = await createDeviceAuth(accessToken);

    console.clear();
    $.log(header);
    $.log();
    $.log(bold("Please sign into Fortnite using this link:"));
    $.log(deviceAuth.verification_uri_complete);
    $.log();
    $.log("Or go to:", deviceAuth.verification_uri);
    $.log("And enter the code:", deviceAuth.user_code);
    $.log();
    $.logLight(
      "This code will expire after",
      formatDuration(deviceAuth.expires_in * 1000, { ignoreZero: true })
    );
    $.log();

    account = await waitForDeviceCodeCompletion(deviceAuth);
  } catch (e) {
    if (e != "expired") throw e;
  }
}

console.clear();
$.logStep("Signed in", `as ${account.displayName}`);

if (!(await $.confirm("Do you want to start the process?", { default: true })))
  Deno.exit();

let locker: string[] = [];

const pb = $.progress("Counting cosmetics");
const url = await pb.with(async () => {
  const profile = await getProfile(account);
  const accountItems = profile.items;
  const bannerItems = (await getBannerProfile(account)).items;

  const allItems = [
    ...Object.keys(accountItems).map(
      (item) => accountItems[item].templateId.split(":")[1]
    ),
    ...Object.keys(bannerItems).map(
      (item) => bannerItems[item].templateId.split(":")[1]
    ),
  ];

  const fnggItems = await getFNGGItems();
  const fnggItemsKeys = Object.keys(fnggItems);
  const fnggItemsLowercase = fnggItemsKeys.map((x) => x.toLowerCase());

  for (const item of allItems) {
    if (fnggItemsLowercase.includes(item)) {
      const originalId =
        fnggItemsKeys[fnggItemsLowercase.indexOf(item.toLowerCase())];
      locker.push(originalId);
    }
  }

  // Add built-in emotes
  pb.message("built-in emotes");
  const cosmetics = await getFNAPICosmetics();
  for (const id of locker) {
    const cosmetic = cosmetics.data.find((x) => x.id === id);
    if (!cosmetic) continue;
    for (const emote of cosmetic.builtInEmoteIds || []) locker.push(emote);
  }

  pb.message("bundles and packs");

  // Add bundles
  const allBundles = await getFNGGBundles();
  for (const [bundle, { items }] of Object.entries(allBundles)) {
    let owned = true;
    for (const item of items) {
      if (!locker.includes(item)) {
        owned = false;
        break;
      }
    }
    if (owned) locker.push(bundle);
  }

  // Packs
  for (const [fnID, ggID] of Object.entries(fnggItems)) {
    if (!fnID.startsWith("Pack_")) continue;
    const items = await getPackContents(ggID);
    if (!items) continue;

    let owned = true;
    for (const item of items) {
      const itemID = fnggItemsKeys.find((x) => fnggItems[x] === item);
      if (!itemID) continue;
      if (!locker.includes(itemID)) {
        owned = false;
        break;
      }
    }
    if (owned) locker.push(fnID);
  }

  pb.prefix("Finalizing...");
  pb.message("");

  // Finalize
  locker = [...new Set(locker)]; // Remove duplicates
  const ints = locker
    .map((id) => parseInt(fnggItems[id]))
    .sort((a, b) => a - b);
  const diff = ints.map((value, index) =>
    index > 0 ? value - ints[index - 1] : value
  );

  const data = zlib
    .deflateRawSync(`${profile.created},${diff.join(",")}`)
    .toString("base64url");
  return `https://fortnite.gg/my-locker?items=${data}`;
});

$.logStep(`Found ${locker.length} items`);

const shortened = await shortenURL(url);
$.log(bold("Locker URL:"), shortened);
alert(bold(blue("Press Enter to close")));
