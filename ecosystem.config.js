module.exports = {
  apps: [
    {
      name: "jusoft-backend",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
        TZ: "America/Sao_Paulo",
      },
    },
  ],
};
