export type EnvConfig = {
  port: number;
  appOrigin: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappVerifyToken: string;
  whatsappGraphApiVersion: string;
  maxCampaignMessagesPerMinute: number;
  maxCampaignMessagesPerDay: number;
  planMonthlyPricePen: number;
  billingPeriodDays: number;
  sessionTtlDays: number;
  firebaseProjectId: string;
  firebaseServiceAccountJson: string;
  firebaseClientEmail: string;
  firebasePrivateKey: string;
};

const parseIntWithFallback = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const loadEnv = (): EnvConfig => {
  return {
    port: parseIntWithFallback(process.env.PORT, 4001),
    appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "dev_verify_token",
    whatsappGraphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? "v22.0",
    maxCampaignMessagesPerMinute: Math.max(
      1,
      parseIntWithFallback(process.env.MAX_CAMPAIGN_MESSAGES_PER_MINUTE, 20),
    ),
    maxCampaignMessagesPerDay: Math.max(
      1,
      parseIntWithFallback(process.env.MAX_CAMPAIGN_MESSAGES_PER_DAY, 200),
    ),
    planMonthlyPricePen: Math.max(1, parseIntWithFallback(process.env.PLAN_MONTHLY_PRICE_PEN, 50)),
    billingPeriodDays: Math.max(1, parseIntWithFallback(process.env.BILLING_PERIOD_DAYS, 30)),
    sessionTtlDays: Math.max(1, parseIntWithFallback(process.env.SESSION_TTL_DAYS, 30)),
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "",
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
  };
};
