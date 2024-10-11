const userPool = new sst.aws.CognitoUserPool("MyUserPool", {
  usernames: ["email"],
});
const userPoolClient = userPool.addClient("Web");

export { userPoolClient };
export default userPool;
