#!/usr/bin/env -S deno -A

import {
  createDeviceAuth,
  getProfile,
  getAccessToken,
  waitForDeviceCodeCompletion,
  getBannerProfile,
  EpicAccount,
} from "./EpicAPI.ts";
import { getFNGGBundles, getFNGGItems, getPackContents } from "./FNGGAPI.ts";
import { getFNAPICosmetics } from "./FNAPI.ts";
import process from "node:process";
import * as zlib from "node:zlib";
import { shortenURL } from "./shortener.ts";
import $ from "@david/dax";
import { bold, blue } from "@std/fmt/colors";
import { format as formatDuration } from "@std/fmt/duration";

let account: EpicAccount | undefined;
while (!account) {
  try {
    const accessToken = await getAccessToken();
    const deviceAuth = await createDeviceAuth(accessToken);

    console.clear();
    $.log(bold("Please sign into Fortnite using this link:"));
    $.log(deviceAuth.verification_uri_complete);
    $.log();
    $.log("Or go to:", deviceAuth.verification_uri);
    $.log("And enter the code:", deviceAuth.user_code);
    $.log();
    $.logLight(
      "This code will expire in",
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
  process.exit();

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

$.logStep("Found", locker.length, "items");

const shortened = await shortenURL(url);
$.logStep("Locker URL:", shortened);
alert(bold(blue("Press Enter to close")));
