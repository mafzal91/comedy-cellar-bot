type config = {
  clerkFrontendApi: string;
};

const mohammadafzal = {
  clerkFrontendApi: "https://fair-sunfish-35.clerk.accounts.dev",
};
const prod = {
  clerkFrontendApi: "https://clerk.comedycellar.mafz.al",
};

const config = {
  mohammadafzal,
  prod,
};

export default config[$app.stage];
