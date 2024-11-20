#!/usr/bin/env -S deno -A

import clipboard from "clipboardy";
import {
  createDeviceCode,
  get_profile as getProfile,
  getAccessToken,
  wait_for_device_code_completion as waitForDeviceCodeCompletion,
} from "./EpicAPI.ts";
import { getFNGGBundles, getFNGGItems } from "./FNGGAPI.ts";
import open from "open";
import { getFNAPICosmetics } from "./FNAPI.ts";
import { delay } from "@std/async/delay";
import process from "node:process";
import { confirm } from "@inquirer/prompts";
import * as zlib from "node:zlib";

const VERSION = "2.0";

const access_token = await getAccessToken();

console.info("Opening device code link in a new tab...");
const { device_code, verification_uri_complete } = await createDeviceCode(
  access_token
);
await open(verification_uri_complete);

const account = await waitForDeviceCodeCompletion(device_code);
const data = await getProfile(account);

console.info(`Logged in as: ${account.displayName}\n`);

if (!(await confirm({ message: "Do you want to start the process?" }))) {
  console.info(`Closing LockerGenerator v${VERSION}...`);
  await delay(1);
  process.exit();
}

const accountItems = data.profileChanges[0].profile.items;
const athenaCreationDate = data.profileChanges[0].profile.created;

console.info("Generating the locker...");
const allItems = Object.keys(accountItems).map(
  (item) => accountItems[item].templateId.split(":")[1]
);

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

console.log("Found", locker.length, "items.");

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

// Finalize
locker = [...new Set(locker)]; // Remove duplicates
const ints = locker.map((id) => parseInt(fnggItems[id])).sort();
const diff = ints.map((value, index) =>
  (index > 0 ? value - ints[index - 1] : value).toString()
);

const compressed = zlib.deflateRawSync([athenaCreationDate, ...diff].join(","));
const encoded = compressed.toString("base64url");

// const compressed = Bun.deflateSync(`${athenaCreationDate},${diff.join(",")}`);
// const encoded = Buffer.from(compressed).toString("base64url");

const url = `https://fortnite.gg/my-locker?items=${encoded}`;
await clipboard.write(url);
await open(url);

console.log("Link successfully copied to the clipboard.");
alert("Press Enter to close...");

// For some reason inquirer stops Deno from exiting smoothly
process.exit();
