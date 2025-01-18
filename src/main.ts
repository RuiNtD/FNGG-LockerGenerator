#!/usr/bin/env -S deno -A

import clipboard from "clipboardy";
import {
  createDeviceCode,
  getProfile,
  getAccessToken,
  waitForDeviceCodeCompletion,
  getBannerProfile,
} from "./EpicAPI.ts";
import { getFNGGBundles, getFNGGItems, getPackContents } from "./FNGGAPI.ts";
import open from "open";
import { getFNAPICosmetics } from "./FNAPI.ts";
import { delay } from "@std/async/delay";
import process from "node:process";
import * as zlib from "node:zlib";
import { parseArgs } from "@std/cli/parse-args";
import { shortenURL } from "./vgd.ts";

const args = parseArgs(Deno.args, {
  boolean: ["shorten"],
});

const access_token = await getAccessToken();
const { device_code, verification_uri_complete } = await createDeviceCode(
  access_token
);

console.log(`Please login to Fortnite: ${verification_uri_complete}`);
await open(verification_uri_complete);

const account = await waitForDeviceCodeCompletion(device_code);
console.log();
console.log(`Signed in as ${account.displayName}`);

if (!confirm("Do you want to start the process?")) {
  console.log("Closing...");
  await delay(1);
  process.exit();
}

console.log();
console.log("Generating the locker...");

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

let locker: string[] = [];
const fnggItems = await getFNGGItems();
const fnggItemsLowercase = Object.keys(fnggItems).map((x) => x.toLowerCase());

for (const item of allItems) {
  if (fnggItemsLowercase.includes(item)) {
    const originalId =
      Object.keys(fnggItems)[fnggItemsLowercase.indexOf(item.toLowerCase())];
    locker.push(originalId);
  }
}

// Add built-in emotes
const cosmetics = await getFNAPICosmetics();
for (const id of locker) {
  const cosmetic = cosmetics.data.find((x) => x.id === id);
  if (!cosmetic) continue;
  for (const emote of cosmetic.builtInEmoteIds || []) locker.push(emote);
}

// Add bundles
const allBundles = await getFNGGBundles();
for (const [bundle, { items }] of Object.entries(allBundles)) {
  let bundleOwned = true;
  for (const item of items) {
    if (!locker.includes(item)) {
      bundleOwned = false;
      break;
    }
  }
  if (bundleOwned) locker.push(bundle);
}

// Packs
for (const [fnID, ggID] of Object.entries(fnggItems)) {
  if (!fnID.startsWith("Pack_")) continue;
  const items = await getPackContents(ggID);
  if (!items) continue;

  let bundleOwned = true;
  for (const item of items) {
    const itemID = Object.keys(fnggItems).find((x) => fnggItems[x] === item);
    if (!itemID) continue;
    if (!locker.includes(itemID)) {
      bundleOwned = false;
      break;
    }
  }
  if (bundleOwned) locker.push(fnID);
}

// Finalize
locker = [...new Set(locker)]; // Remove duplicates
const ints = locker.map((id) => parseInt(fnggItems[id])).sort((a, b) => a - b);
const diff = ints.map((value, index) =>
  index > 0 ? value - ints[index - 1] : value
);

const compressed = zlib.deflateRawSync([profile.created, ...diff].join(","));
const encoded = compressed.toString("base64url");

console.log("Found", locker.length, "items.");
console.log();

let url = `https://fortnite.gg/my-locker?items=${encoded}`;
if (args.shorten) url = await shortenURL(url);
console.log(url);
try {
  await clipboard.write(url);
  await open(url);
} catch {
  //
}
alert("Press Enter to close...");

// For some reason inquirer stops Deno from exiting smoothly
process.exit();
