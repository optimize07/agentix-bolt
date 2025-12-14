/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: any;
        event?: any;
      };
    };
  }
}

export {};
