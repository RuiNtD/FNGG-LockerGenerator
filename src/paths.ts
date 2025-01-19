import $ from "@david/dax";
import envPaths from "env-paths";
const paths = envPaths("FNGG-LockerGenerator");

export const cache = $.path(paths.cache);
export const config = $.path(paths.config);
export const data = $.path(paths.data);
export const log = $.path(paths.log);
export const temp = $.path(paths.temp);
