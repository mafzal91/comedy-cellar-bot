export const emailSecrets = {
  alertEmail: new sst.Secret("AlertEmail"),
};
export const dbCreds = {
  dbUrl: new sst.Secret("DbUrl"),
};
export const clerkCreds = {
  clerkSigningSecret: new sst.Secret("ClerkSigningSecret"),
  clerkSecretKey: new sst.Secret("ClerkSecretKey"),
  clertPublishableKey: new sst.Secret("ClerkPublishableKey"),
};
// HMAC key for the signed "manage your notification settings" links embedded
// in every subscriber email (packages/core/alertsToken.ts). Any long random
// string works: `openssl rand -base64 48`. Rotating it invalidates every link
// in already-sent emails, so rotate deliberately.
export const alertsSecrets = {
  alertsTokenSecret: new sst.Secret("AlertsTokenSecret"),
};
