const environments = {
  development: {
    dbOptions: {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  production: {
    dbOptions: {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
    }
  }
};

module.exports = environments[process.env.NODE_ENV] || environments.development;
