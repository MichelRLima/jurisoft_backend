module.exports = {
  apps: [
    {
      name: "jurisoft-backend",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
        TZ: "America/Sao_Paulo",
      },
    },
  ],
};
