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
