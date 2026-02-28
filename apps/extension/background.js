const DEFAULT_API_BASE_URL = "https://whats-crm-compliant.vercel.app/api/v1";
const REMINDER_ALARM_NAME = "wacrm_reminder_check_v1";
const REMINDER_ALARM_PERIOD_MINUTES = 1;
const NOTIFIED_REMINDERS_KEY = "crm_notified_reminders_v1";
const NOTIFIED_RETENTION_DAYS = 14;
const MAX_NOTIFIED_REMINDERS = 1200;

let checkingReminders = false;

const storageGet = async (keys) => {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
};

const storageSet = async (payload) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(payload, () => resolve());
  });
};

const getAlarm = async (name) => {
  return new Promise((resolve) => {
    chrome.alarms.get(name, (alarm) => resolve(alarm || null));
  });
};

const clearAlarm = async (name) => {
  return new Promise((resolve) => {
    chrome.alarms.clear(name, () => resolve());
  });
};

const createNotification = async (notificationId, options) => {
  return new Promise((resolve) => {
    chrome.notifications.create(notificationId, options, () => resolve());
  });
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
};

const normalizeNotifiedReminders = (value) => {
  const now = Date.now();
  const maxAgeMs = NOTIFIED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  if (!value || typeof value !== "object") {
    return {};
  }

  const pairs = Object.entries(value)
    .map(([key, iso]) => {
      const time = new Date(String(iso || "")).getTime();
      return { key, iso: String(iso || ""), time };
    })
    .filter((item) => !Number.isNaN(item.time) && now - item.time <= maxAgeMs)
    .sort((a, b) => b.time - a.time)
    .slice(0, MAX_NOTIFIED_REMINDERS);

  return pairs.reduce((acc, item) => {
    acc[item.key] = item.iso;
    return acc;
  }, {});
};

const toReminderKey = (workspaceId, reminder) => {
  return `${workspaceId}:${String(reminder.id || "")}:${String(reminder.dueAt || "")}`;
};

const ensureReminderAlarm = async () => {
  const existing = await getAlarm(REMINDER_ALARM_NAME);
  if (!existing) {
    chrome.alarms.create(REMINDER_ALARM_NAME, { periodInMinutes: REMINDER_ALARM_PERIOD_MINUTES });
  }
};

const syncAlarmWithSession = async () => {
  const values = await storageGet(["crm_token"]);
  const token = String(values.crm_token || "").trim();
  if (!token) {
    await clearAlarm(REMINDER_ALARM_NAME);
    return false;
  }

  await ensureReminderAlarm();
  return true;
};

const checkDueReminders = async () => {
  if (checkingReminders) {
    return;
  }
  checkingReminders = true;

  try {
    const values = await storageGet(["crm_api_base_url", "crm_token", NOTIFIED_REMINDERS_KEY]);
    const token = String(values.crm_token || "").trim();
    if (!token) {
      return;
    }

    const apiBaseUrl = String(values.crm_api_base_url || "").trim() || DEFAULT_API_BASE_URL;
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const [meData, billingData] = await Promise.all([
      fetchJson(`${apiBaseUrl}/auth/me`, { headers: authHeaders }),
      fetchJson(`${apiBaseUrl}/billing/subscription`, { headers: authHeaders }),
    ]);

    if (!billingData?.subscription?.canUseCrm) {
      return;
    }

    const workspaceId = String(meData?.workspace?.id || "");
    if (!workspaceId) {
      return;
    }

    const [remindersData, leadsData] = await Promise.all([
      fetchJson(`${apiBaseUrl}/reminders`, { headers: authHeaders }),
      fetchJson(`${apiBaseUrl}/leads`, { headers: authHeaders }),
    ]);

    const leads = Array.isArray(leadsData?.leads) ? leadsData.leads : [];
    const leadsById = new Map(
      leads.map((lead) => [String(lead?.id || ""), String(lead?.name || "Lead")]),
    );
    const reminders = Array.isArray(remindersData?.reminders) ? remindersData.reminders : [];
    const nowTime = Date.now();

    const normalizedCache = normalizeNotifiedReminders(values[NOTIFIED_REMINDERS_KEY]);
    let cacheChanged = false;

    const dueReminders = reminders
      .filter((reminder) => reminder && reminder.status !== "done")
      .filter((reminder) => {
        const dueTime = new Date(reminder.dueAt || "").getTime();
        return !Number.isNaN(dueTime) && dueTime <= nowTime;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    for (const reminder of dueReminders) {
      const reminderKey = toReminderKey(workspaceId, reminder);
      if (normalizedCache[reminderKey]) {
        continue;
      }

      const leadName = leadsById.get(String(reminder.leadId || "")) || "Lead";
      const note = String(reminder.note || "Seguimiento pendiente").slice(0, 180);
      const dueAtLabel = new Date(reminder.dueAt).toLocaleString();
      const notificationId = `wacrm_rem_${String(reminder.id || Date.now())}_${Date.now()}`;

      await createNotification(notificationId, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Recordatorio WhatsWidget",
        message: `${leadName}: ${note}`,
        contextMessage: `Vencido: ${dueAtLabel}`,
        priority: 2,
      });

      normalizedCache[reminderKey] = new Date().toISOString();
      cacheChanged = true;
    }

    const finalCache = normalizeNotifiedReminders(normalizedCache);
    if (cacheChanged || Object.keys(finalCache).length !== Object.keys(normalizedCache).length) {
      await storageSet({ [NOTIFIED_REMINDERS_KEY]: finalCache });
    }
  } catch (error) {
    console.warn("[WACRM] reminder check failed:", error?.message || error);
  } finally {
    checkingReminders = false;
  }
};

chrome.runtime.onInstalled.addListener(() => {
  void syncAlarmWithSession();
  void checkDueReminders();
});

chrome.runtime.onStartup.addListener(() => {
  void syncAlarmWithSession();
  void checkDueReminders();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  if (changes.crm_token || changes.crm_api_base_url) {
    void syncAlarmWithSession();
    void checkDueReminders();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm?.name === REMINDER_ALARM_NAME) {
    void checkDueReminders();
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (String(notificationId || "").startsWith("wacrm_rem_")) {
    chrome.tabs.create({ url: "https://web.whatsapp.com" });
  }
});

void syncAlarmWithSession();
