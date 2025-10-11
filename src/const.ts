import denoJson from "../deno.json" with { type: "json" };

const baseAgent = "github.com/RuiNtD/FNGG-LockerGenerator";

const isCompiled = Deno.build.standalone;
let _VERSION_ = denoJson.version;
if (!isCompiled) _VERSION_ += " (dev)";
export { _VERSION_ };

export const USER_AGENT = `${baseAgent} v${_VERSION_}`;
