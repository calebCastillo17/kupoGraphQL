module.exports = {
    apps: [
      {
        name: "kupo3graphql-v1",
        script: "./dist/index.js",
        watch: true,
        ignore_watch: ["node_modules", "dist"],
        env: {
          NODE_ENV: "development",
          PORT: 3000 // Puedes cambiar el puerto si es necesario
        },
        env_production: {
          NODE_ENV: "production",
          PORT: 4001 // Puedes cambiar el puerto si es necesario
        }
      }
    ]
  };

  