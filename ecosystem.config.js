module.exports = {
  apps: [
    {
      name: "builderQueue",
      script: "src\\fetchJob.js",
      "shutdown_with_message": true,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      instances: 1,
      exec_mode: "fork",
    }
  ]
}