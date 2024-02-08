export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SESSION_SECRET: string;
      JWT_SECRET: string;
      DATABASE_URL: string;
    }
  }

  interface Window {
    env: {
      NODE_ENV: string;
    };
  }
}
