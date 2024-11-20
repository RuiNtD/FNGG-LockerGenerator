import axios from "axios";
import { delay } from "@std/async/delay";
import * as v from "valibot";
const SWITCH_TOKEN =
  "OThmN2U0MmMyZTNhNGY4NmE3NGViNDNmYmI0MWVkMzk6MGEyNDQ5YTItMDAxYS00NTFlLWFmZWMtM2U4MTI5MDFjNGQ3";

const http = axios.create({
  headers: { "User-Agent": `github.com/RuiNtD/FNGG-LockerGenerator` },
});

const OAuthToken = v.object({
  access_token: v.string(),
});

export async function getAccessToken() {
  const { data } = await http.post(
    "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
    { grant_type: "client_credentials" },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${SWITCH_TOKEN}`,
      },
    }
  );
  return v.parse(OAuthToken, data).access_token;
}

export const OAuthDeviceAuth = v.object({
  verification_uri_complete: v.string(),
  device_code: v.string(),
});

export async function createDeviceCode(accessToken: string) {
  const { data } = await http.post(
    "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/deviceAuthorization",
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return v.parse(OAuthDeviceAuth, data);
}

const EpicAccount = v.object({
  access_token: v.string(),
  displayName: v.string(),
  account_id: v.string(),
});
type EpicAccount = v.InferOutput<typeof EpicAccount>;

export async function wait_for_device_code_completion(code: string) {
  console.info("Waiting for authentication...");

  while (true) {
    try {
      const resp = await http.post(
        "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token",
        { grant_type: "device_code", device_code: code },
        {
          headers: {
            Authorization: `Basic ${SWITCH_TOKEN}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return v.parse(EpicAccount, resp.data);
    } catch {
      await delay(5000);
    }
  }
}

export const EpicProfile = v.object({
  profileChanges: v.tuple([
    v.object({
      profile: v.object({
        created: v.string(),
        items: v.record(v.string(), v.object({ templateId: v.string() })),
      }),
    }),
  ]),
});

export async function get_profile(profile: EpicAccount) {
  const { data } = await http.post(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com" +
      `/fortnite/api/game/v2/profile/${profile.account_id}/client/QueryProfile?profileId=athena&rvn=-1`,
    {},
    {
      headers: {
        Authorization: `Bearer ${profile.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return v.parse(EpicProfile, data);
}
