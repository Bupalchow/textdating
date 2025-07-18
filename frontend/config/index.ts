// Configuration file for environment-specific settings

interface Config {
  API_BASE_URL: string;
}

const devConfig: Config = {
  API_BASE_URL: 'http://localhost:8000',
};

const prodConfig: Config = {
  // Replace with your production backend URL
  API_BASE_URL: 'https://your-production-backend.com',
};

const config = __DEV__ ? devConfig : prodConfig;

export default config;
