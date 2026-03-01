export type EnvConfig = {
  port: number;
  appOrigin: string;
  adminSyncKey: string;
  crmMessagingMode: "crm_manual" | "cloud_api";
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappVerifyToken: string;
  whatsappGraphApiVersion: string;
  maxCampaignMessagesPerMinute: number;
  maxCampaignMessagesPerDay: number;
  maxCampaignNonOptInPercent: number;
  maxManualAssistActionsPerMinute: number;
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

const parseMessagingMode = (value: string | undefined): "crm_manual" | "cloud_api" => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "cloud_api" ? "cloud_api" : "crm_manual";
};

export const loadEnv = (): EnvConfig => {
  return {
    port: parseIntWithFallback(process.env.PORT, 4001),
    appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
    adminSyncKey: (process.env.ADMIN_SYNC_KEY ?? "").trim(),
    crmMessagingMode: parseMessagingMode(process.env.CRM_MESSAGING_MODE),
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
    maxCampaignNonOptInPercent: Math.min(
      100,
      Math.max(0, parseIntWithFallback(process.env.MAX_CAMPAIGN_NON_OPTIN_PERCENT, 20)),
    ),
    maxManualAssistActionsPerMinute: Math.max(
      1,
      parseIntWithFallback(process.env.MAX_MANUAL_ASSIST_ACTIONS_PER_MINUTE, 12),
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
