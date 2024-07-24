module.exports = {
    apps: [
      {
        name: "kupo3graphql",
        script: "./dist/index.js",
        watch: true,
        ignore_watch: ["node_modules", "dist"],
        env: {
          NODE_ENV: "development",
          PORT: 3000 // Puedes cambiar el puerto si es necesario
        },
        env_production: {
          NODE_ENV: "production",
          PORT: 4000 // Puedes cambiar el puerto si es necesario
        }
      }
    ]
  };

  