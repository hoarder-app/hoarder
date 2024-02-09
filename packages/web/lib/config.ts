function buildAuthentikConfig() {
  const { AUTHENTIK_ID, AUTHENTIK_SECRET, AUTHENTIK_ISSUER } = process.env;

  if (!AUTHENTIK_ID || !AUTHENTIK_SECRET || !AUTHENTIK_ISSUER) {
    return undefined;
  }

  return {
    clientId: AUTHENTIK_ID,
    clientSecret: AUTHENTIK_SECRET,
    issuer: AUTHENTIK_ISSUER,
  };
}

const serverConfig = {
  api_url: process.env.API_URL || "http://localhost:3000",
  auth: {
    authentik: buildAuthentikConfig(),
  },
};

export default serverConfig;
