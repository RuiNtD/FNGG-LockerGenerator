import axios from "axios";
import { delay } from "@std/async/delay";
import * as v from "@valibot/valibot";

const auth = {
  username: "98f7e42c2e3a4f86a74eb43fbb41ed39",
  password: "0a2449a2-001a-451e-afec-3e812901c4d7",
};

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
      auth,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
    "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/deviceAuthorization",
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

export async function waitForDeviceCodeCompletion(code: string) {
  console.info("Waiting for authentication...");

  while (true) {
    try {
      const resp = await http.post(
        "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
        { grant_type: "device_code", device_code: code },
        {
          auth,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      return v.parse(EpicAccount, resp.data);
    } catch {
      await delay(5000);
    }
  }
}

export const EpicProfile = v.pipe(
  v.object({
    profileChanges: v.tuple([
      v.object({
        profile: v.object({
          created: v.string(),
          items: v.record(v.string(), v.object({ templateId: v.string() })),
        }),
      }),
    ]),
  }),
  v.transform((v) => v.profileChanges[0].profile)
);

export async function getProfile(profile: EpicAccount) {
  const { data } = await http.post(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api" +
      `/game/v2/profile/${profile.account_id}/client/QueryProfile?profileId=athena`,
    {},
    { headers: { Authorization: `Bearer ${profile.access_token}` } }
  );
  return v.parse(EpicProfile, data);
}

export async function getBannerProfile(profile: EpicAccount) {
  const { data } = await http.post(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api" +
      `/game/v2/profile/${profile.account_id}/client/QueryProfile`,
    {},
    { headers: { Authorization: `Bearer ${profile.access_token}` } }
  );
  return v.parse(EpicProfile, data);
}
