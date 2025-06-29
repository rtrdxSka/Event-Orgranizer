const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if(value == undefined){
    throw new Error(`Missing environment variable ${key}`);
  }

  return value;
}

export const MONGO_URI = getEnv("MONGO_URI");
export const NODE_ENV = getEnv("NODE_ENV", "development");
export const PORT = getEnv("PORT", "4004");
export const APP_ORIGIN = getEnv("APP_ORIGIN");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const EMAIL_SENDER = getEnv("EMAIL_SENDER");
export const RESEND_API_KEY = getEnv("RESEND_API_KEY");
export const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID");
export const GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET");
export const BACKEND_URL = getEnv("BACKEND_URL", "http://localhost:4004");