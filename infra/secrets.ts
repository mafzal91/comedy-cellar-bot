export const emailSecrets = {
  fromEmail: new sst.Secret("FromEmail"),
  fromEmailPw: new sst.Secret("FromEmailPw"),
};
export const dbCreds = {
  dbUrl: new sst.Secret("DbUrl"),
};
