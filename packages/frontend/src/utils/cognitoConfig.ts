const { VITE_REGION, VITE_USER_POOL_CLIENT_ID, VITE_USER_POOL_ID } = import.meta
  .env;
export const cognitoConfig = {
  region: VITE_REGION,
  UserPoolId: VITE_USER_POOL_ID,
  ClientId: VITE_USER_POOL_CLIENT_ID,
};
