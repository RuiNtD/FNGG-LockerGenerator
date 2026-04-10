import $ from "@david/dax";
import * as z from "zod";
import { USER_AGENT } from "../const.ts";
import ky from "ky";

const auth = btoa(
  "98f7e42c2e3a4f86a74eb43fbb41ed39:0a2449a2-001a-451e-afec-3e812901c4d7",
);
const api = ky.create({
  method: "POST",
  headers: { "User-Agent": USER_AGENT },
});
const oauthApi = api.extend({
  baseUrl:
    "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${auth}`,
  },
});

const OAuthToken = z
  .object({
    access_token: z.string(),
  })
  .transform((v) => v.access_token);
export async function getAccessToken() {
  return await oauthApi("token", {
    body: "grant_type=client_credentials",
  }).json(OAuthToken);
}

export const OAuthDeviceAuth = z.object({
  user_code: z.string(),
  device_code: z.string(),
  verification_uri: z.string(),
  verification_uri_complete: z.string(),
  expires_in: z.number(),
  interval: z.number(),
});
export type OAuthDeviceAuth = z.infer<typeof OAuthDeviceAuth>;
export async function createDeviceAuth(accessToken: string) {
  return await oauthApi("deviceAuthorization", {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: "",
  }).json(OAuthDeviceAuth);
}

const EpicAccount = z.object({
  access_token: z.string(),
  displayName: z.string(),
  account_id: z.string(),
});
export type EpicAccount = z.infer<typeof EpicAccount>;
const TokenError = z.object({
  errorCode: z.string(),
  errorMessage: z.string(),
});
export async function waitForDeviceCodeCompletion(deviceAuth: OAuthDeviceAuth) {
  while (true) {
    const json = await oauthApi("token", {
      body: new URLSearchParams({
        grant_type: "device_code",
        device_code: deviceAuth.device_code,
      }),
      throwHttpErrors: false,
    }).json();
    try {
      return EpicAccount.parse(json);
    } catch (_) {
      const { errorCode, errorMessage } = TokenError.parse(json);
      if (
        errorCode == "errors.com.epicgames.account.oauth.authorization_pending"
      )
        await $.sleep(deviceAuth.interval * 1000);
      else if (errorCode == "errors.com.epicgames.not_found") throw "expired";
      else throw errorMessage;
    }
  }
}

export const EpicProfile = z
  .object({
    profileChanges: z.tuple([
      z.object({
        profile: z.object({
          created: z.string(),
          items: z.record(z.string(), z.object({ templateId: z.string() })),
        }),
      }),
    ]),
  })
  .transform((v) => v.profileChanges[0].profile);
export async function getProfile(profile: EpicAccount, profileId = "athena") {
  return await api(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api" +
      `/game/v2/profile/${profile.account_id}/client/QueryProfile?profileId=${profileId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.access_token}`,
      },
      body: "{}",
    },
  ).json(EpicProfile);
}

export async function getBannerProfile(profile: EpicAccount) {
  return await getProfile(profile, "common_core");
}
