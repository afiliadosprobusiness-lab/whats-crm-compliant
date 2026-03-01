const DEFAULT_API_BASE_URL = "https://whats-crm-compliant.vercel.app/api/v1";
const stages = ["new", "contacted", "qualified", "won", "lost"];
const inboxViews = ["my", "unassigned", "overdue", "all"];
const healthQuickEvents = [
  { event: "responded", label: "Respondio" },
  { event: "appointment_set", label: "Cita" },
  { event: "no_response_72h", label: "72h" },
  { event: "spam_reported", label: "Spam" },
];
const LANG_STORAGE_KEY = "crm_lang_v1";
const SEGMENTS_STORAGE_KEY = "crm_segments_v1";
const ACTIVE_SEGMENT_STORAGE_KEY = "crm_active_segment_v1";
const BACKEND_URL_STORAGE_KEY = "crm_backend_url";
const I18N = {
  es: {},
  en: {
    access_title: "Access",
    summary_create_owner: "Create owner account",
    btn_login: "Sign in",
    btn_logout: "Sign out",
    btn_create_account: "Create account",
    subscription_title: "Subscription",
    status_active: "Active",
    status_inactive: "Inactive",
    summary_title: "Summary",
    kpi_campaigns: "Campaigns",
    lead_new_title: "New Lead",
    templates_title: "Templates",
    campaign_title: "Bulk campaign",
    reminders_title: "Reminders",
    kanban_title: "Kanban",
    segments_title: "Custom tabs",
    unsaved_title: "Unsaved number",
    csv_title: "Import CSV to CRM",
    btn_save_lead: "Save lead",
    btn_save_template: "Save template",
    btn_campaign_send: "Create and send",
    btn_create_reminder: "Create reminder",
    btn_save_segment: "Save tab",
    btn_open_chat_manual: "Open chat (manual)",
    btn_import_csv: "Import CSV",
    hero_subtitle: "CRM for leads, templates, campaigns and reminders in WhatsApp Web.",
    session_none: "No session",
    login_required: "Sign in to use CRM.",
    session_invalid: "Invalid session:",
    session_active: "Session active and CRM enabled.",
    subscription_inactive_feedback: "Subscription inactive. Ask admin to activate.",
    logged_out: "Session closed.",
    account_created: "Account created. Session started.",
    no_templates_yet: "No templates yet.",
    create_template_first: "Create a template first",
    no_optedin_leads: "No opted_in leads.",
    no_leads_yet: "Create a lead first",
    no_reminders: "No reminders.",
    calendar_btn: "Calendar",
    open_chat_btn: "Open chat",
    chat_opened: "Chat opened in WhatsApp Web.",
    segment_invalid: "Complete tab name and value.",
    segment_exists: "A similar tab already exists.",
    segment_saved: "Tab saved.",
    segment_removed: "Tab removed.",
    no_segment_leads: "No leads in this segment.",
    all_segments: "All",
    use_btn: "Use",
    delete_btn: "Remove",
    stage_updated: "Stage updated.",
    kanban_empty: "No leads",
    lead_saved: "Lead saved.",
    template_saved: "Template saved.",
    campaign_sent: "Campaign sent.",
    reminder_created: "Reminder created.",
    reminder_completed: "Reminder completed.",
    campaign_recipients_required: "Select at least one opted_in lead.",
    reminder_invalid_date: "Invalid date/time for reminder.",
    csv_processing: "Importing CSV...",
    csv_no_rows: "CSV has no valid rows.",
    csv_import_result: "CSV import completed.",
    backend_config_title: "Backend URL",
    backend_url_label: "BACKEND_URL",
    btn_save_backend_url: "Save BACKEND_URL",
    backend_saved: "BACKEND_URL updated.",
    backend_invalid_url: "Invalid backend URL.",
    compliance_title: "Compliance Trust Center",
    compliant_mode_on: "Compliant Mode ON",
    trust_optin: "Opt-in coverage",
    trust_quota: "Daily quota",
    trust_risk: "Anti-spam risk",
    no_audit_logs: "No audit events yet.",
    messaging_mode_title: "Messaging mode",
    inbox_title: "Multi-agent inbox",
    inbox_my: "My leads",
    inbox_unassigned: "Unassigned",
    inbox_overdue: "Overdue",
    inbox_all: "All",
    productivity_title: "Productivity",
    kpi_assigned: "Assigned",
    kpi_overdue: "Overdue",
    label_owner: "Owner",
    unassigned_owner: "Unassigned",
    inbox_empty: "No leads in this inbox.",
    lead_assigned: "Lead assignment updated.",
    lead_health_updated: "Lead health updated.",
    messaging_mode_manual: "Manual CRM mode active.",
    messaging_mode_cloud: "Cloud API mode active.",
    preflight_pending: "Preflight pending.",
    btn_campaign_preflight: "Validate preflight",
    btn_complete_reminder: "Complete",
    preflight_ready: "Preflight ok.",
    preflight_blocked: "Preflight blocked the campaign.",
  },
  pt: {
    access_title: "Acesso",
    summary_create_owner: "Criar conta owner",
    btn_login: "Entrar",
    btn_logout: "Sair",
    btn_create_account: "Criar conta",
    subscription_title: "Assinatura",
    status_active: "Ativo",
    status_inactive: "Inativo",
    summary_title: "Resumo",
    kpi_campaigns: "Campanhas",
    lead_new_title: "Novo Lead",
    templates_title: "Modelos",
    campaign_title: "Campanha em massa",
    reminders_title: "Lembretes",
    kanban_title: "Kanban",
    segments_title: "Abas personalizadas",
    unsaved_title: "Numero nao salvo",
    csv_title: "Importar CSV para CRM",
    btn_save_lead: "Salvar lead",
    btn_save_template: "Salvar modelo",
    btn_campaign_send: "Criar e enviar",
    btn_create_reminder: "Criar lembrete",
    btn_save_segment: "Salvar aba",
    btn_open_chat_manual: "Abrir chat (manual)",
    btn_import_csv: "Importar CSV",
    hero_subtitle: "CRM para leads, modelos, campanhas e lembretes no WhatsApp Web.",
    session_none: "Sem sessao",
    login_required: "Entre para usar o CRM.",
    session_invalid: "Sessao invalida:",
    session_active: "Sessao ativa e CRM habilitado.",
    subscription_inactive_feedback: "Assinatura inativa. Solicite ativacao ao administrador.",
    logged_out: "Sessao encerrada.",
    account_created: "Conta criada. Sessao iniciada.",
    no_templates_yet: "Sem modelos.",
    create_template_first: "Crie um modelo primeiro",
    no_optedin_leads: "Sem leads opted_in.",
    no_leads_yet: "Crie um lead primeiro",
    no_reminders: "Sem lembretes.",
    calendar_btn: "Calendar",
    open_chat_btn: "Abrir chat",
    chat_opened: "Chat aberto no WhatsApp Web.",
    segment_invalid: "Preencha nome e valor da aba.",
    segment_exists: "Ja existe uma aba semelhante.",
    segment_saved: "Aba salva.",
    segment_removed: "Aba removida.",
    no_segment_leads: "Sem leads neste segmento.",
    all_segments: "Todos",
    use_btn: "Usar",
    delete_btn: "Remover",
    stage_updated: "Etapa atualizada.",
    kanban_empty: "Sem leads",
    lead_saved: "Lead salvo.",
    template_saved: "Modelo salvo.",
    campaign_sent: "Campanha enviada.",
    reminder_created: "Lembrete criado.",
    reminder_completed: "Lembrete concluido.",
    campaign_recipients_required: "Selecione pelo menos um lead opted_in.",
    reminder_invalid_date: "Data/hora invalida para lembrete.",
    csv_processing: "Importando CSV...",
    csv_no_rows: "CSV sem linhas validas.",
    csv_import_result: "Importacao CSV concluida.",
    backend_config_title: "Backend URL",
    backend_url_label: "BACKEND_URL",
    btn_save_backend_url: "Salvar BACKEND_URL",
    backend_saved: "BACKEND_URL atualizada.",
    backend_invalid_url: "URL de backend invalida.",
    compliance_title: "Compliance Trust Center",
    compliant_mode_on: "Compliant Mode ON",
    trust_optin: "Cobertura opt-in",
    trust_quota: "Cota diaria",
    trust_risk: "Risco anti-spam",
    no_audit_logs: "Sem eventos de auditoria.",
    messaging_mode_title: "Modo de mensagens",
    inbox_title: "Caixa multiagente",
    inbox_my: "Meus leads",
    inbox_unassigned: "Sem dono",
    inbox_overdue: "Vencidos",
    inbox_all: "Todos",
    productivity_title: "Produtividade",
    kpi_assigned: "Atribuidos",
    kpi_overdue: "Vencidos",
    label_owner: "Responsavel",
    unassigned_owner: "Sem dono",
    inbox_empty: "Sem leads nesta caixa.",
    lead_assigned: "Atribuicao do lead atualizada.",
    lead_health_updated: "Saude do lead atualizada.",
    messaging_mode_manual: "Modo CRM manual ativo.",
    messaging_mode_cloud: "Modo Cloud API ativo.",
    preflight_pending: "Preflight pendente.",
    btn_campaign_preflight: "Validar preflight",
    btn_complete_reminder: "Concluir",
    preflight_ready: "Preflight OK.",
    preflight_blocked: "Preflight bloqueou a campanha.",
  },
};

const state = {
  apiBaseUrl: DEFAULT_API_BASE_URL,
  token: localStorage.getItem("crm_token") || "",
  authUser: null,
  workspace: null,
  subscription: null,
  trustCenter: null,
  messagingMode: null,
  campaignPreflight: null,
  leadInbox: null,
  leadInboxView: "my",
  leads: [],
  templates: [],
  campaigns: [],
  reminders: [],
  workspaceUsers: [],
  productivity: null,
  language: "es",
  draggedLeadId: "",
  segmentsStore: {},
  segments: [],
  activeSegmentId: "all",
  apiCapabilities: {
    complianceTrustCenter: true,
    complianceMessagingMode: true,
    leadsInbox: true,
    analyticsProductivity: true,
    authUsers: true,
  },
};

const crmSections = Array.from(document.querySelectorAll("[data-crm]"));
const feedbackEl = document.getElementById("feedback");
const sessionLabelEl = document.getElementById("session-label");
const subscriptionLabelEl = document.getElementById("subscription-status");
const languageSelectEl = document.getElementById("language-select");
const backendUrlInputEl = document.getElementById("backend-url-input");
const backendUrlPreviewEl = document.getElementById("backend-url-preview");
const hasChromeStorage = typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

const storageGet = async (keys) => {
  if (!hasChromeStorage) {
    return {};
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
};

const storageSet = async (values) => {
  if (!hasChromeStorage) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
};

const slugTag = (value) => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const normalizePhone = (input) => {
  const cleaned = String(input || "").trim().replace(/[^\d+]/g, "");
  if (!cleaned) {
    return "";
  }
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.startsWith("00")) {
    return `+${cleaned.slice(2)}`;
  }
  return `+${cleaned}`;
};

const normalizeApiBaseUrl = (input) => {
  const raw = String(input || "").trim();
  if (!raw) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const path = parsed.pathname.replace(/\/+$/, "");
    parsed.pathname = path.endsWith("/api/v1") ? path : `${path || ""}/api/v1`;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch (_error) {
    return "";
  }
};

const isLeadOptedIn = (lead) => {
  if (typeof lead?.opted_in === "boolean") {
    return lead.opted_in;
  }
  return String(lead?.consentStatus || "") === "opted_in";
};

const openInNewTab = (url) => {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
};

const openChatByPhone = (phone, message = "") => {
  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Telefono invalido. Usa formato E.164.");
  }
  const text = String(message || "").trim();
  const url = text
    ? `https://web.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?phone=${digits}`;
  openInNewTab(url);
};

const normalizeSegmentsStore = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const result = {};
  Object.entries(value).forEach(([workspaceId, list]) => {
    if (!workspaceId || !Array.isArray(list)) {
      return;
    }
    result[workspaceId] = list
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: String(item.id || "").trim(),
        name: String(item.name || "").trim().slice(0, 24),
        type: String(item.type || "tag").trim(),
        value: String(item.value || "").trim().slice(0, 40),
      }))
      .filter((item) => item.id && item.name && item.value)
      .slice(0, 12);
  });
  return result;
};

const getWorkspaceKey = () => {
  return String(state.workspace?.id || "__default__").trim();
};

const applyWorkspaceSegments = () => {
  const workspaceKey = getWorkspaceKey();
  state.segments = Array.isArray(state.segmentsStore[workspaceKey]) ? state.segmentsStore[workspaceKey] : [];
  const exists = state.activeSegmentId === "all" || state.segments.some((segment) => segment.id === state.activeSegmentId);
  if (!exists) {
    state.activeSegmentId = "all";
  }
};

const persistSegments = async () => {
  const workspaceKey = getWorkspaceKey();
  state.segmentsStore[workspaceKey] = state.segments;
  await storageSet({
    [SEGMENTS_STORAGE_KEY]: state.segmentsStore,
    [ACTIVE_SEGMENT_STORAGE_KEY]: state.activeSegmentId,
  });
};

const applyTranslations = () => {
  if (languageSelectEl) {
    languageSelectEl.value = state.language;
  }
  const map = I18N[state.language] || {};
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) {
      return;
    }
    if (!node.dataset.i18nBase) {
      node.dataset.i18nBase = node.textContent || "";
    }
    node.textContent = map[key] || node.dataset.i18nBase;
  });
};

const tr = (key, fallback) => {
  const map = I18N[state.language] || {};
  return map[key] || fallback;
};

const setFeedback = (text, isError = false) => {
  feedbackEl.textContent = text;
  feedbackEl.className = isError ? "error" : "";
};

const setCrmVisibility = (visible) => {
  crmSections.forEach((section) => {
    section.classList.toggle("is-hidden", !visible);
  });
};

const resetApiCapabilities = () => {
  state.apiCapabilities = {
    complianceTrustCenter: true,
    complianceMessagingMode: true,
    leadsInbox: true,
    analyticsProductivity: true,
    authUsers: true,
  };
};

const persistToken = (token) => {
  state.token = token;
  if (token) {
    localStorage.setItem("crm_token", token);
  } else {
    localStorage.removeItem("crm_token");
  }
  void storageSet({ crm_token: token || "" });
};

const persistApiBaseUrl = async (apiBaseUrl) => {
  state.apiBaseUrl = apiBaseUrl;
  localStorage.setItem(BACKEND_URL_STORAGE_KEY, apiBaseUrl);
  // Keep legacy key in sync for content/background compatibility.
  localStorage.setItem("crm_api_base_url", apiBaseUrl);
  await storageSet({
    [BACKEND_URL_STORAGE_KEY]: apiBaseUrl,
    crm_api_base_url: apiBaseUrl,
  });
  renderBackendConfig();
};

const apiRequest = async (path, options = {}) => {
  const extraHeaders = options.headers || {};
  const authHeaders = state.token ? { Authorization: `Bearer ${state.token}` } : {};
  const response = await fetch(`${state.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders, ...extraHeaders },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "API error");
    error.statusCode = response.status;
    throw error;
  }

  return payload;
};

const isEndpointMissingError = (error) => {
  const status = Number(error?.statusCode || 0);
  return status === 404 || status === 405;
};

const optionalApiRequest = async (capabilityKey, path, fallbackValue) => {
  if (state.apiCapabilities[capabilityKey] === false) {
    return fallbackValue;
  }

  try {
    return await apiRequest(path);
  } catch (error) {
    if (isEndpointMissingError(error)) {
      state.apiCapabilities[capabilityKey] = false;
      return fallbackValue;
    }
    throw error;
  }
};

const renderSession = () => {
  if (!state.authUser || !state.workspace) {
    sessionLabelEl.textContent = tr("session_none", "Sin sesion");
    return;
  }

  sessionLabelEl.textContent = `${state.authUser.email} | ${state.workspace.companyName}`;
};

const renderSubscription = () => {
  subscriptionLabelEl.classList.remove("subscription-state--active", "subscription-state--inactive");
  if (!state.subscription) {
    subscriptionLabelEl.textContent = tr("status_inactive", "Inactivo");
    subscriptionLabelEl.classList.add("subscription-state--inactive");
    return;
  }

  const isActive = Boolean(state.subscription.canUseCrm);
  subscriptionLabelEl.textContent = isActive ? tr("status_active", "Activo") : tr("status_inactive", "Inactivo");
  subscriptionLabelEl.classList.add(isActive ? "subscription-state--active" : "subscription-state--inactive");
};

const renderBackendConfig = () => {
  if (backendUrlInputEl) {
    backendUrlInputEl.value = state.apiBaseUrl;
  }
  if (backendUrlPreviewEl) {
    backendUrlPreviewEl.textContent = `API: ${state.apiBaseUrl}`;
  }
};

const renderSimpleList = (listEl, items) => {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = String(item || "").slice(0, 240);
    listEl.appendChild(li);
  });
};

const renderTrustCenter = () => {
  const badgeEl = document.getElementById("compliance-mode-badge");
  const optInEl = document.getElementById("compliance-optin");
  const quotaEl = document.getElementById("compliance-quota");
  const riskEl = document.getElementById("compliance-risk");
  const alertsEl = document.getElementById("compliance-alerts");
  const auditEl = document.getElementById("audit-log-list");
  if (!optInEl || !quotaEl || !riskEl || !alertsEl || !auditEl) {
    return;
  }

  if (badgeEl) {
    badgeEl.textContent = tr("compliant_mode_on", "Compliant Mode ON");
  }

  const trust = state.trustCenter;
  if (!trust) {
    optInEl.textContent = "0%";
    quotaEl.textContent = "0/0";
    riskEl.textContent = "low (0)";
    renderSimpleList(alertsEl, [tr("preflight_pending", "Preflight pendiente.")]);
    renderSimpleList(auditEl, [tr("no_audit_logs", "Sin eventos de auditoria.")]);
    return;
  }

  optInEl.textContent = `${trust.optInCoverage.percentage}%`;
  quotaEl.textContent = `${trust.campaignDailyQuota.sentToday}/${trust.campaignDailyQuota.maxPerDay}`;
  riskEl.textContent = `${trust.antiSpamRisk.level} (${trust.antiSpamRisk.score})`;

  const reasons = Array.isArray(trust.antiSpamRisk.reasons) ? trust.antiSpamRisk.reasons : [];
  if (reasons.length) {
    renderSimpleList(alertsEl, reasons);
  } else {
    renderSimpleList(alertsEl, [tr("preflight_ready", "Preflight ok.")]);
  }

  const logs = Array.isArray(trust.recentAuditLogs) ? trust.recentAuditLogs.slice(0, 8) : [];
  if (!logs.length) {
    renderSimpleList(auditEl, [tr("no_audit_logs", "Sin eventos de auditoria.")]);
    return;
  }

  renderSimpleList(
    auditEl,
    logs.map((log) => {
      const when = log?.createdAt ? new Date(log.createdAt).toLocaleString() : "-";
      const summary = String(log?.summary || log?.action || "Evento");
      return `${when} | ${summary}`;
    }),
  );
};

const getOwnerLabel = (ownerUserId) => {
  if (!ownerUserId) {
    return tr("unassigned_owner", "Sin asignar");
  }
  const user = state.workspaceUsers.find((item) => item.id === ownerUserId);
  return user?.name || ownerUserId;
};

const renderMessagingMode = () => {
  const badgeEl = document.getElementById("messaging-mode-badge");
  const providerEl = document.getElementById("messaging-mode-provider");
  const reasonEl = document.getElementById("messaging-mode-reason");
  if (!badgeEl || !providerEl || !reasonEl) {
    return;
  }

  const mode = state.messagingMode;
  if (!mode) {
    badgeEl.textContent = "crm_manual";
    providerEl.textContent = "dry_run";
    reasonEl.textContent = tr("messaging_mode_manual", "Modo CRM manual activo.");
    return;
  }

  badgeEl.textContent = String(mode.resolvedMode || "crm_manual");
  providerEl.textContent = String(mode.provider || "dry_run");
  reasonEl.textContent = String(
    mode.reason ||
      (mode.resolvedMode === "cloud_api"
        ? tr("messaging_mode_cloud", "Modo Cloud API activo.")
        : tr("messaging_mode_manual", "Modo CRM manual activo.")),
  );
};

const renderLeadOwnerSelect = () => {
  const ownerSelectEl = document.getElementById("lead-owner-select");
  if (!(ownerSelectEl instanceof HTMLSelectElement)) {
    return;
  }

  const previousValue = ownerSelectEl.value;
  ownerSelectEl.innerHTML = "";

  const unassignedOption = document.createElement("option");
  unassignedOption.value = "";
  unassignedOption.textContent = tr("unassigned_owner", "Sin asignar");
  ownerSelectEl.appendChild(unassignedOption);

  state.workspaceUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    ownerSelectEl.appendChild(option);
  });

  if (previousValue && Array.from(ownerSelectEl.options).some((option) => option.value === previousValue)) {
    ownerSelectEl.value = previousValue;
  }
};

const setActiveInboxFilter = () => {
  const buttons = Array.from(document.querySelectorAll("[data-inbox-view]"));
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.inboxView === state.leadInboxView);
  });
};

const renderLeadInbox = () => {
  setActiveInboxFilter();
  const countsEl = document.getElementById("lead-inbox-counts");
  const listEl = document.getElementById("lead-inbox-list");
  if (!countsEl || !listEl) {
    return;
  }

  const inbox = state.leadInbox;
  if (!inbox) {
    countsEl.textContent = "all:0 | my:0 | unassigned:0 | overdue:0";
    listEl.innerHTML = `<li>${tr("inbox_empty", "Sin leads en esta bandeja.")}</li>`;
    return;
  }

  const counts = inbox.counts || { all: 0, my: 0, unassigned: 0, overdue: 0 };
  countsEl.textContent = `all:${counts.all || 0} | my:${counts.my || 0} | unassigned:${counts.unassigned || 0} | overdue:${counts.overdue || 0}`;
  listEl.innerHTML = "";

  if (!Array.isArray(inbox.leads) || inbox.leads.length === 0) {
    listEl.innerHTML = `<li>${tr("inbox_empty", "Sin leads en esta bandeja.")}</li>`;
    return;
  }

  inbox.leads.slice(0, 80).forEach((lead) => {
    const li = document.createElement("li");
    li.className = "list-row";

    const meta = document.createElement("div");
    meta.className = "row-meta";
    const stage = String(lead.stage || "new");
    const temperature = String(lead.healthTemperature || "warm");
    const sla = lead.sla || {};
    const overdue = sla.firstResponseBreached || sla.followupBreached ? " | SLA overdue" : "";
    meta.textContent = `${lead.name || "Lead"} | ${lead.phoneE164 || "-"} | ${stage} | owner:${getOwnerLabel(lead.ownerUserId)} | health:${temperature}${overdue}`;

    const actions = document.createElement("div");
    actions.className = "btn-row";

    const ownerSelect = document.createElement("select");
    ownerSelect.className = "inline-select";
    const ownerEmpty = document.createElement("option");
    ownerEmpty.value = "";
    ownerEmpty.textContent = tr("unassigned_owner", "Sin asignar");
    ownerSelect.appendChild(ownerEmpty);
    state.workspaceUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.name;
      ownerSelect.appendChild(option);
    });
    ownerSelect.value = lead.ownerUserId || "";

    const assignBtn = document.createElement("button");
    assignBtn.type = "button";
    assignBtn.className = "btn-xs btn-ghost";
    assignBtn.textContent = tr("label_owner", "Responsable");
    assignBtn.addEventListener("click", async () => {
      try {
        await apiRequest(`/leads/${lead.id}/assign`, {
          method: "PATCH",
          body: JSON.stringify({
            ownerUserId: ownerSelect.value || null,
          }),
        });
        setFeedback(tr("lead_assigned", "Asignacion de lead actualizada."));
        await refreshData();
      } catch (error) {
        setFeedback(error.message, true);
      }
    });

    actions.appendChild(ownerSelect);
    actions.appendChild(assignBtn);

    healthQuickEvents.forEach((config) => {
      const eventBtn = document.createElement("button");
      eventBtn.type = "button";
      eventBtn.className = "btn-xs btn-ghost";
      eventBtn.textContent = config.label;
      eventBtn.addEventListener("click", async () => {
        try {
          await apiRequest(`/leads/${lead.id}/health-events`, {
            method: "POST",
            body: JSON.stringify({ event: config.event }),
          });
          setFeedback(tr("lead_health_updated", "Salud de lead actualizada."));
          await refreshData();
        } catch (error) {
          setFeedback(error.message, true);
        }
      });
      actions.appendChild(eventBtn);
    });

    li.appendChild(meta);
    li.appendChild(actions);
    listEl.appendChild(li);
  });
};

const renderProductivity = () => {
  const assignedEl = document.getElementById("kpi-assigned");
  const overdueEl = document.getElementById("kpi-overdue");
  const funnelEl = document.getElementById("productivity-funnel-list");
  const agentsEl = document.getElementById("productivity-agents-list");
  if (!assignedEl || !overdueEl || !funnelEl || !agentsEl) {
    return;
  }

  const productivity = state.productivity;
  if (!productivity) {
    assignedEl.textContent = "0";
    overdueEl.textContent = "0";
    funnelEl.innerHTML = "<li>Sin datos</li>";
    agentsEl.innerHTML = "<li>Sin datos</li>";
    return;
  }

  assignedEl.textContent = String(productivity.totals?.assignedLeads || 0);
  overdueEl.textContent = String(productivity.totals?.overdueLeads || 0);

  const funnelLines = Array.isArray(productivity.stageFunnel)
    ? productivity.stageFunnel.map((item) => `${item.stage}: ${item.count} (${item.percentage}%)`)
    : [];
  renderSimpleList(funnelEl, funnelLines.length ? funnelLines : ["Sin datos"]);

  const agentLines = Array.isArray(productivity.agents)
    ? productivity.agents
        .slice(0, 8)
        .map(
          (item) =>
            `${item.name} | assigned:${item.assignedLeads} | open:${item.openLeads} | won:${item.wonLeads} | overdue:${item.overdueLeads}`,
        )
    : [];
  renderSimpleList(agentsEl, agentLines.length ? agentLines : ["Sin datos"]);
};

const renderCampaignPreflight = (preflight = state.campaignPreflight) => {
  const statusEl = document.getElementById("campaign-preflight-status");
  const listEl = document.getElementById("campaign-preflight-list");
  if (!statusEl || !listEl) {
    return;
  }

  if (!preflight) {
    statusEl.textContent = tr("preflight_pending", "Preflight pendiente.");
    statusEl.classList.remove("error");
    listEl.innerHTML = "";
    return;
  }

  const blockers = Array.isArray(preflight.blockers) ? preflight.blockers : [];
  const recommendations = Array.isArray(preflight.recommendations) ? preflight.recommendations : [];
  const main = preflight.canSend ? tr("preflight_ready", "Preflight ok.") : tr("preflight_blocked", "Preflight bloqueado.");
  statusEl.textContent = `${main} riesgo ${preflight.risk?.level || "low"} (${preflight.risk?.score || 0})`;
  statusEl.classList.toggle("error", !preflight.canSend);

  const lines = [
    `Opt-in: ${preflight.optedInRecipients}/${preflight.totalRecipients}`,
    `No opt-in: ${preflight.nonOptedInRecipients} (${preflight.nonOptedInPercentage}%)`,
    `Cuota: ${preflight.dailyQuota?.remaining ?? 0} restante`,
    ...blockers,
    ...recommendations,
  ];
  renderSimpleList(listEl, lines);
};

const renderStats = () => {
  document.getElementById("kpi-leads").textContent = String(state.leads.length);
  document.getElementById("kpi-optin").textContent = String(
    state.leads.filter((lead) => isLeadOptedIn(lead)).length,
  );
  document.getElementById("kpi-campaigns").textContent = String(state.campaigns.length);
};

const renderTemplates = () => {
  const listEl = document.getElementById("template-list");
  const selectEl = document.getElementById("campaign-template-id");
  listEl.innerHTML = "";
  selectEl.innerHTML = "";

  if (state.templates.length === 0) {
    listEl.innerHTML = `<li>${tr("no_templates_yet", "No templates yet.")}</li>`;
    selectEl.innerHTML = `<option value=''>${tr("create_template_first", "Create a template first")}</option>`;
    return;
  }

  state.templates.forEach((template) => {
    const li = document.createElement("li");
    li.textContent = `${template.name}: ${template.body}`;
    listEl.appendChild(li);

    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    selectEl.appendChild(option);
  });
};

const renderRecipients = () => {
  const recipientsEl = document.getElementById("campaign-recipients");
  recipientsEl.innerHTML = "";
  state.campaignPreflight = null;
  renderCampaignPreflight(null);

  const optedInLeads = state.leads.filter((lead) => isLeadOptedIn(lead));
  if (optedInLeads.length === 0) {
    recipientsEl.innerHTML = `<p>${tr("no_optedin_leads", "No opted_in leads.")}</p>`;
    return;
  }

  optedInLeads.forEach((lead) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "recipientLeadId";
    checkbox.value = lead.id;
    checkbox.checked = true;

    const text = document.createElement("span");
    text.textContent = `${lead.name} (${lead.phoneE164})`;
    label.appendChild(checkbox);
    label.appendChild(text);
    recipientsEl.appendChild(label);
  });
};

const renderReminders = () => {
  const listEl = document.getElementById("reminder-list");
  const leadSelectEl = document.getElementById("reminder-lead-id");
  listEl.innerHTML = "";
  leadSelectEl.innerHTML = "";

  if (state.leads.length === 0) {
    leadSelectEl.innerHTML = `<option value=''>${tr("no_leads_yet", "Create a lead first")}</option>`;
  } else {
    state.leads.forEach((lead) => {
      const option = document.createElement("option");
      option.value = lead.id;
      option.textContent = `${lead.name} (${lead.stage})`;
      leadSelectEl.appendChild(option);
    });
  }

  if (state.reminders.length === 0) {
    listEl.innerHTML = `<li>${tr("no_reminders", "No reminders.")}</li>`;
    return;
  }

  state.reminders
    .slice()
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .forEach((reminder) => {
      const lead = state.leads.find((item) => item.id === reminder.leadId);
      const li = document.createElement("li");
      li.className = "list-row";

      const meta = document.createElement("div");
      meta.className = "row-meta";
      meta.textContent = `${new Date(reminder.dueAt).toLocaleString()} | ${
        lead?.name || reminder.leadId
      } | ${reminder.status || "pending"} | ${reminder.note}`;

      const actions = document.createElement("div");
      actions.className = "btn-row";

      const calendarBtn = document.createElement("button");
      calendarBtn.type = "button";
      calendarBtn.className = "btn-xs btn-ghost";
      calendarBtn.textContent = tr("calendar_btn", "Calendar");
      calendarBtn.addEventListener("click", () => {
        const start = new Date(reminder.dueAt);
        if (Number.isNaN(start.getTime())) {
          return;
        }
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        const fmt = (date) => {
          const yyyy = date.getUTCFullYear();
          const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
          const dd = String(date.getUTCDate()).padStart(2, "0");
          const hh = String(date.getUTCHours()).padStart(2, "0");
          const mi = String(date.getUTCMinutes()).padStart(2, "0");
          const ss = String(date.getUTCSeconds()).padStart(2, "0");
          return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
        };
        const title = lead ? `Seguimiento ${lead.name}` : "Seguimiento lead";
        const details = `${reminder.note || ""}${lead?.phoneE164 ? ` | ${lead.phoneE164}` : ""}`;
        const url = [
          "https://calendar.google.com/calendar/render?action=TEMPLATE",
          `text=${encodeURIComponent(title)}`,
          `details=${encodeURIComponent(details)}`,
          `dates=${fmt(start)}/${fmt(end)}`,
        ].join("&");
        openInNewTab(url);
      });

      const chatBtn = document.createElement("button");
      chatBtn.type = "button";
      chatBtn.className = "btn-xs btn-ghost";
      chatBtn.textContent = tr("open_chat_btn", "Abrir chat");
      chatBtn.disabled = !lead?.phoneE164;
      chatBtn.addEventListener("click", () => {
        try {
          openChatByPhone(lead.phoneE164);
          setFeedback(tr("chat_opened", "Chat abierto en WhatsApp Web."));
        } catch (error) {
          setFeedback(error.message, true);
        }
      });

      const completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = "btn-xs btn-ghost";
      completeBtn.textContent = tr("btn_complete_reminder", "Completar");
      completeBtn.disabled = reminder.status === "done";
      completeBtn.addEventListener("click", async () => {
        try {
          await apiRequest(`/reminders/${reminder.id}/complete`, {
            method: "PATCH",
            body: JSON.stringify({}),
          });
          setFeedback(tr("reminder_completed", "Recordatorio completado."));
          await refreshData();
        } catch (error) {
          setFeedback(error.message, true);
        }
      });

      actions.appendChild(calendarBtn);
      actions.appendChild(chatBtn);
      actions.appendChild(completeBtn);
      li.appendChild(meta);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
};

const renderPipeline = () => {
  const pipelineEl = document.getElementById("pipeline");
  pipelineEl.innerHTML = "";

  stages.forEach((stage) => {
    const leadsInStage = state.leads.filter((lead) => lead.stage === stage);
    const col = document.createElement("article");
    col.className = "pipeline-col";
    col.dataset.stage = stage;

    const title = document.createElement("h3");
    title.textContent = `${stage} (${leadsInStage.length})`;
    col.appendChild(title);

    col.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    col.addEventListener("dragenter", () => {
      col.classList.add("drop-target");
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("drop-target");
    });
    col.addEventListener("drop", async (event) => {
      event.preventDefault();
      col.classList.remove("drop-target");
      if (!state.draggedLeadId) {
        return;
      }
      const targetLead = state.leads.find((lead) => lead.id === state.draggedLeadId);
      if (!targetLead || targetLead.stage === stage) {
        state.draggedLeadId = "";
        return;
      }
      try {
        await apiRequest(`/leads/${state.draggedLeadId}/stage`, {
          method: "PATCH",
          body: JSON.stringify({ stage }),
        });
        setFeedback(tr("stage_updated", "Etapa actualizada."));
        await refreshData();
      } catch (error) {
        setFeedback(error.message, true);
      } finally {
        state.draggedLeadId = "";
      }
    });

    if (leadsInStage.length === 0) {
      const empty = document.createElement("span");
      empty.className = "pill";
      empty.textContent = tr("kanban_empty", "No leads");
      col.appendChild(empty);
    } else {
      leadsInStage.forEach((lead) => {
        const card = document.createElement("div");
        card.className = "pipeline-card";
        card.draggable = true;

        const nameEl = document.createElement("strong");
        nameEl.textContent = lead.name;
        const phoneEl = document.createElement("small");
        phoneEl.textContent = lead.phoneE164 || "-";
        card.appendChild(nameEl);
        card.appendChild(phoneEl);

        card.addEventListener("dragstart", () => {
          state.draggedLeadId = lead.id;
          card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
          state.draggedLeadId = "";
        });
        col.appendChild(card);
      });
    }

    pipelineEl.appendChild(col);
  });
};

const getActiveSegment = () => {
  if (state.activeSegmentId === "all") {
    return null;
  }
  return state.segments.find((segment) => segment.id === state.activeSegmentId) || null;
};

const leadMatchesSegment = (lead, segment) => {
  const value = String(segment.value || "").trim().toLowerCase();
  if (!value) {
    return false;
  }
  const tags = Array.isArray(lead.tags) ? lead.tags.map((tag) => slugTag(tag)) : [];

  if (segment.type === "stage") {
    return String(lead.stage || "").toLowerCase() === value;
  }
  if (segment.type === "source") {
    return String(lead.consentSource || "").toLowerCase().includes(value);
  }
  if (segment.type === "urgency") {
    const needle = slugTag(value);
    return tags.some((tag) => tag.includes(`urg_${needle}`) || tag === needle || tag.includes("urgente"));
  }
  if (segment.type === "agent") {
    const needle = slugTag(value);
    const ownerLabel = slugTag(getOwnerLabel(lead.ownerUserId));
    const ownerId = slugTag(lead.ownerUserId || "");
    return (
      ownerLabel.includes(needle) ||
      ownerId.includes(needle) ||
      tags.some((tag) => tag === `agent_${needle}` || tag === `asesor_${needle}` || tag === needle)
    );
  }

  const needle = slugTag(value);
  return tags.includes(needle);
};

const renderSegmentTabs = () => {
  const tabsEl = document.getElementById("segment-tabs");
  if (!tabsEl) {
    return;
  }
  tabsEl.innerHTML = "";

  const addSegmentButton = (segmentId, label, title = "") => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.classList.toggle("active", state.activeSegmentId === segmentId);
    btn.textContent = label;
    if (title) {
      btn.title = title;
    }
    btn.addEventListener("click", async () => {
      state.activeSegmentId = segmentId;
      await storageSet({ [ACTIVE_SEGMENT_STORAGE_KEY]: state.activeSegmentId });
      renderSegmentTabs();
      renderSegmentLeads();
    });
    tabsEl.appendChild(btn);
  };

  addSegmentButton("all", tr("all_segments", "Todos"));

  state.segments.forEach((segment) => {
    addSegmentButton(segment.id, segment.name, `${segment.type}: ${segment.value}`);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "chip";
    removeBtn.textContent = `x ${segment.name}`;
    removeBtn.title = tr("delete_btn", "Quitar");
    removeBtn.addEventListener("click", async () => {
      state.segments = state.segments.filter((item) => item.id !== segment.id);
      if (state.activeSegmentId === segment.id) {
        state.activeSegmentId = "all";
      }
      await persistSegments();
      renderSegmentTabs();
      renderSegmentLeads();
      setFeedback(tr("segment_removed", "Pestana eliminada."));
    });
    tabsEl.appendChild(removeBtn);
  });
};

const renderSegmentLeads = () => {
  const listEl = document.getElementById("segment-lead-list");
  if (!listEl) {
    return;
  }
  listEl.innerHTML = "";
  const segment = getActiveSegment();
  const leads = !segment ? state.leads : state.leads.filter((lead) => leadMatchesSegment(lead, segment));

  if (!leads.length) {
    listEl.innerHTML = `<li>${tr("no_segment_leads", "Sin leads en este segmento.")}</li>`;
    return;
  }

  leads.slice(0, 60).forEach((lead) => {
    const li = document.createElement("li");
    li.className = "list-row";

    const meta = document.createElement("div");
    meta.className = "row-meta";
    meta.textContent = `${lead.name || "Lead"} | ${lead.phoneE164 || "-"} | ${lead.stage}`;

    const actions = document.createElement("div");
    actions.className = "btn-row";

    const fillBtn = document.createElement("button");
    fillBtn.type = "button";
    fillBtn.className = "btn-xs btn-ghost";
    fillBtn.textContent = tr("use_btn", "Usar");
    fillBtn.addEventListener("click", () => {
      const form = document.getElementById("lead-form");
      if (!(form instanceof HTMLFormElement)) {
        return;
      }
      form.elements.namedItem("name").value = lead.name || "";
      form.elements.namedItem("phoneE164").value = lead.phoneE164 || "";
      form.elements.namedItem("consentStatus").value = lead.consentStatus || "pending";
      form.elements.namedItem("stage").value = lead.stage || "new";
      form.elements.namedItem("consentSource").value = lead.consentSource || "manual";
      form.elements.namedItem("tags").value = Array.isArray(lead.tags) ? lead.tags.join(", ") : "";
      const ownerField = form.elements.namedItem("ownerUserId");
      if (ownerField) {
        ownerField.value = lead.ownerUserId || "";
      }
    });

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn-xs btn-ghost";
    openBtn.textContent = tr("open_chat_btn", "Abrir chat");
    openBtn.disabled = !lead.phoneE164;
    openBtn.addEventListener("click", () => {
      try {
        openChatByPhone(lead.phoneE164);
        setFeedback(tr("chat_opened", "Chat abierto en WhatsApp Web."));
      } catch (error) {
        setFeedback(error.message, true);
      }
    });

    actions.appendChild(fillBtn);
    actions.appendChild(openBtn);
    li.appendChild(meta);
    li.appendChild(actions);
    listEl.appendChild(li);
  });
};

const refreshSubscription = async () => {
  const data = await apiRequest("/billing/subscription");
  state.subscription = data.subscription || null;
  renderSubscription();
};

const fetchLeadInbox = async (view = state.leadInboxView) => {
  const safeView = inboxViews.includes(view) ? view : "my";
  const response = await optionalApiRequest(
    "leadsInbox",
    `/leads/inbox?view=${encodeURIComponent(safeView)}`,
    { inbox: null },
  );
  state.leadInboxView = safeView;
  state.leadInbox = response.inbox || null;
};

const refreshData = async () => {
  const safeView = inboxViews.includes(state.leadInboxView) ? state.leadInboxView : "my";
  const [leadsData, templatesData, campaignsData, remindersData] = await Promise.all([
    apiRequest("/leads"),
    apiRequest("/templates"),
    apiRequest("/campaigns"),
    apiRequest("/reminders"),
  ]);
  const [complianceData, usersData, inboxData, analyticsData, modeData] = await Promise.all([
    optionalApiRequest("complianceTrustCenter", "/compliance/trust-center", { trustCenter: null }),
    optionalApiRequest("authUsers", "/auth/users", { users: [] }),
    optionalApiRequest("leadsInbox", `/leads/inbox?view=${encodeURIComponent(safeView)}`, { inbox: null }),
    optionalApiRequest("analyticsProductivity", "/analytics/productivity", { productivity: null }),
    optionalApiRequest("complianceMessagingMode", "/compliance/messaging-mode", { mode: null }),
  ]);

  state.leads = leadsData.leads || [];
  state.templates = templatesData.templates || [];
  state.campaigns = campaignsData.campaigns || [];
  state.reminders = remindersData.reminders || [];
  state.trustCenter = complianceData.trustCenter || null;
  state.workspaceUsers = usersData.users || [];
  state.leadInbox = inboxData.inbox || null;
  state.leadInboxView = state.leadInbox?.view || safeView;
  state.productivity = analyticsData.productivity || null;
  state.messagingMode = modeData.mode || null;

  renderStats();
  renderTrustCenter();
  renderMessagingMode();
  renderLeadOwnerSelect();
  renderTemplates();
  renderRecipients();
  renderCampaignPreflight();
  renderReminders();
  renderPipeline();
  renderLeadInbox();
  renderProductivity();
  renderSegmentTabs();
  renderSegmentLeads();
};

const bootstrapAuthenticated = async () => {
  resetApiCapabilities();
  const me = await apiRequest("/auth/me");
  state.authUser = me.user;
  state.workspace = me.workspace;
  applyWorkspaceSegments();
  renderSession();

  await refreshSubscription();
  const canUseCrm = Boolean(state.subscription?.canUseCrm);
  setCrmVisibility(canUseCrm);

  if (canUseCrm) {
    try {
      await refreshData();
      setFeedback(tr("session_active", "Sesion activa y CRM habilitado."));
    } catch (error) {
      setFeedback(
        `Sesion activa, pero algunos modulos no pudieron cargarse: ${error.message}`,
        true,
      );
    }
  } else {
    state.trustCenter = null;
    state.messagingMode = null;
    state.leadInbox = null;
    state.workspaceUsers = [];
    state.productivity = null;
    renderTrustCenter();
    renderMessagingMode();
    renderLeadOwnerSelect();
    renderLeadInbox();
    renderProductivity();
    setFeedback(tr("subscription_inactive_feedback", "Suscripcion inactiva. Solicita activacion al administrador."), true);
  }
};

const resetState = () => {
  resetApiCapabilities();
  persistToken("");
  state.authUser = null;
  state.workspace = null;
  state.subscription = null;
  state.trustCenter = null;
  state.messagingMode = null;
  state.campaignPreflight = null;
  state.leadInbox = null;
  state.leadInboxView = "my";
  state.leads = [];
  state.templates = [];
  state.campaigns = [];
  state.reminders = [];
  state.workspaceUsers = [];
  state.productivity = null;
  state.segments = [];
  state.activeSegmentId = "all";
  renderSession();
  renderSubscription();
  renderTrustCenter();
  renderMessagingMode();
  renderLeadOwnerSelect();
  renderCampaignPreflight(null);
  renderLeadInbox();
  renderProductivity();
  renderSegmentTabs();
  renderSegmentLeads();
  setCrmVisibility(false);
};

const normalizeCsvHeader = (header) => slugTag(header).replace(/^_+|_+$/g, "");

const parseCsvMatrix = (text) => {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
};

const parseCsvObjects = (text) => {
  const matrix = parseCsvMatrix(text);
  if (!matrix.length) {
    return [];
  }
  const headers = matrix[0].map((header) => normalizeCsvHeader(header));
  return matrix.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = String(cells[index] || "").trim();
    });
    return row;
  });
};

const pickCsv = (row, aliases) => {
  for (const alias of aliases) {
    const value = row[normalizeCsvHeader(alias)];
    if (value) {
      return String(value).trim();
    }
  }
  return "";
};

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || ""),
  };

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    persistToken(result.token);
    await bootstrapAuthenticated();
  } catch (error) {
    setFeedback(error.message || "Login failed", true);
  }
});

document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    companyName: String(data.get("companyName") || "").trim(),
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    password: String(data.get("password") || ""),
  };

  try {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    persistToken(result.token);
    setFeedback(tr("account_created", "Cuenta creada. Sesion iniciada."));
    await bootstrapAuthenticated();
  } catch (error) {
    setFeedback(error.message || "Register failed", true);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    if (state.token) {
      await apiRequest("/auth/logout", { method: "POST" });
    }
  } catch (_error) {
    // Ignore logout API errors and clear local state anyway.
  } finally {
    resetState();
    setFeedback(tr("logged_out", "Sesion cerrada."));
  }
});

document.getElementById("backend-config-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const raw = String(data.get("backendUrl") || "").trim();
  const normalized = normalizeApiBaseUrl(raw);
  if (!normalized) {
    setFeedback(tr("backend_invalid_url", "URL de backend invalida."), true);
    return;
  }

  await persistApiBaseUrl(normalized);
  setFeedback(tr("backend_saved", "BACKEND_URL actualizada."));
});

document.getElementById("lead-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const tagsRaw = String(data.get("tags") || "");
  const payload = {
    name: String(data.get("name") || "").trim(),
    phoneE164: normalizePhone(String(data.get("phoneE164") || "").trim()),
    consentStatus: String(data.get("consentStatus") || "pending"),
    consentSource: String(data.get("consentSource") || "manual").trim(),
    stage: String(data.get("stage") || "new"),
    ownerUserId: String(data.get("ownerUserId") || "").trim() || null,
    tags: tagsRaw
      .split(",")
      .map((item) => slugTag(item))
      .filter(Boolean),
  };

  try {
    await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    setFeedback(tr("lead_saved", "Lead saved."));
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("template-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    name: String(data.get("name") || "").trim(),
    body: String(data.get("body") || "").trim(),
  };

  try {
    await apiRequest("/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    setFeedback(tr("template_saved", "Template saved."));
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

const buildCampaignPayloadFromForm = (form) => {
  const data = new FormData(form);
  const recipientLeadIds = Array.from(document.querySelectorAll("input[name='recipientLeadId']:checked")).map(
    (checkbox) => checkbox.value,
  );
  const optedInLeadIds = new Set(
    state.leads
      .filter((lead) => isLeadOptedIn(lead))
      .map((lead) => String(lead.id || "")),
  );
  const safeRecipientLeadIds = recipientLeadIds.filter((leadId) => optedInLeadIds.has(String(leadId || "")));
  if (safeRecipientLeadIds.length === 0) {
    throw new Error(tr("campaign_recipients_required", "Selecciona al menos un lead opted_in."));
  }

  return {
    name: String(data.get("name") || "").trim(),
    templateId: String(data.get("templateId") || "").trim(),
    recipientLeadIds: safeRecipientLeadIds,
  };
};

const runCampaignPreflight = async (payload) => {
  const preflightData = await apiRequest("/campaigns/preflight", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  state.campaignPreflight = preflightData.preflight || null;
  renderCampaignPreflight(state.campaignPreflight);
  return state.campaignPreflight;
};

document.getElementById("campaign-preflight-btn")?.addEventListener("click", async () => {
  const form = document.getElementById("campaign-form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  try {
    const payload = buildCampaignPayloadFromForm(form);
    const preflight = await runCampaignPreflight(payload);
    if (!preflight?.canSend) {
      setFeedback(tr("preflight_blocked", "Preflight bloqueo la campana."), true);
      return;
    }
    setFeedback(tr("preflight_ready", "Preflight ok."));
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("campaign-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    const payload = buildCampaignPayloadFromForm(form);
    const preflight = await runCampaignPreflight(payload);
    if (!preflight?.canSend) {
      setFeedback(tr("preflight_blocked", "Preflight bloqueo la campana."), true);
      return;
    }

    const created = await apiRequest("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await apiRequest(`/campaigns/${created.campaign.id}/send`, {
      method: "POST",
    });

    form.reset();
    state.campaignPreflight = null;
    renderCampaignPreflight(null);
    setFeedback(tr("campaign_sent", "Campaign sent."));
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("reminder-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const dueAtRaw = String(data.get("dueAt") || "").trim();
  const dueAtDate = new Date(dueAtRaw);
  if (!dueAtRaw || Number.isNaN(dueAtDate.getTime())) {
    setFeedback(tr("reminder_invalid_date", "Fecha/hora invalida para recordatorio."), true);
    return;
  }

  const payload = {
    leadId: String(data.get("leadId") || "").trim(),
    note: String(data.get("note") || "").trim(),
    dueAt: dueAtDate.toISOString(),
  };

  try {
    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    setFeedback(tr("reminder_created", "Reminder created."));
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("segment-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = String(data.get("name") || "").trim();
  const type = String(data.get("type") || "tag").trim();
  const value = String(data.get("value") || "").trim();

  if (!name || !value) {
    setFeedback(tr("segment_invalid", "Completa nombre y valor de la pestana."), true);
    return;
  }

  const exists = state.segments.some((segment) => segment.type === type && slugTag(segment.value) === slugTag(value));
  if (exists) {
    setFeedback(tr("segment_exists", "Ya existe una pestana igual."), true);
    return;
  }

  state.segments = [
    ...state.segments,
    {
      id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.slice(0, 24),
      type,
      value: value.slice(0, 40),
    },
  ].slice(0, 12);
  state.activeSegmentId = state.segments[state.segments.length - 1].id;
  await persistSegments();
  event.currentTarget.reset();
  renderSegmentTabs();
  renderSegmentLeads();
  setFeedback(tr("segment_saved", "Pestana guardada."));
});

document.getElementById("lead-inbox-filters")?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("[data-inbox-view]");
  if (!(button instanceof HTMLElement)) {
    return;
  }

  const view = String(button.dataset.inboxView || "").trim();
  if (!inboxViews.includes(view)) {
    return;
  }

  state.leadInboxView = view;
  setActiveInboxFilter();

  if (!state.token || !state.subscription?.canUseCrm) {
    return;
  }

  try {
    await fetchLeadInbox(view);
    renderLeadInbox();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("unsaved-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const phone = String(data.get("phoneE164") || "").trim();
  const message = String(data.get("message") || "").trim();

  try {
    openChatByPhone(phone, message);
    setFeedback(tr("chat_opened", "Chat abierto en WhatsApp Web."));
    event.currentTarget.reset();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("csv-import-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const file = data.get("file");
  const defaultConsent = String(data.get("consentStatus") || "pending");
  const defaultStage = String(data.get("stage") || "new");

  if (!(file instanceof File)) {
    setFeedback(tr("csv_no_rows", "El CSV no trae filas validas."), true);
    return;
  }

  setFeedback(tr("csv_processing", "Importando CSV..."));
  const text = await file.text();
  const rows = parseCsvObjects(text);
  if (!rows.length) {
    setFeedback(tr("csv_no_rows", "El CSV no trae filas validas."), true);
    return;
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const name = pickCsv(row, ["name", "nombre", "contacto", "full_name"]) || `Lead ${imported + skipped + failed + 1}`;
    const phone = normalizePhone(pickCsv(row, ["phonee164", "phone", "telefono", "celular", "numero", "whatsapp"]));
    if (!phone) {
      skipped += 1;
      continue;
    }
    const tags = pickCsv(row, ["tags", "etiquetas"])
      .split(/[;,]/)
      .map((item) => slugTag(item))
      .filter(Boolean)
      .slice(0, 8);

    const payload = {
      name,
      phoneE164: phone,
      consentStatus: String(pickCsv(row, ["consentstatus", "consent", "optin"]) || defaultConsent).toLowerCase(),
      consentSource: pickCsv(row, ["consentsource", "source", "fuente"]) || "csv_import",
      stage: String(pickCsv(row, ["stage", "etapa"]) || defaultStage).toLowerCase(),
      tags,
    };

    if (!["opted_in", "pending", "opted_out"].includes(payload.consentStatus)) {
      payload.consentStatus = defaultConsent;
    }
    if (!stages.includes(payload.stage)) {
      payload.stage = defaultStage;
    }

    try {
      await apiRequest("/leads/upsert", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      imported += 1;
    } catch (_error) {
      failed += 1;
    }
  }

  await refreshData();
  setFeedback(`${tr("csv_import_result", "Importacion CSV completada.")} ok:${imported} | skip:${skipped} | err:${failed}`);
  event.currentTarget.reset();
});

languageSelectEl?.addEventListener("change", async () => {
  state.language = ["es", "en", "pt"].includes(languageSelectEl.value) ? languageSelectEl.value : "es";
  await storageSet({ [LANG_STORAGE_KEY]: state.language });
  applyTranslations();
  renderBackendConfig();
  renderSession();
  renderSubscription();
  renderTrustCenter();
  renderMessagingMode();
  renderLeadOwnerSelect();
  renderTemplates();
  renderRecipients();
  renderCampaignPreflight();
  renderReminders();
  renderPipeline();
  renderLeadInbox();
  renderProductivity();
  renderSegmentTabs();
  renderSegmentLeads();
});

const bootstrap = async () => {
  const shared = await storageGet([
    "crm_token",
    LANG_STORAGE_KEY,
    SEGMENTS_STORAGE_KEY,
    ACTIVE_SEGMENT_STORAGE_KEY,
    BACKEND_URL_STORAGE_KEY,
    "crm_api_base_url",
  ]);

  if (typeof shared.crm_token === "string" && shared.crm_token.trim()) {
    state.token = shared.crm_token.trim();
    localStorage.setItem("crm_token", state.token);
  }

  state.language = ["es", "en", "pt"].includes(shared[LANG_STORAGE_KEY]) ? shared[LANG_STORAGE_KEY] : "es";
  state.segmentsStore = normalizeSegmentsStore(shared[SEGMENTS_STORAGE_KEY]);
  state.activeSegmentId = String(shared[ACTIVE_SEGMENT_STORAGE_KEY] || "all");

  const configuredUrl =
    shared[BACKEND_URL_STORAGE_KEY] ||
    shared.crm_api_base_url ||
    localStorage.getItem(BACKEND_URL_STORAGE_KEY) ||
    localStorage.getItem("crm_api_base_url") ||
    DEFAULT_API_BASE_URL;
  state.apiBaseUrl = normalizeApiBaseUrl(configuredUrl) || DEFAULT_API_BASE_URL;
  await persistApiBaseUrl(state.apiBaseUrl);

  applyTranslations();
  renderBackendConfig();
  setCrmVisibility(false);
  applyWorkspaceSegments();
  renderSession();
  renderSubscription();
  renderTrustCenter();
  renderMessagingMode();
  renderLeadOwnerSelect();
  renderCampaignPreflight(null);
  renderLeadInbox();
  renderProductivity();
  renderSegmentTabs();
  renderSegmentLeads();

  if (!state.token) {
    setFeedback(tr("login_required", "Inicia sesion para usar el CRM."));
    return;
  }

  try {
    await bootstrapAuthenticated();
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode === 401 || statusCode === 403) {
      resetState();
      setFeedback(`${tr("session_invalid", "Sesion invalida:")} ${error.message}`, true);
      return;
    }
    setFeedback(`No se pudo completar la carga inicial: ${error.message}`, true);
  }
};

void bootstrap();
