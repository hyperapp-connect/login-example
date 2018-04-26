module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'FRONTEND',
      script: 'dist/frontend.js',
      watch: true,
      ignore_watch: ['db'],
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'GATEWAY',
      script: 'dist/gateway.js',
      watch: true,
      ignore_watch: ['db'],
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production'
      },
    },
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  // deploy: {
  //   production: {
  //     user: 'node',
  //     host: '',
  //     ref: 'origin/master',
  //     repo: 'git@github.com:magic/frontend.git',
  //     path: '/var/www/frontend',
  //     'post-deploy': 'npm install -p && pm2 reload ecosystem.config.js --env production'
  //   },
  //   dev: {
  //     user: 'node',
  //     host: '212.83.163.1',
  //     ref: 'origin/master',
  //     repo: 'git@github.com:repo.git',
  //     path: '/var/www/development',
  //     'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
  //     env: {
  //       NODE_ENV: 'dev'
  //     }
  //   }
  // }
}
