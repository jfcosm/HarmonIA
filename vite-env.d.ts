// Fix: Remove broken reference to vite/client and explicitly declare global process variable for API_KEY usage
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
