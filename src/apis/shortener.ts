import * as z from "zod";
import { USER_AGENT } from "../const.ts";
import ky from "ky";

const SpoomeResp = z
  .object({ short_url: z.string() })
  .transform((v) => v.short_url);
export async function shortenURL(url: string): Promise<string> {
  return await ky
    .post("https://spoo.me/", {
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ url, "max-clicks": "1" }),
    })
    .json(SpoomeResp);
}

if (import.meta.main) {
  console.log(
    await shortenURL(
      "https://maps.google.co.uk/maps?f=q&source=s_q&hl=en&geocode=&q=louth&sll=53.800651,-4.064941&sspn=33.219383,38.803711&ie=UTF8&hq=&hnear=Louth,+United+Kingdom&ll=53.370272,-0.004034&spn=0.064883,0.075788&z=14",
    ),
  );
}
