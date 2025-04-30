import axios, { AxiosError } from "axios";
import { delay } from "@std/async/delay";
import * as v from "valibot";

const auth = {
  username: "98f7e42c2e3a4f86a74eb43fbb41ed39",
  password: "0a2449a2-001a-451e-afec-3e812901c4d7",
};

const OAuthToken = v.object({
  access_token: v.string(),
});

export async function getAccessToken() {
  const { data } = await axios.post(
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
  user_code: v.string(),
  device_code: v.string(),
  verification_uri: v.string(),
  verification_uri_complete: v.string(),
  expires_in: v.number(),
  interval: v.number(),
});
export type OAuthDeviceAuth = v.InferOutput<typeof OAuthDeviceAuth>;

export async function createDeviceAuth(accessToken: string) {
  const { data } = await axios.post(
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
export type EpicAccount = v.InferOutput<typeof EpicAccount>;

const TokenError = v.object({
  errorCode: v.string(),
  errorMessage: v.string(),
});

export async function waitForDeviceCodeCompletion(deviceAuth: OAuthDeviceAuth) {
  while (true) {
    try {
      const resp = await axios.post(
        "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
        { grant_type: "device_code", device_code: deviceAuth.device_code },
        {
          auth,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      return v.parse(EpicAccount, resp.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        const error = v.parse(TokenError, e.response?.data);
        if (
          error.errorCode ===
          "errors.com.epicgames.account.oauth.authorization_pending"
        )
          await delay(deviceAuth.interval * 1000);
        else if (error.errorCode === "errors.com.epicgames.not_found")
          throw "expired";
        else throw error.errorMessage;
      } else throw e;
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

export async function getProfile(profile: EpicAccount, profileId = "athena") {
  const { data } = await axios.post(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api" +
      `/game/v2/profile/${profile.account_id}/client/QueryProfile?profileId=${profileId}`,
    {},
    { headers: { Authorization: `Bearer ${profile.access_token}` } }
  );
  return v.parse(EpicProfile, data);
}

export async function getBannerProfile(profile: EpicAccount) {
  return await getProfile(profile, "common_core");
}
