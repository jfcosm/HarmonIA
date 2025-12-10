// Armonix v4.2.0 Update
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}