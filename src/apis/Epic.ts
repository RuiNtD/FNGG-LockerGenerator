import axios, { AxiosError } from "axios";
import { delay } from "@std/async/delay";
import { z } from "zod/v4-mini";

const auth = {
  username: "98f7e42c2e3a4f86a74eb43fbb41ed39",
  password: "0a2449a2-001a-451e-afec-3e812901c4d7",
};

const OAuthToken = z.object({
  access_token: z.string(),
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
  return OAuthToken.parse(data).access_token;
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
  return OAuthDeviceAuth.parse(data);
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
    try {
      const resp = await axios.post(
        "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
        { grant_type: "device_code", device_code: deviceAuth.device_code },
        {
          auth,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      return EpicAccount.parse(resp.data);
    } catch (e) {
      if (e instanceof AxiosError) {
        const error = TokenError.parse(e.response?.data);
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

export const EpicProfile = z.pipe(
  z.object({
    profileChanges: z.tuple([
      z.object({
        profile: z.object({
          created: z.string(),
          items: z.record(z.string(), z.object({ templateId: z.string() })),
        }),
      }),
    ]),
  }),
  z.transform((v) => v.profileChanges[0].profile)
);

export async function getProfile(profile: EpicAccount, profileId = "athena") {
  const { data } = await axios.post(
    "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api" +
      `/game/v2/profile/${profile.account_id}/client/QueryProfile?profileId=${profileId}`,
    {},
    { headers: { Authorization: `Bearer ${profile.access_token}` } }
  );
  return EpicProfile.parse(data);
}

export async function getBannerProfile(profile: EpicAccount) {
  return await getProfile(profile, "common_core");
}
