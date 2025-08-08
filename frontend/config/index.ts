// Configuration file for environment-specific settings

interface Config {
  API_BASE_URL: string;
}

const devConfig: Config = {
  API_BASE_URL: 'https://webberlinga.pythonanywhere.com',
};

const prodConfig: Config = {
  // Production backend URL
  API_BASE_URL: 'https://webberlinga.pythonanywhere.com',
};

const config = __DEV__ ? devConfig : prodConfig;

export default config;
