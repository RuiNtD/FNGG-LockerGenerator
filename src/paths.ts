import $ from "@david/dax";
import { dir } from "@cross/dir";

const cacheDir = $.path(await dir("cache", true));
export const cache = cacheDir.join("FNGGLockerGenerator");

// Migration
const oldCache = cacheDir.join("FNGGLockerGenerator-nodejs");
if ((await oldCache.exists()) && !(await cache.exists()))
  await oldCache.rename(cache);
