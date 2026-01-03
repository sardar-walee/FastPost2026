module.exports = {
  development: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    nodeEnv: 'development'
  },
  production: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: 'production'
  },
  test: {
    port: 5001,
    host: 'localhost',
    nodeEnv: 'test'
  }
};
