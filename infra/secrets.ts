export const emailSecrets = {
  fromEmail: new sst.Secret("FromEmail"),
  fromEmailPw: new sst.Secret("FromEmailPw"),
};
export const dbCreds = {
  dbUrl: new sst.Secret("DbUrl"),
};
export const clerkCreds = {
  clerkSigningSecret: new sst.Secret("ClerkSigningSecret"),
  clerkSecretKey: new sst.Secret("ClerkSecretKey"),
};
