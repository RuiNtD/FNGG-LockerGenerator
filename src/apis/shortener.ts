import * as z from "zod";
import { USER_AGENT } from "../const.ts";

const SpoomeResp = z.object({
  short_url: z.string(),
});

export async function shortenURL(url: string): Promise<string> {
  const resp = await fetch("https://spoo.me/", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ url, "max-clicks": "1" }),
  });
  const json = await resp.json();
  return SpoomeResp.parse(json).short_url;
}

if (import.meta.main) {
  console.log(
    await shortenURL(
      "https://maps.google.co.uk/maps?f=q&source=s_q&hl=en&geocode=&q=louth&sll=53.800651,-4.064941&sspn=33.219383,38.803711&ie=UTF8&hq=&hnear=Louth,+United+Kingdom&ll=53.370272,-0.004034&spn=0.064883,0.075788&z=14",
    ),
  );
}
