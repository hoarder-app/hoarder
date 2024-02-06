function buildAuthentikConfig() {
  let { id, secret, issuer } = process.env;
  if (!id || !secret || !issuer) {
    return undefined;
  }

  return {
    clientId: id,
    clientSecret: secret,
    issuer: issuer,
  };
}

const serverConfig = {
  auth: {
    authentik: buildAuthentikConfig(),
  },
};

export default serverConfig;
