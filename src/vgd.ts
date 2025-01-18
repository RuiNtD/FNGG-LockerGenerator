import axios from "axios";
import * as v from "@valibot/valibot";

export async function shortenURL(url: string): Promise<string> {
  const { data } = await axios.get("https://v.gd/create.php", {
    params: { format: "simple", url },
  });
  return v.parse(v.string(), data);
}

if (import.meta.main) {
  console.log(
    await shortenURL(
      "https://maps.google.co.uk/maps?f=q&source=s_q&hl=en&geocode=&q=louth&sll=53.800651,-4.064941&sspn=33.219383,38.803711&ie=UTF8&hq=&hnear=Louth,+United+Kingdom&ll=53.370272,-0.004034&spn=0.064883,0.075788&z=14"
    )
  );
}
