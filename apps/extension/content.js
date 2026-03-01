(() => {
  if (window.__wacrmInjected) {
    return;
  }
  window.__wacrmInjected = true;

  const DEFAULT_API_BASE_URL = "https://whats-crm-compliant.vercel.app/api/v1";
  const BACKEND_URL_STORAGE_KEY = "crm_backend_url";
  const STORAGE_KEYS = [
    BACKEND_URL_STORAGE_KEY,
    "crm_api_base_url",
    "crm_token",
    "crm_google_client_id",
    "crm_firebase_web_api_key",
    "crm_tutorial_progress_v1",
    "crm_followup_usage_v1",
    "crm_panel_position_v1",
    "crm_custom_stages_v1",
    "crm_blur_mode_v1",
    "crm_template_mode_v1",
  ];
  const FOLLOWUP_USAGE_KEY = "crm_followup_usage_v1";
  const FOLLOWUP_DAILY_LIMIT = 20;
  const FOLLOWUP_USAGE_RETENTION_DAYS = 45;
  const LEAD_STAGES = ["new", "contacted", "qualified", "won", "lost"];
  const CONSENT_STATES = ["opted_in", "pending", "opted_out"];
  const LEAD_INBOX_VIEWS = ["my", "unassigned", "overdue", "all"];
  const LEAD_INBOX_LABELS = {
    my: "Mis leads",
    unassigned: "Sin asignar",
    overdue: "Vencidos",
    all: "Todos",
  };
  const LEAD_HEALTH_EVENT_SHORTCUTS = [
    { event: "responded", label: "Respondio" },
    { event: "appointment_set", label: "Cita" },
    { event: "no_response_72h", label: "72h" },
    { event: "spam_reported", label: "Spam" },
  ];
  const CRM_BUILD_TAG = "0.4.8-2026-02-28";
  const WA_TOP_BAR_ID = "wacrm-wa-topbar";
  const WA_COMPOSER_BAR_ID = "wacrm-wa-composerbar";
  const TUTORIAL_PROGRESS_KEY = "crm_tutorial_progress_v1";
  const PANEL_POSITION_KEY = "crm_panel_position_v1";
  const CUSTOM_STAGES_KEY = "crm_custom_stages_v1";
  const BLUR_MODE_KEY = "crm_blur_mode_v1";
  const TEMPLATE_MODE_KEY = "crm_template_mode_v1";
  const PIPELINE_STAGE_TAG_PREFIX = "step_";
  const PIPELINE_STAGE_KEY_MAX_LEN = 25;
  const TEMPLATE_MODES = ["general", "real_estate"];
  const DEFAULT_TEMPLATE_MODE = "real_estate";
  const TUTORIAL_STEPS = [
    {
      id: "open_chat",
      label: "Abrir un chat activo",
      hint: "Selecciona un chat en WhatsApp para prellenar nombre/telefono.",
    },
    {
      id: "save_lead",
      label: "Guardar lead",
      hint: "Completa datos base y pulsa Guardar lead.",
    },
    {
      id: "set_stage",
      label: "Actualizar etapa",
      hint: "Usa atajos o selector de etapa para mover el lead en pipeline.",
    },
    {
      id: "add_profile",
      label: "Completar ficha del lead",
      hint: "En modo Inmobiliaria define operacion/zona/presupuesto; en General registra datos clave de calificacion.",
    },
    {
      id: "insert_template",
      label: "Insertar plantilla",
      hint: "Inserta texto en el chat y envia manualmente.",
    },
    {
      id: "create_followup",
      label: "Crear seguimiento",
      hint: "Programa recordatorio manual o rapido en horas.",
    },
  ];
  const PROFILE_NOTE_PREFIX = "FICHA_INMO|";
  const SUGGESTED_TAGS_BY_TEMPLATE = {
    general: ["nuevo", "seguimiento", "caliente", "propuesta", "vip", "cerrar", "referido", "recompra"],
    real_estate: ["comprador", "propietario", "inversionista", "alquiler", "venta", "departamento", "casa", "terreno", "credito", "urgente"],
  };
  const STAGE_SHORTCUTS_BY_TEMPLATE = {
    general: [
      { key: "nuevo", label: "Nuevo", stage: "new", note: "Lead registrado en CRM." },
      { key: "contactado", label: "Contactado", stage: "contacted", note: "Contacto inicial realizado." },
      { key: "propuesta", label: "Propuesta", stage: "qualified", note: "Propuesta enviada al lead." },
      { key: "negociacion", label: "Negociacion", stage: "qualified", note: "Lead en negociacion activa." },
      { key: "cierre", label: "Cierre", stage: "won", note: "Lead marcado como cierre exitoso." },
      { key: "perdido", label: "Perdido", stage: "lost", note: "Lead descartado por ahora." },
    ],
    real_estate: [
      { key: "nuevo", label: "Nuevo", stage: "new", note: "Lead registrado en CRM." },
      { key: "contactado", label: "Contactado", stage: "contacted", note: "Contacto inicial realizado." },
      { key: "visita", label: "Visita", stage: "qualified", note: "Visita agendada para este lead." },
      { key: "oferta", label: "Oferta", stage: "qualified", note: "Lead solicita propuesta/oferta." },
      { key: "cierre", label: "Cierre", stage: "won", note: "Lead marcado como cierre exitoso." },
      { key: "perdido", label: "Perdido", stage: "lost", note: "Lead descartado por ahora." },
    ],
  };
  const RESERVED_STAGE_KEYS = Array.from(
    new Set(
      Object.values(STAGE_SHORTCUTS_BY_TEMPLATE)
        .reduce((acc, list) => acc.concat(Array.isArray(list) ? list : []), [])
        .map((shortcut) => shortcut.key)
    )
  );
  const REAL_ESTATE_PROFILE = {
    operation: [
      { value: "", label: "Selecciona" },
      { value: "compra", label: "Compra" },
      { value: "alquiler", label: "Alquiler" },
      { value: "venta_propietario", label: "Venta propietario" },
    ],
    propertyType: [
      { value: "", label: "Selecciona" },
      { value: "departamento", label: "Departamento" },
      { value: "casa", label: "Casa" },
      { value: "terreno", label: "Terreno" },
      { value: "oficina", label: "Oficina" },
      { value: "local", label: "Local comercial" },
    ],
    bedrooms: [
      { value: "", label: "N/A" },
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4+" },
    ],
    timeline: [
      { value: "", label: "Sin definir" },
      { value: "7_dias", label: "7 dias" },
      { value: "30_dias", label: "30 dias" },
      { value: "90_dias", label: "90 dias" },
      { value: "6_meses", label: "6 meses" },
    ],
    source: [
      { value: "", label: "Sin fuente" },
      { value: "meta_ads", label: "Meta Ads" },
      { value: "tiktok", label: "TikTok" },
      { value: "referido", label: "Referido" },
      { value: "portal", label: "Portal inmobiliario" },
      { value: "organico", label: "Organico" },
    ],
    urgency: [
      { value: "", label: "Normal" },
      { value: "alta", label: "Alta" },
      { value: "media", label: "Media" },
      { value: "baja", label: "Baja" },
    ],
  };

  const getChromeApi = () => {
    try {
      if (typeof chrome === "undefined") {
        return null;
      }
      return chrome;
    } catch (_error) {
      return null;
    }
  };

  const hasChromeStorage = () => {
    const chromeApi = getChromeApi();
    try {
      return Boolean(chromeApi?.storage?.local);
    } catch (_error) {
      return false;
    }
  };
  const state = {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    token: "",
    me: null,
    subscription: null,
    canUseCrm: false,
    trustCenter: null,
    messagingMode: null,
    templates: [],
    leads: [],
    reminders: [],
    workspaceUsers: [],
    leadInbox: null,
    leadInboxView: "my",
    productivity: null,
    apiCapabilities: {
      complianceTrustCenter: true,
      complianceMessagingMode: true,
      leadsInbox: true,
      analyticsProductivity: true,
      authUsers: true,
      complianceManualAssist: true,
    },
    currentLead: null,
    currentChat: null,
    activeSection: "overview",
    dockOpen: false,
    collapsed: false,
    syncing: false,
    syncTimer: null,
    tutorialProgress: {},
    panelPosition: null,
    workspaceId: "",
    customStages: [],
    customStageStore: {},
    stageFilterKey: "all",
    blurMode: false,
    templateMode: DEFAULT_TEMPLATE_MODE,
    templateModeStore: {},
    nodes: {},
  };

  const isExtensionContextAlive = () => true;

  const isInvalidatedContextError = (errorOrMessage) => {
    const raw = typeof errorOrMessage === "string"
      ? errorOrMessage
      : String(errorOrMessage?.message || errorOrMessage || "");
    return raw.toLowerCase().includes("extension context invalidated");
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (isInvalidatedContextError(event?.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    if (isInvalidatedContextError(event?.error || event?.message)) {
      event.preventDefault();
    }
  });

  const storageGet = async (keys) => {
    if (!hasChromeStorage() || !isExtensionContextAlive()) {
      return {};
    }

    return new Promise((resolve) => {
      const chromeApi = getChromeApi();
      try {
        chromeApi?.storage?.local?.get?.(keys, (result) => {
          try {
            if (!chromeApi) {
              resolve({});
              return;
            }
          } catch (_error) {
            resolve({});
            return;
          }
          resolve(result || {});
        });
      } catch (error) {
        if (isInvalidatedContextError(error)) {
          resolve({});
          return;
        }
        resolve({});
      }
    });
  };

  const parseApiError = async (response) => {
    const payload = await response.json().catch(() => ({}));
    return payload?.error?.message || `HTTP ${response.status}`;
  };

  const apiRequest = async (path, options = {}) => {
    const headers = options.headers || {};
    const authHeaders = state.token ? { Authorization: `Bearer ${state.token}` } : {};
    const response = await fetch(`${state.apiBaseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...authHeaders, ...headers },
      ...options,
    });

    if (!response.ok) {
      const error = new Error(await parseApiError(response));
      error.statusCode = response.status;
      throw error;
    }

    return response.json().catch(() => ({}));
  };

  const isEndpointMissingError = (error) => {
    const status = Number(error?.statusCode || 0);
    return status === 404 || status === 405;
  };

  const optionalApiRequest = async (capabilityKey, path, fallbackValue, options = {}) => {
    if (state.apiCapabilities[capabilityKey] === false) {
      return fallbackValue;
    }

    try {
      return await apiRequest(path, options);
    } catch (error) {
      if (isEndpointMissingError(error)) {
        state.apiCapabilities[capabilityKey] = false;
        return fallbackValue;
      }
      throw error;
    }
  };

  const resetApiCapabilities = () => {
    state.apiCapabilities = {
      complianceTrustCenter: true,
      complianceMessagingMode: true,
      leadsInbox: true,
      analyticsProductivity: true,
      authUsers: true,
      complianceManualAssist: true,
    };
  };

  const normalizeApiBaseUrl = (input) => {
    const raw = String(input || "").trim();
    if (!raw) {
      return DEFAULT_API_BASE_URL;
    }

    try {
      const candidate = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
      const parsed = new URL(candidate);
      const basePath = parsed.pathname.replace(/\/+$/, "");
      parsed.pathname = basePath.endsWith("/api/v1") ? basePath : `${basePath || ""}/api/v1`;
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString().replace(/\/$/, "");
    } catch (_error) {
      return DEFAULT_API_BASE_URL;
    }
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

  const extractPhoneFromText = (text) => {
    const match = String(text || "").match(/\+?\d[\d\s-]{7,}/);
    return normalizePhone(match?.[0] || "");
  };

  const storageSet = async (payload) => {
    if (!hasChromeStorage() || !isExtensionContextAlive()) {
      return;
    }

    await new Promise((resolve) => {
      const chromeApi = getChromeApi();
      try {
        chromeApi?.storage?.local?.set?.(payload, () => resolve());
      } catch (_error) {
        resolve();
      }
    });
  };

  const populateSelect = (selectEl, options) => {
    if (!selectEl) {
      return;
    }
    selectEl.innerHTML = "";
    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      selectEl.appendChild(option);
    });
  };

  const normalizePanelPosition = (raw) => {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const left = Number(raw.left);
    const top = Number(raw.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return null;
    }
    return { left, top };
  };

  const clampPanelPosition = (left, top) => {
    const root = state.nodes.root;
    const margin = 8;
    const width = Math.round(root?.getBoundingClientRect?.().width || 368);
    const height = Math.round(root?.getBoundingClientRect?.().height || 120);
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    return {
      left: Math.min(Math.max(Math.round(left), margin), maxLeft),
      top: Math.min(Math.max(Math.round(top), margin), maxTop),
    };
  };

  const applyPanelPosition = (left, top) => {
    const root = state.nodes.root;
    if (!root) {
      return;
    }
    const next = clampPanelPosition(left, top);
    root.style.left = `${next.left}px`;
    root.style.top = `${next.top}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  };

  const persistPanelPosition = async () => {
    await storageSet({ [PANEL_POSITION_KEY]: state.panelPosition });
  };

  const clearPanelPosition = async () => {
    state.panelPosition = null;
    await storageSet({ [PANEL_POSITION_KEY]: null });
  };

  const enablePanelDragging = (root) => {
    const header = root.querySelector(".wacrm-header");
    if (!(header instanceof HTMLElement)) {
      return;
    }

    let dragState = null;

    const onMouseMove = (event) => {
      if (!dragState) {
        return;
      }
      const left = event.clientX - dragState.offsetX;
      const top = event.clientY - dragState.offsetY;
      state.panelPosition = clampPanelPosition(left, top);
      applyPanelPosition(state.panelPosition.left, state.panelPosition.top);
    };

    const onMouseUp = async () => {
      if (!dragState) {
        return;
      }
      dragState = null;
      root.querySelector(".wacrm-card")?.classList.remove("wacrm-dragging");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      await persistPanelPosition();
    };

    header.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("button")) {
        return;
      }

      const panelRect = root.getBoundingClientRect();
      dragState = {
        offsetX: event.clientX - panelRect.left,
        offsetY: event.clientY - panelRect.top,
      };
      root.querySelector(".wacrm-card")?.classList.add("wacrm-dragging");
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      event.preventDefault();
    });

    header.addEventListener("dblclick", (event) => {
      if (event.target instanceof Element && event.target.closest("button")) {
        return;
      }
      void clearPanelPosition().then(() => {
        positionPanel();
      });
    });
  };

  const slugTag = (value) => {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30);
  };

  const parseCsvTags = (raw) => {
    return String(raw || "")
      .split(",")
      .map((item) => slugTag(item))
      .filter(Boolean);
  };

  const mergeTags = (...tagLists) => {
    const unique = new Set();
    tagLists.forEach((list) => {
      if (!Array.isArray(list)) {
        const clean = slugTag(list);
        if (clean) {
          unique.add(clean);
        }
        return;
      }
      list.forEach((tag) => {
        const clean = slugTag(tag);
        if (clean) {
          unique.add(clean);
        }
      });
    });
    return Array.from(unique).slice(0, 8);
  };

  const normalizePipelineStageKey = (value) => {
    return slugTag(value).slice(0, PIPELINE_STAGE_KEY_MAX_LEN);
  };

  const getPipelineTag = (stageKey) => {
    const key = normalizePipelineStageKey(stageKey);
    if (!key) {
      return "";
    }
    return `${PIPELINE_STAGE_TAG_PREFIX}${key}`.slice(0, 30);
  };

  const withPipelineStageTag = (tags, stageKey) => {
    const cleanTags = Array.isArray(tags) ? tags : [];
    const baseTags = cleanTags.filter((tag) => {
      const clean = slugTag(tag);
      return Boolean(clean) && !clean.startsWith(PIPELINE_STAGE_TAG_PREFIX);
    });
    const stageTag = getPipelineTag(stageKey);
    if (!stageTag) {
      return mergeTags(baseTags);
    }
    const merged = mergeTags(baseTags, [stageTag]);
    if (merged.includes(stageTag)) {
      return merged;
    }
    return [...merged.slice(0, 7), stageTag];
  };

  const normalizeTemplateMode = (value) => {
    return TEMPLATE_MODES.includes(value) ? value : DEFAULT_TEMPLATE_MODE;
  };

  const normalizeTemplateModeStore = (value) => {
    if (!value || typeof value !== "object") {
      return {};
    }
    const normalized = {};
    Object.entries(value).forEach(([workspaceKey, mode]) => {
      if (!workspaceKey) {
        return;
      }
      normalized[workspaceKey] = normalizeTemplateMode(String(mode || "").trim());
    });
    return normalized;
  };

  const getBaseStageShortcuts = () => {
    return STAGE_SHORTCUTS_BY_TEMPLATE[state.templateMode] || STAGE_SHORTCUTS_BY_TEMPLATE[DEFAULT_TEMPLATE_MODE];
  };

  const getDefaultPipelineKeyFromStage = (stage) => {
    if (stage === "new") return "nuevo";
    if (stage === "contacted") return "contactado";
    if (stage === "won") return "cierre";
    if (stage === "lost") return "perdido";
    return state.templateMode === "general" ? "propuesta" : "visita";
  };

  const prettifyKeyLabel = (key) => {
    return String(key || "")
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const normalizeCustomStages = (value) => {
    if (!Array.isArray(value)) {
      return [];
    }

    const unique = new Map();
    value.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }
      const key = normalizePipelineStageKey(item.key || item.label);
      if (!key || RESERVED_STAGE_KEYS.includes(key)) {
        return;
      }
      if (unique.has(key)) {
        return;
      }

      const stage = LEAD_STAGES.includes(item.stage) ? item.stage : "qualified";
      const label = String(item.label || "").trim().slice(0, 28) || prettifyKeyLabel(key);
      unique.set(key, {
        key,
        label,
        stage,
        note: `Etapa personalizada: ${label}.`,
        isCustom: true,
      });
    });

    return Array.from(unique.values()).slice(0, 12);
  };

  const normalizeCustomStageStore = (value) => {
    if (!value || typeof value !== "object") {
      return {};
    }

    const normalized = {};
    Object.entries(value).forEach(([workspaceKey, stages]) => {
      if (!workspaceKey) {
        return;
      }
      normalized[workspaceKey] = normalizeCustomStages(stages);
    });
    return normalized;
  };

  const getWorkspaceStorageKey = () => {
    return state.workspaceId || "__default__";
  };

  const getPipelineStages = () => {
    return [...getBaseStageShortcuts(), ...state.customStages];
  };

  const getPipelineStageByKey = (stageKey) => {
    const key = normalizePipelineStageKey(stageKey);
    if (!key) {
      return null;
    }
    return getPipelineStages().find((item) => item.key === key) || null;
  };

  const getLeadPipelineStageKey = (lead) => {
    const tags = Array.isArray(lead?.tags) ? lead.tags : [];
    const pipelineTag = tags
      .map((tag) => slugTag(tag))
      .find((tag) => tag.startsWith(PIPELINE_STAGE_TAG_PREFIX));
    if (pipelineTag) {
      const parsedKey = normalizePipelineStageKey(pipelineTag.slice(PIPELINE_STAGE_TAG_PREFIX.length));
      if (parsedKey) {
        return parsedKey;
      }
    }
    return getDefaultPipelineKeyFromStage(lead?.stage);
  };

  const getLeadPipelineLabel = (lead) => {
    const key = getLeadPipelineStageKey(lead);
    const stage = getPipelineStageByKey(key);
    return stage?.label || prettifyKeyLabel(key);
  };

  const applyWorkspaceCustomStages = () => {
    const workspaceKey = getWorkspaceStorageKey();
    state.customStages = normalizeCustomStages(state.customStageStore[workspaceKey]);
  };

  const applyWorkspaceTemplateMode = () => {
    const workspaceKey = getWorkspaceStorageKey();
    state.templateMode = normalizeTemplateMode(state.templateModeStore[workspaceKey]);
  };

  const persistCustomStages = async () => {
    const workspaceKey = getWorkspaceStorageKey();
    state.customStageStore[workspaceKey] = normalizeCustomStages(state.customStages);
    await storageSet({ [CUSTOM_STAGES_KEY]: state.customStageStore });
  };

  const persistTemplateMode = async () => {
    const workspaceKey = getWorkspaceStorageKey();
    state.templateModeStore[workspaceKey] = normalizeTemplateMode(state.templateMode);
    await storageSet({ [TEMPLATE_MODE_KEY]: state.templateModeStore });
  };

  const parseProfileNote = (lead) => {
    const notes = Array.isArray(lead?.notes) ? lead.notes : [];
    for (let i = notes.length - 1; i >= 0; i -= 1) {
      const note = notes[i];
      if (typeof note === "string" && note.startsWith(PROFILE_NOTE_PREFIX)) {
        try {
          const parsed = JSON.parse(note.slice(PROFILE_NOTE_PREFIX.length));
          return parsed && typeof parsed === "object" ? parsed : null;
        } catch (_error) {
          return null;
        }
      }
    }
    return null;
  };

  const getDefaultTutorialProgress = () => {
    return TUTORIAL_STEPS.reduce((acc, step) => {
      acc[step.id] = false;
      return acc;
    }, {});
  };

  const normalizeTutorialProgress = (value) => {
    const base = getDefaultTutorialProgress();
    if (!value || typeof value !== "object") {
      return base;
    }

    TUTORIAL_STEPS.forEach((step) => {
      base[step.id] = Boolean(value[step.id]);
    });
    return base;
  };

  const getTutorialCompletion = () => {
    const done = TUTORIAL_STEPS.filter((step) => state.tutorialProgress[step.id]).length;
    return `${done}/${TUTORIAL_STEPS.length}`;
  };

  const isToday = (iso) => {
    const date = new Date(iso || "");
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const getLocalDayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeFollowupUsage = (value) => {
    const now = Date.now();
    const maxAgeMs = FOLLOWUP_USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (!value || typeof value !== "object") {
      return {};
    }

    const normalized = {};
    Object.entries(value).forEach(([dayKey, rawCount]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
        return;
      }
      const dayTime = new Date(`${dayKey}T00:00:00`).getTime();
      if (Number.isNaN(dayTime) || Math.abs(now - dayTime) > maxAgeMs) {
        return;
      }
      const count = Number.parseInt(String(rawCount), 10);
      if (!Number.isNaN(count) && count > 0) {
        normalized[dayKey] = Math.min(500, count);
      }
    });
    return normalized;
  };

  const readFollowupUsage = async () => {
    const values = await storageGet([FOLLOWUP_USAGE_KEY]);
    return normalizeFollowupUsage(values[FOLLOWUP_USAGE_KEY]);
  };

  const getTodayFollowupCount = async () => {
    const usage = await readFollowupUsage();
    const todayKey = getLocalDayKey();
    return Number(usage[todayKey] || 0);
  };

  const incrementTodayFollowupCount = async () => {
    const usage = await readFollowupUsage();
    const todayKey = getLocalDayKey();
    const nextCount = Number(usage[todayKey] || 0) + 1;
    usage[todayKey] = nextCount;
    await storageSet({ [FOLLOWUP_USAGE_KEY]: usage });
    return nextCount;
  };

  const getLeadHeatScore = (lead) => {
    if (!lead || lead.stage === "won" || lead.stage === "lost") {
      return -1;
    }

    let score = 0;
    if (lead.stage === "qualified") score += 4;
    if (lead.stage === "contacted") score += 2;
    if (lead.stage === "new") score += 1;

    const tags = Array.isArray(lead.tags) ? lead.tags : [];
    if (tags.some((tag) => /urgente|urg_alta/i.test(String(tag)))) {
      score += 3;
    }
    if (tags.some((tag) => /comprador|inversionista/i.test(String(tag)))) {
      score += 2;
    }

    if (isToday(lead.updatedAt || lead.createdAt)) {
      score += 2;
    }
    return score;
  };

  const getComposerEl = () => {
    return (
      document.querySelector("footer [contenteditable='true'][role='textbox']") ||
      document.querySelector("footer div[contenteditable='true']")
    );
  };

  const getConversationHeaderEl = () => {
    return (
      document.querySelector("#main header") ||
      document.querySelector("[data-testid='conversation-header']") ||
      null
    );
  };

  const getConversationFooterEl = () => {
    return (
      document.querySelector("#main footer") ||
      document.querySelector("footer") ||
      null
    );
  };

  const getWhatsAppLoggedIn = () => {
    const hasQrUi =
      Boolean(document.querySelector("[data-testid='qrcode']")) ||
      Boolean(document.querySelector("canvas[aria-label*='QR']")) ||
      Boolean(document.querySelector("div[data-ref] canvas"));

    if (hasQrUi) {
      return false;
    }

    const hasChatUi =
      Boolean(document.querySelector("#pane-side")) ||
      Boolean(document.querySelector("#side")) ||
      Boolean(document.querySelector("#main header")) ||
      Boolean(document.querySelector("[data-testid='chat-list-search']")) ||
      Boolean(document.querySelector("footer [contenteditable='true'][role='textbox']")) ||
      Boolean(document.querySelector("[aria-label='Buscar un chat o iniciar uno nuevo']")) ||
      Boolean(document.querySelector("[aria-label='Search or start new chat']")) ||
      Boolean(document.querySelector("[data-icon='new-chat-outline']")) ||
      Boolean(document.querySelector("span[title='WhatsApp']"));

    if (hasChatUi) {
      return true;
    }

    return false;
  };

  const getCurrentChat = () => {
    const header = document.querySelector("#main header");
    if (!header) {
      return null;
    }

    const titleEl =
      header.querySelector("[data-testid='conversation-info-header-chat-title']") ||
      header.querySelector("span[title]") ||
      header.querySelector("h2");
    const title = String(titleEl?.textContent || titleEl?.getAttribute?.("title") || "").trim();
    if (!title) {
      return null;
    }

    return {
      name: title,
      phoneGuess: extractPhoneFromText(title),
      key: `${title}::${extractPhoneFromText(title)}`,
    };
  };

  const getProfileFromForm = () => {
    return {
      op: state.nodes.operationSelect?.value || "",
      tp: state.nodes.propertyTypeSelect?.value || "",
      dst: String(state.nodes.districtInput?.value || "").trim().slice(0, 40),
      bmin: String(state.nodes.budgetMinInput?.value || "").trim(),
      bmax: String(state.nodes.budgetMaxInput?.value || "").trim(),
      dorm: state.nodes.bedroomsSelect?.value || "",
      tm: state.nodes.timelineSelect?.value || "",
      src: state.nodes.sourceSelect?.value || "",
      urg: state.nodes.urgencySelect?.value || "",
    };
  };

  const hasProfileData = (profile) => {
    return Object.values(profile).some((value) => Boolean(String(value || "").trim()));
  };

  const buildProfileDerivedTags = (profile) => {
    const tags = [];
    if (profile.op) tags.push(`op_${profile.op}`);
    if (profile.tp) tags.push(`tipo_${profile.tp}`);
    if (profile.dst) tags.push(`zona_${profile.dst}`);
    if (profile.src) tags.push(`fuente_${profile.src}`);
    if (profile.urg) tags.push(`urg_${profile.urg}`);
    if (profile.tm) tags.push(`tiempo_${profile.tm}`);
    if (profile.dorm) tags.push(`dorm_${profile.dorm}`);
    if (profile.bmax) tags.push(`pres_${profile.bmax}`);
    return tags.map((tag) => slugTag(tag)).filter(Boolean).slice(0, 6);
  };

  const buildProfileNote = (profile) => {
    return `${PROFILE_NOTE_PREFIX}${JSON.stringify({
      ...profile,
      at: new Date().toISOString(),
    })}`.slice(0, 500);
  };

  const fillProfileForm = (profile) => {
    const safe = profile || {};
    if (state.nodes.operationSelect) state.nodes.operationSelect.value = safe.op || "";
    if (state.nodes.propertyTypeSelect) state.nodes.propertyTypeSelect.value = safe.tp || "";
    if (state.nodes.districtInput) state.nodes.districtInput.value = safe.dst || "";
    if (state.nodes.budgetMinInput) state.nodes.budgetMinInput.value = safe.bmin || "";
    if (state.nodes.budgetMaxInput) state.nodes.budgetMaxInput.value = safe.bmax || "";
    if (state.nodes.bedroomsSelect) state.nodes.bedroomsSelect.value = safe.dorm || "";
    if (state.nodes.timelineSelect) state.nodes.timelineSelect.value = safe.tm || "";
    if (state.nodes.sourceSelect) state.nodes.sourceSelect.value = safe.src || "";
    if (state.nodes.urgencySelect) state.nodes.urgencySelect.value = safe.urg || "";
  };

  const updatePipelineMeta = () => {
    if (!state.nodes.pipelineMetaEl) {
      return;
    }
    const counters = LEAD_STAGES.map((stage) => {
      const count = state.leads.filter((lead) => lead.stage === stage).length;
      return `${stage}:${count}`;
    });
    state.nodes.pipelineMetaEl.textContent = `Pipeline: ${counters.join(" | ")}`;
  };

  const renderComplianceMeta = () => {
    if (!state.nodes.complianceMetaEl) {
      return;
    }

    const trustCenter = state.trustCenter;
    if (!trustCenter) {
      state.nodes.complianceMetaEl.textContent = "Compliant Mode ON | riesgo: low (0).";
      return;
    }

    const risk = trustCenter.antiSpamRisk || { level: "low", score: 0, reasons: [] };
    const coverage = trustCenter.optInCoverage || { percentage: 0 };
    const quota = trustCenter.campaignDailyQuota || { remaining: 0, maxPerDay: 0 };
    const base = `Compliant Mode ON | riesgo: ${risk.level} (${risk.score}) | opt-in: ${coverage.percentage}% | cuota: ${quota.remaining}/${quota.maxPerDay}`;
    const reason = Array.isArray(risk.reasons) && risk.reasons.length ? ` | alerta: ${risk.reasons[0]}` : "";
    state.nodes.complianceMetaEl.textContent = `${base}${reason}`.slice(0, 220);
  };

  const getOwnerLabel = (ownerUserId) => {
    if (!ownerUserId) {
      return "Sin asignar";
    }
    const user = state.workspaceUsers.find((item) => item.id === ownerUserId);
    return user?.name || ownerUserId;
  };

  const isLeadOverdue = (lead) => {
    return Boolean(lead?.sla?.firstResponseBreached || lead?.sla?.followupBreached);
  };

  const renderMessagingModeMeta = () => {
    const modeEl = state.nodes.messagingModeMetaEl;
    if (!modeEl) {
      return;
    }

    const mode = state.messagingMode;
    if (!mode) {
      modeEl.textContent = "Modo: crm_manual | proveedor: dry_run.";
      return;
    }

    const resolvedMode = String(mode.resolvedMode || "crm_manual");
    const provider = String(mode.provider || "dry_run");
    const reason = String(mode.reason || "").trim();
    modeEl.textContent = reason
      ? `Modo: ${resolvedMode} | proveedor: ${provider} | ${reason}`
      : `Modo: ${resolvedMode} | proveedor: ${provider}`;
  };

  const renderOwnerSelect = () => {
    const selectEl = state.nodes.ownerSelect;
    if (!selectEl) {
      return;
    }

    const previousValue = String(selectEl.value || "");
    selectEl.innerHTML = "";

    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Sin asignar";
    selectEl.appendChild(unassigned);

    state.workspaceUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.name} (${user.role})`;
      selectEl.appendChild(option);
    });

    const canRestore = Array.from(selectEl.options).some((option) => option.value === previousValue);
    if (canRestore) {
      selectEl.value = previousValue;
    }
  };

  const renderTeamInbox = () => {
    const filtersEl = state.nodes.inboxFiltersEl;
    const countsEl = state.nodes.inboxCountsEl;
    const listEl = state.nodes.inboxListEl;
    if (!filtersEl || !countsEl || !listEl) {
      return;
    }

    const activeView = LEAD_INBOX_VIEWS.includes(state.leadInboxView) ? state.leadInboxView : "my";
    filtersEl.innerHTML = "";
    LEAD_INBOX_VIEWS.forEach((view) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-chip wacrm-filter-chip";
      button.dataset.inboxView = view;
      button.textContent = LEAD_INBOX_LABELS[view] || view;
      button.classList.toggle("active", view === activeView);
      filtersEl.appendChild(button);
    });

    const inbox = state.leadInbox;
    if (!inbox) {
      countsEl.textContent = "all:0 | my:0 | unassigned:0 | overdue:0";
      listEl.innerHTML = "<p class=\"wacrm-meta\">Sin datos de bandeja.</p>";
      return;
    }

    const counts = inbox.counts || { all: 0, my: 0, unassigned: 0, overdue: 0 };
    countsEl.textContent = `all:${counts.all || 0} | my:${counts.my || 0} | unassigned:${counts.unassigned || 0} | overdue:${counts.overdue || 0}`;
    listEl.innerHTML = "";

    const leads = Array.isArray(inbox.leads) ? inbox.leads : [];
    if (!leads.length) {
      listEl.innerHTML = "<p class=\"wacrm-meta\">Sin leads en esta bandeja.</p>";
      return;
    }

    leads.slice(0, 30).forEach((lead) => {
      const row = document.createElement("div");
      row.className = "wacrm-stage-row";

      const info = document.createElement("button");
      info.type = "button";
      info.className = "wacrm-stage-lead";
      const healthTemperature = String(lead.healthTemperature || "warm");
      const healthScore = Number.isFinite(Number(lead.healthScore)) ? Number(lead.healthScore) : 50;
      const overdueFlag = isLeadOverdue(lead) ? " | SLA overdue" : "";
      info.innerHTML = `
        <span class="wacrm-hot-name">${lead.name || "Sin nombre"}</span>
        <span class="wacrm-hot-meta">${lead.stage || "new"} | owner: ${getOwnerLabel(lead.ownerUserId)} | health:${healthTemperature} (${healthScore})${overdueFlag}</span>
      `;
      info.addEventListener("click", () => {
        fillLeadIntoForm(lead);
        openSectionFromMenu("lead");
      });

      const actions = document.createElement("div");
      actions.className = "wacrm-stage-actions";

      const ownerSelect = document.createElement("select");
      ownerSelect.className = "wacrm-select wacrm-inline-select";
      const ownerEmpty = document.createElement("option");
      ownerEmpty.value = "";
      ownerEmpty.textContent = "Sin asignar";
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
      assignBtn.className = "wacrm-btn ghost wacrm-btn-xs";
      assignBtn.textContent = "Asignar";
      assignBtn.addEventListener("click", () => {
        void withSyncGuard(async () => {
          await apiRequest(`/leads/${lead.id}/assign`, {
            method: "PATCH",
            body: JSON.stringify({ ownerUserId: ownerSelect.value || null }),
          });
          setStatus("Asignacion de lead actualizada.");
          await fetchWorkspaceData();
        });
      });

      actions.appendChild(ownerSelect);
      actions.appendChild(assignBtn);

      LEAD_HEALTH_EVENT_SHORTCUTS.forEach((config) => {
        const eventBtn = document.createElement("button");
        eventBtn.type = "button";
        eventBtn.className = "wacrm-btn ghost wacrm-btn-xs";
        eventBtn.textContent = config.label;
        eventBtn.addEventListener("click", () => {
          void withSyncGuard(async () => {
            await apiRequest(`/leads/${lead.id}/health-events`, {
              method: "POST",
              body: JSON.stringify({ event: config.event }),
            });
            setStatus(`Health event aplicado: ${config.label}.`);
            await fetchWorkspaceData();
          });
        });
        actions.appendChild(eventBtn);
      });

      row.appendChild(info);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
  };

  const renderProductivityPanel = () => {
    const metaEl = state.nodes.productivityMetaEl;
    const listEl = state.nodes.productivityListEl;
    if (!metaEl || !listEl) {
      return;
    }

    const productivity = state.productivity;
    if (!productivity) {
      metaEl.textContent = "Sin datos de productividad.";
      listEl.innerHTML = "<p class=\"wacrm-meta\">Sin datos.</p>";
      return;
    }

    const totals = productivity.totals || {};
    metaEl.textContent = `Leads:${totals.leads || 0} | asignados:${totals.assignedLeads || 0} | sin asignar:${totals.unassignedLeads || 0} | vencidos:${totals.overdueLeads || 0}`;
    listEl.innerHTML = "";

    const stageFunnel = Array.isArray(productivity.stageFunnel) ? productivity.stageFunnel : [];
    const topAgents = Array.isArray(productivity.agents) ? productivity.agents.slice(0, 5) : [];
    const lines = [
      ...stageFunnel.map((item) => `${item.stage}: ${item.count} (${item.percentage}%)`),
      ...topAgents.map((item) => `${item.name} | assigned:${item.assignedLeads} | won:${item.wonLeads} | overdue:${item.overdueLeads}`),
    ];

    if (!lines.length) {
      listEl.innerHTML = "<p class=\"wacrm-meta\">Sin datos.</p>";
      return;
    }

    lines.forEach((line) => {
      const row = document.createElement("p");
      row.className = "wacrm-meta";
      row.textContent = line;
      listEl.appendChild(row);
    });
  };

  const appendTagToInput = (tag) => {
    const current = parseCsvTags(state.nodes.tagsInput?.value || "");
    const merged = mergeTags(current, [tag]);
    if (state.nodes.tagsInput) {
      state.nodes.tagsInput.value = merged.join(", ");
    }
  };

  const markTutorialStep = async (stepId) => {
    if (!stepId || !Object.prototype.hasOwnProperty.call(state.tutorialProgress, stepId)) {
      return;
    }
    if (state.tutorialProgress[stepId]) {
      return;
    }

    state.tutorialProgress[stepId] = true;
    if (state.nodes.tutorialSummaryEl) {
      state.nodes.tutorialSummaryEl.textContent = `Progreso tutorial: ${getTutorialCompletion()}`;
    }
    await storageSet({ [TUTORIAL_PROGRESS_KEY]: state.tutorialProgress });
    renderTutorial();
  };

  const resetTutorial = async () => {
    state.tutorialProgress = getDefaultTutorialProgress();
    if (state.nodes.tutorialSummaryEl) {
      state.nodes.tutorialSummaryEl.textContent = `Progreso tutorial: ${getTutorialCompletion()}`;
    }
    await storageSet({ [TUTORIAL_PROGRESS_KEY]: state.tutorialProgress });
    renderTutorial();
  };

  const fillLeadIntoForm = (lead) => {
    if (!lead) {
      return;
    }

    state.currentLead = lead;
    if (state.nodes.nameInput) state.nodes.nameInput.value = lead.name || "";
    if (state.nodes.phoneInput) state.nodes.phoneInput.value = lead.phoneE164 || "";
    if (state.nodes.stageSelect) state.nodes.stageSelect.value = lead.stage || "new";
    if (state.nodes.consentSelect) state.nodes.consentSelect.value = lead.consentStatus || "pending";
    if (state.nodes.ownerSelect) state.nodes.ownerSelect.value = lead.ownerUserId || "";
    if (state.nodes.tagsInput) state.nodes.tagsInput.value = (lead.tags || []).join(", ");
    if (state.templateMode === "real_estate") {
      fillProfileForm(parseProfileNote(lead));
    } else {
      fillProfileForm(null);
    }
    updateLeadMeta();
    setStatus(`Lead cargado: ${lead.name}.`);
  };

  const renderHotLeads = () => {
    const listEl = state.nodes.hotLeadsEl;
    const metaEl = state.nodes.hotLeadsMetaEl;
    if (!listEl || !metaEl) {
      return;
    }

    listEl.innerHTML = "";
    const hotLeads = state.leads
      .filter((lead) => isToday(lead.updatedAt || lead.createdAt))
      .map((lead) => ({ lead, score: getLeadHeatScore(lead) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    if (hotLeads.length === 0) {
      metaEl.textContent = "Sin leads calientes hoy.";
      return;
    }

    metaEl.textContent = `${hotLeads.length} lead(s) priorizados hoy.`;
    hotLeads.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-hot-item";
      button.innerHTML = `
        <span class="wacrm-hot-name">${item.lead.name}</span>
        <span class="wacrm-hot-meta">${getLeadPipelineLabel(item.lead)} | ${item.lead.phoneE164 || "-"}</span>
      `;
      button.addEventListener("click", () => fillLeadIntoForm(item.lead));
      listEl.appendChild(button);
    });
  };

  const openLeadChat = (lead) => {
    const phoneDigits = String(lead?.phoneE164 || "").replace(/\D/g, "");
    if (!phoneDigits) {
      setStatus("El lead no tiene telefono valido para abrir chat.", true);
      return;
    }
    window.location.href = `https://web.whatsapp.com/send?phone=${phoneDigits}`;
  };

  const getFilteredLeads = () => {
    const leads = Array.isArray(state.leads) ? state.leads : [];
    const filtered = state.stageFilterKey === "all"
      ? leads
      : leads.filter((lead) => getLeadPipelineStageKey(lead) === state.stageFilterKey);
    return filtered
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  };

  const renderStageLeads = () => {
    const listEl = state.nodes.stageLeadsEl;
    const metaEl = state.nodes.stageFilterMetaEl;
    if (!listEl || !metaEl) {
      renderCrmBoard();
      return;
    }
    const leads = getFilteredLeads();
    const selectedStage = getPipelineStageByKey(state.stageFilterKey);
    const selectedLabel = state.stageFilterKey === "all" ? "todas" : (selectedStage?.label || prettifyKeyLabel(state.stageFilterKey));
    metaEl.textContent = `${leads.length} contacto(s) en ${selectedLabel}.`;
    listEl.innerHTML = "";

    if (leads.length === 0) {
      const empty = document.createElement("p");
      empty.className = "wacrm-meta";
      empty.textContent = "No hay contactos para esa etapa.";
      listEl.appendChild(empty);
      renderCrmBoard();
      return;
    }

    leads.slice(0, 40).forEach((lead) => {
      const row = document.createElement("div");
      row.className = "wacrm-stage-row";

      const info = document.createElement("button");
      info.type = "button";
      info.className = "wacrm-stage-lead";
      info.innerHTML = `
        <span class="wacrm-hot-name">${lead.name || "Sin nombre"}</span>
        <span class="wacrm-hot-meta">${getLeadPipelineLabel(lead)} | ${lead.phoneE164 || "-"}</span>
      `;
      info.addEventListener("click", () => {
        fillLeadIntoForm(lead);
        openSectionFromMenu("lead");
      });

      const actions = document.createElement("div");
      actions.className = "wacrm-stage-actions";

      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "wacrm-btn ghost wacrm-btn-xs";
      useBtn.textContent = "Usar";
      useBtn.addEventListener("click", () => fillLeadIntoForm(lead));

      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "wacrm-btn ghost wacrm-btn-xs";
      openBtn.textContent = "Abrir chat";
      openBtn.addEventListener("click", () => openLeadChat(lead));

      actions.appendChild(useBtn);
      actions.appendChild(openBtn);
      row.appendChild(info);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
    renderCrmBoard();
  };

  const renderCrmBoard = () => {
    const boardEl = state.nodes.crmBoardEl;
    if (!boardEl) {
      return;
    }

    const stages = getPipelineStages();
    const leads = Array.isArray(state.leads) ? state.leads : [];
    boardEl.innerHTML = "";

    if (!stages.length) {
      const empty = document.createElement("p");
      empty.className = "wacrm-meta";
      empty.textContent = "No hay etapas disponibles para el tablero.";
      boardEl.appendChild(empty);
      return;
    }

    const sortedLeads = leads
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());

    stages.forEach((stage) => {
      const column = document.createElement("section");
      column.className = "wacrm-kanban-col";
      column.dataset.stageKey = stage.key;

      const stageLeads = sortedLeads.filter((lead) => getLeadPipelineStageKey(lead) === stage.key);
      const header = document.createElement("div");
      header.className = "wacrm-kanban-col-head";
      header.innerHTML = `
        <strong>${stage.label}</strong>
        <span>${stageLeads.length}</span>
      `;

      const list = document.createElement("div");
      list.className = "wacrm-kanban-list";
      list.dataset.stageKey = stage.key;

      list.addEventListener("dragover", (event) => {
        event.preventDefault();
        list.classList.add("drop-target");
      });
      list.addEventListener("dragleave", () => {
        list.classList.remove("drop-target");
      });
      list.addEventListener("drop", (event) => {
        event.preventDefault();
        list.classList.remove("drop-target");
        const leadId = event.dataTransfer?.getData("text/plain") || "";
        if (!leadId) {
          return;
        }
        const lead = sortedLeads.find((item) => item.id === leadId);
        if (!lead) {
          return;
        }
        if (getLeadPipelineStageKey(lead) === stage.key) {
          return;
        }
        void withSyncGuard(async () => {
          await syncLeadPipelineStage(lead, stage.stage, stage.key, `Movido en tablero CRM a ${stage.label}.`);
          setStatus(`Lead movido a ${stage.label}.`);
          await fetchWorkspaceData();
        });
      });

      if (!stageLeads.length) {
        const empty = document.createElement("p");
        empty.className = "wacrm-kanban-empty";
        empty.textContent = "Sin contactos.";
        list.appendChild(empty);
      } else {
        stageLeads.forEach((lead) => {
          const card = document.createElement("article");
          card.className = "wacrm-kanban-card";
          card.draggable = true;
          card.dataset.leadId = lead.id || "";
          card.innerHTML = `
            <button type="button" class="wacrm-kanban-title">${lead.name || "Sin nombre"}</button>
            <p class="wacrm-kanban-meta">${lead.phoneE164 || "-"}</p>
            <p class="wacrm-kanban-meta">${(Array.isArray(lead.tags) ? lead.tags.slice(0, 3) : []).join(", ") || "Sin tags"}</p>
            <div class="wacrm-stage-actions">
              <button type="button" class="wacrm-btn ghost wacrm-btn-xs wacrm-kanban-use">Usar</button>
              <button type="button" class="wacrm-btn ghost wacrm-btn-xs wacrm-kanban-open">Abrir</button>
            </div>
          `;
          card.addEventListener("dragstart", (event) => {
            event.dataTransfer?.setData("text/plain", lead.id || "");
            if (event.dataTransfer) {
              event.dataTransfer.effectAllowed = "move";
            }
            card.classList.add("dragging");
          });
          card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
          });
          card.querySelector(".wacrm-kanban-title")?.addEventListener("click", () => {
            fillLeadIntoForm(lead);
            openSectionFromMenu("lead");
          });
          card.querySelector(".wacrm-kanban-use")?.addEventListener("click", () => fillLeadIntoForm(lead));
          card.querySelector(".wacrm-kanban-open")?.addEventListener("click", () => openLeadChat(lead));
          list.appendChild(card);
        });
      }

      column.appendChild(header);
      column.appendChild(list);
      boardEl.appendChild(column);
    });
  };

  const renderStageFilters = () => {
    const filtersEl = state.nodes.stageFiltersEl;
    if (!filtersEl) {
      return;
    }
    if (state.stageFilterKey !== "all" && !getPipelineStageByKey(state.stageFilterKey)) {
      state.stageFilterKey = "all";
    }
    filtersEl.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "wacrm-chip wacrm-filter-chip";
    allBtn.textContent = "Todos";
    allBtn.classList.toggle("active", state.stageFilterKey === "all");
    allBtn.addEventListener("click", () => {
      state.stageFilterKey = "all";
      renderStageFilters();
      renderStageLeads();
    });
    filtersEl.appendChild(allBtn);

    getPipelineStages().forEach((stage) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-chip wacrm-filter-chip";
      button.textContent = stage.label;
      button.classList.toggle("active", stage.key === state.stageFilterKey);
      button.addEventListener("click", () => {
        state.stageFilterKey = stage.key;
        renderStageFilters();
        renderStageLeads();
      });
      filtersEl.appendChild(button);
    });
  };

  const renderCustomStageMeta = () => {
    const metaEl = state.nodes.customStageMetaEl;
    if (!metaEl) {
      return;
    }
    if (!state.customStages.length) {
      metaEl.textContent = "Sin etapas personalizadas.";
      return;
    }
    metaEl.textContent = `Personalizadas: ${state.customStages.map((item) => item.label).join(", ")}.`;
  };

  const addCustomStage = async () => {
    const inputEl = state.nodes.customStageInput;
    if (!inputEl) {
      return;
    }
    const labelRaw = String(inputEl.value || "").trim();
    if (labelRaw.length < 2) {
      setStatus("Escribe un nombre valido para la nueva etapa.", true);
      return;
    }

    const key = normalizePipelineStageKey(labelRaw);
    if (!key) {
      setStatus("El nombre de etapa no es valido.", true);
      return;
    }
    if (getPipelineStageByKey(key)) {
      setStatus("Esa etapa ya existe.", true);
      return;
    }

    state.customStages = normalizeCustomStages([
      ...state.customStages,
      {
        key,
        label: labelRaw,
        stage: "qualified",
      },
    ]);
    inputEl.value = "";
    await persistCustomStages();
    renderCustomStageMeta();
    renderStageShortcuts();
    renderStageFilters();
    renderStageLeads();
    setStatus(`Etapa personalizada creada: ${labelRaw}.`);
  };

  const renderTutorial = () => {
    const listEl = state.nodes.tutorialListEl;
    if (!listEl) {
      return;
    }

    listEl.innerHTML = "";
    if (state.nodes.tutorialSummaryEl) {
      state.nodes.tutorialSummaryEl.textContent = `Progreso tutorial: ${getTutorialCompletion()}`;
    }

    TUTORIAL_STEPS.forEach((step) => {
      const row = document.createElement("label");
      row.className = "wacrm-check-row";
      row.setAttribute("for", `wacrm-step-${step.id}`);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `wacrm-step-${step.id}`;
      checkbox.checked = Boolean(state.tutorialProgress[step.id]);
      checkbox.addEventListener("change", () => {
        state.tutorialProgress[step.id] = checkbox.checked;
        if (state.nodes.tutorialSummaryEl) {
          state.nodes.tutorialSummaryEl.textContent = `Progreso tutorial: ${getTutorialCompletion()}`;
        }
        void storageSet({ [TUTORIAL_PROGRESS_KEY]: state.tutorialProgress });
      });

      const content = document.createElement("span");
      content.className = "wacrm-check-content";
      content.innerHTML = `
        <strong>${step.label}</strong>
        <small>${step.hint}</small>
      `;

      row.appendChild(checkbox);
      row.appendChild(content);
      listEl.appendChild(row);
    });
  };

  const setStatus = (text, isError = false) => {
    if (!state.nodes.statusEl) {
      return;
    }
    state.nodes.statusEl.textContent = text;
    state.nodes.statusEl.classList.toggle("error", isError);
  };

  const isCrmSessionReady = () => {
    return Boolean(getWhatsAppLoggedIn() && state.token && state.canUseCrm);
  };

  const setQuickBarButtonsState = (container, disabled) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    container.querySelectorAll("button[data-wacrm-action]").forEach((button) => {
      button.disabled = disabled;
    });
  };

  const getQuickLeadLabel = () => {
    if (state.currentLead) {
      const owner = getOwnerLabel(state.currentLead.ownerUserId);
      return `${state.currentLead.name || "Lead"} | ${getLeadPipelineLabel(state.currentLead)} | owner: ${owner}`;
    }
    if (state.currentChat?.name) {
      return `${state.currentChat.name} | sin lead guardado`;
    }
    return "Sin conversacion activa";
  };

  const getQuickRiskLabel = () => {
    const level = String(state.trustCenter?.antiSpamRisk?.level || "low");
    const score = Number(state.trustCenter?.antiSpamRisk?.score || 0);
    return `Riesgo: ${level} (${score})`;
  };

  const getQuickModeLabel = () => {
    const mode = String(state.messagingMode?.resolvedMode || "crm_manual");
    const provider = String(state.messagingMode?.provider || "dry_run");
    return `Modo: ${mode} | ${provider}`;
  };

  const runCopilotReplyAndInsert = async () => {
    await runCopilot("reply");
    const text = String(state.nodes.copilotOutput?.value || "").trim();
    if (!text) {
      setStatus("No se genero sugerencia de Copiloto.", true);
      return;
    }
    const inserted = insertMessageIntoComposer(text);
    if (!inserted) {
      return;
    }
    setStatus("Respuesta sugerida insertada. Envio manual.");
  };

  const runNativeQuickAction = (action) => {
    const normalizedAction = String(action || "").trim();
    if (!normalizedAction) {
      return;
    }

    if (normalizedAction === "open-crm") {
      openSectionFromMenu("crm");
      return;
    }

    if (!getWhatsAppLoggedIn()) {
      setStatus("Inicia sesion en WhatsApp Web para usar atajos CRM.", true);
      return;
    }
    if (!state.token) {
      setStatus("Inicia sesion en la extension para usar atajos CRM.", true);
      return;
    }
    if (!state.canUseCrm) {
      setStatus("Suscripcion inactiva. Los atajos CRM estan bloqueados.", true);
      return;
    }
    if (!state.currentChat) {
      setStatus("Abre una conversacion para usar atajos CRM.", true);
      return;
    }

    if (normalizedAction === "save-lead") {
      openSectionFromMenu("lead");
      void withSyncGuard(saveLead);
      return;
    }
    if (normalizedAction === "insert-template") {
      openSectionFromMenu("actions");
      insertTemplateIntoComposer();
      return;
    }
    if (normalizedAction === "insert-followup") {
      openSectionFromMenu("actions");
      void withSyncGuard(insertManualFollowup);
      return;
    }
    if (normalizedAction === "quick-followup") {
      openSectionFromMenu("actions");
      if (state.nodes.followupHoursInput) {
        state.nodes.followupHoursInput.value = "24";
      }
      void withSyncGuard(createQuickFollowup);
      return;
    }
    if (normalizedAction === "copilot-reply") {
      openSectionFromMenu("actions");
      void withSyncGuard(runCopilotReplyAndInsert);
      return;
    }
    if (normalizedAction === "copilot-summary") {
      openSectionFromMenu("actions");
      void withSyncGuard(async () => {
        await runCopilot("summary");
      });
    }
  };

  const bindQuickBarActions = (container) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    if (container.dataset.boundActions === "1") {
      return;
    }
    container.dataset.boundActions = "1";
    container.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest("button[data-wacrm-action]");
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }
      runNativeQuickAction(button.dataset.wacrmAction);
    });
  };

  const ensureTopQuickBar = () => {
    const header = getConversationHeaderEl();
    if (!(header instanceof HTMLElement)) {
      state.nodes.waTopBar?.remove();
      state.nodes.waTopBar = null;
      return null;
    }

    let bar = state.nodes.waTopBar;
    if (!(bar instanceof HTMLElement) || !document.body.contains(bar)) {
      bar = document.createElement("section");
      bar.id = WA_TOP_BAR_ID;
      bar.className = "wacrm-wa-bar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "Atajos CRM en cabecera");
      bar.innerHTML = `
        <div class="wacrm-wa-chip-row">
          <span class="wacrm-wa-pill" data-wacrm-lead>Sin conversacion activa</span>
          <span class="wacrm-wa-pill subtle" data-wacrm-risk>Riesgo: low (0)</span>
          <span class="wacrm-wa-pill subtle" data-wacrm-mode>Modo: crm_manual | dry_run</span>
        </div>
        <div class="wacrm-wa-actions">
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="save-lead">Guardar</button>
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="copilot-summary">Resumen</button>
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="open-crm">CRM</button>
        </div>
      `;
      bindQuickBarActions(bar);
      state.nodes.waTopBar = bar;
    }

    header.insertAdjacentElement("afterend", bar);
    return bar;
  };

  const ensureComposerQuickBar = () => {
    const footer = getConversationFooterEl();
    if (!(footer instanceof HTMLElement) || !(footer.parentElement instanceof HTMLElement)) {
      state.nodes.waComposerBar?.remove();
      state.nodes.waComposerBar = null;
      return null;
    }

    let bar = state.nodes.waComposerBar;
    if (!(bar instanceof HTMLElement) || !document.body.contains(bar)) {
      bar = document.createElement("section");
      bar.id = WA_COMPOSER_BAR_ID;
      bar.className = "wacrm-wa-bar wacrm-wa-bar-composer";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "Atajos CRM en caja de mensaje");
      bar.innerHTML = `
        <div class="wacrm-wa-actions">
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="insert-template">Plantilla</button>
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="copilot-reply">Sugerir + insertar</button>
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="insert-followup">Seguimiento</button>
          <button type="button" class="wacrm-wa-btn" data-wacrm-action="quick-followup">Recordatorio +24h</button>
        </div>
        <p class="wacrm-wa-hint" data-wacrm-hint>Inserta texto y envia manualmente.</p>
      `;
      bindQuickBarActions(bar);
      state.nodes.waComposerBar = bar;
    }

    footer.insertAdjacentElement("beforebegin", bar);
    return bar;
  };

  const renderNativeActionBars = () => {
    const topBar = ensureTopQuickBar();
    const composerBar = ensureComposerQuickBar();
    const hasChat = Boolean(state.currentChat);
    const canUseActions = isCrmSessionReady() && hasChat;
    const disabled = !canUseActions || state.syncing;

    if (topBar) {
      topBar.classList.toggle("is-disabled", !canUseActions);
      const leadEl = topBar.querySelector("[data-wacrm-lead]");
      if (leadEl) {
        const text = getQuickLeadLabel();
        leadEl.textContent = text;
        leadEl.setAttribute("title", text);
      }
      const riskEl = topBar.querySelector("[data-wacrm-risk]");
      if (riskEl) {
        riskEl.textContent = getQuickRiskLabel();
      }
      const modeEl = topBar.querySelector("[data-wacrm-mode]");
      if (modeEl) {
        modeEl.textContent = getQuickModeLabel();
      }
      setQuickBarButtonsState(topBar, disabled);
    }

    if (composerBar) {
      composerBar.classList.toggle("is-disabled", !canUseActions);
      const hintEl = composerBar.querySelector("[data-wacrm-hint]");
      if (hintEl) {
        if (!getWhatsAppLoggedIn()) {
          hintEl.textContent = "Inicia sesion en WhatsApp Web para habilitar atajos.";
        } else if (!state.token) {
          hintEl.textContent = "Inicia sesion en la extension para habilitar atajos.";
        } else if (!state.canUseCrm) {
          hintEl.textContent = "Suscripcion inactiva. Atajos CRM bloqueados.";
        } else if (!hasChat) {
          hintEl.textContent = "Abre una conversacion para usar atajos.";
        } else if (state.syncing) {
          hintEl.textContent = "Sincronizando datos CRM...";
        } else {
          hintEl.textContent = "Inserta texto y confirma envio manual en WhatsApp.";
        }
      }
      setQuickBarButtonsState(composerBar, disabled);
    }
  };

  const setActiveSection = (section) => {
    const allowed = new Set(["overview", "lead", "actions", "tutorial", "crm", "all"]);
    const nextSection = allowed.has(section) ? section : "overview";
    state.activeSection = nextSection;
    state.nodes.root?.classList.toggle("wacrm-crm-mode", nextSection === "crm");

    const blocks = state.nodes.toolsEl?.querySelectorAll?.("[data-section]") || [];
    blocks.forEach((block) => {
      const raw = String(block.getAttribute("data-section") || "");
      const sections = raw.split(",").map((item) => item.trim()).filter(Boolean);
      const visible = nextSection === "all" || sections.includes(nextSection);
      block.classList.toggle("wacrm-hidden-block", !visible);
    });

    (state.nodes.tabButtons || []).forEach((button) => {
      button.classList.toggle("active", button.dataset.section === nextSection);
    });
    (state.nodes.dockButtons || []).forEach((button) => {
      button.classList.toggle("active", button.dataset.section === nextSection);
    });
  };

  const openSectionFromMenu = (section) => {
    setActiveSection(section);
    if (state.collapsed) {
      state.collapsed = false;
      state.nodes.bodyEl?.classList.remove("wacrm-hidden");
      const toggle = state.nodes.root?.querySelector("#wacrm-toggle");
      if (toggle) {
        toggle.textContent = "Minimizar";
      }
    }
    setModeState();
    if (!state.token) {
      setStatus("Inicia sesion en la extension para habilitar este modulo.", true);
    } else if (!state.canUseCrm) {
      setStatus("Suscripcion inactiva. Solicita activacion al administrador.", true);
    } else {
      setStatus(`Modulo activo: ${section}.`);
    }
  };

  const runDockAction = (action) => {
    if (action === "overview") {
      openSectionFromMenu("overview");
      state.nodes.hotLeadsEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    if (action === "tutorial") {
      openSectionFromMenu("tutorial");
      return;
    }
    if (action === "all") {
      openSectionFromMenu("all");
      return;
    }
    if (action === "crm") {
      openSectionFromMenu("crm");
      return;
    }
    if (action === "save-lead") {
      openSectionFromMenu("lead");
      if (getWhatsAppLoggedIn() && state.token && state.canUseCrm) {
        void withSyncGuard(saveLead);
      }
      return;
    }
    if (action === "insert-template") {
      openSectionFromMenu("actions");
      if (getWhatsAppLoggedIn() && state.token && state.canUseCrm) {
        insertTemplateIntoComposer();
      }
      return;
    }
    if (action === "quick-followup") {
      openSectionFromMenu("actions");
      if (getWhatsAppLoggedIn() && state.token && state.canUseCrm) {
        void withSyncGuard(createQuickFollowup);
      }
    }
  };

  const setModeState = () => {
    const gateEl = state.nodes.gateEl;
    const toolsEl = state.nodes.toolsEl;
    if (!gateEl || !toolsEl) {
      renderNativeActionBars();
      return;
    }

    if (!getWhatsAppLoggedIn()) {
      gateEl.textContent = "Inicia sesion en WhatsApp Web para habilitar WhatsWidget.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      renderNativeActionBars();
      return;
    }

    if (!state.token) {
      gateEl.textContent = "Inicia sesion en la extension para activar el CRM.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      renderNativeActionBars();
      return;
    }

    if (!state.canUseCrm) {
      gateEl.textContent = "Tu suscripcion CRM no esta activa. Solicita activacion al administrador.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      renderNativeActionBars();
      return;
    }

    gateEl.classList.add("wacrm-hidden");
    toolsEl.classList.remove("wacrm-hidden");
    renderNativeActionBars();
  };

  const updateLeadMeta = () => {
    if (!state.nodes.leadMetaEl) {
      return;
    }

    if (!state.currentLead) {
      state.nodes.leadMetaEl.textContent = "Sin lead asociado al chat actual.";
      if (state.nodes.ownerSelect) {
        state.nodes.ownerSelect.value = "";
      }
      state.nodes.noteBtn.disabled = true;
      state.nodes.stageBtn.disabled = true;
      state.nodes.reminderBtn.disabled = true;
      if (state.nodes.insertFollowupBtn) {
        state.nodes.insertFollowupBtn.disabled = true;
      }
      if (state.nodes.quickFollowupBtn) {
        state.nodes.quickFollowupBtn.disabled = true;
      }
      void refreshFollowupMeta();
      return;
    }

    const tagsText = Array.isArray(state.currentLead.tags) && state.currentLead.tags.length > 0
      ? state.currentLead.tags.join(", ")
      : "-";
    const owner = getOwnerLabel(state.currentLead.ownerUserId);
    const healthTemperature = String(state.currentLead.healthTemperature || "warm");
    const healthScore = Number.isFinite(Number(state.currentLead.healthScore)) ? Number(state.currentLead.healthScore) : 50;
    state.nodes.leadMetaEl.textContent =
      `Lead: ${state.currentLead.name} | etapa: ${getLeadPipelineLabel(state.currentLead)} | owner: ${owner} | health:${healthTemperature} (${healthScore}) | tags: ${tagsText}`;
    state.nodes.noteBtn.disabled = false;
    state.nodes.stageBtn.disabled = false;
    state.nodes.reminderBtn.disabled = false;
    if (state.nodes.insertFollowupBtn) {
      state.nodes.insertFollowupBtn.disabled = false;
    }
    if (state.nodes.quickFollowupBtn) {
      state.nodes.quickFollowupBtn.disabled = false;
    }
    void refreshFollowupMeta();
  };

  const syncLeadWithPhone = () => {
    const phone = normalizePhone(state.nodes.phoneInput?.value || "");
    if (!phone) {
      state.currentLead = null;
      updateLeadMeta();
      return;
    }

    state.currentLead =
      state.leads.find((lead) => normalizePhone(lead.phoneE164) === phone) || null;
    if (state.currentLead && state.nodes.stageSelect) {
      state.nodes.stageSelect.value = state.currentLead.stage;
      if (state.nodes.consentSelect) {
        state.nodes.consentSelect.value = state.currentLead.consentStatus;
      }
      if (state.nodes.ownerSelect) {
        state.nodes.ownerSelect.value = state.currentLead.ownerUserId || "";
      }
      if (state.nodes.tagsInput) {
        state.nodes.tagsInput.value = (state.currentLead.tags || []).join(", ");
      }
      if (state.templateMode === "real_estate") {
        fillProfileForm(parseProfileNote(state.currentLead));
      } else {
        fillProfileForm(null);
      }
    } else {
      fillProfileForm(null);
    }
    updateLeadMeta();
  };

  const renderTemplates = () => {
    const selectEl = state.nodes.templateSelect;
    if (!selectEl) {
      return;
    }
    selectEl.innerHTML = "";

    if (state.templates.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin plantillas";
      selectEl.appendChild(option);
      return;
    }

    state.templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      selectEl.appendChild(option);
    });
  };

  const renderTagSuggestions = () => {
    const container = state.nodes.tagSuggestionsEl;
    if (!container) {
      return;
    }
    container.innerHTML = "";
    const suggestions = SUGGESTED_TAGS_BY_TEMPLATE[state.templateMode] || SUGGESTED_TAGS_BY_TEMPLATE[DEFAULT_TEMPLATE_MODE];
    suggestions.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-chip";
      button.textContent = tag;
      button.addEventListener("click", () => appendTagToInput(tag));
      container.appendChild(button);
    });
  };

  const getTemplatePlaybookSteps = () => {
    if (state.templateMode === "general") {
      return [
        "Paso 1: valida necesidad y objetivo principal del lead.",
        "Paso 2: confirma presupuesto, plazo y decisor.",
        "Paso 3: envia propuesta clara y acuerda siguiente accion.",
      ];
    }
    return [
      "Paso 1: valida operacion, zona y presupuesto.",
      "Paso 2: agenda visita o llamada de calificacion.",
      "Paso 3: presenta opciones y empuja oferta/cierre.",
    ];
  };

  const renderTemplatePlaybook = () => {
    const listEl = state.nodes.templateStepsEl;
    if (!listEl) {
      return;
    }
    listEl.innerHTML = "";
    getTemplatePlaybookSteps().forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      listEl.appendChild(li);
    });
  };

  const applyTemplateModeUI = () => {
    if (state.nodes.templateModeSelect) {
      state.nodes.templateModeSelect.value = state.templateMode;
    }
    if (state.nodes.templateModeMetaEl) {
      state.nodes.templateModeMetaEl.textContent = state.templateMode === "real_estate" ? "Inmobiliaria" : "General";
    }
    const isRealEstate = state.templateMode === "real_estate";
    if (state.nodes.realEstateBlock) {
      state.nodes.realEstateBlock.classList.toggle("wacrm-hidden-block", !isRealEstate);
    }
    if (state.nodes.generalBlock) {
      state.nodes.generalBlock.classList.toggle("wacrm-hidden-block", isRealEstate);
    }
    renderTemplatePlaybook();
  };

  const renderStageShortcuts = () => {
    const container = state.nodes.stageShortcutsEl;
    if (!container) {
      return;
    }
    container.innerHTML = "";
    getPipelineStages().forEach((shortcut) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-btn ghost";
      button.textContent = shortcut.label;
      button.addEventListener("click", () => {
        void withSyncGuard(async () => {
          await applyStageShortcut(shortcut);
        });
      });
      container.appendChild(button);
    });
  };

  const renderChatInfo = () => {
    const chat = getCurrentChat();
    if (!chat) {
      state.currentChat = null;
      if (state.nodes.chatEl) {
        state.nodes.chatEl.textContent = "Abre una conversacion para gestionar.";
      }
      renderNativeActionBars();
      return;
    }

    const previousKey = state.currentChat?.key;
    state.currentChat = chat;
    if (previousKey !== chat.key) {
      void markTutorialStep("open_chat");
    }
    if (state.nodes.chatEl) {
      state.nodes.chatEl.textContent = chat.phoneGuess
        ? `${chat.name} (${chat.phoneGuess})`
        : chat.name;
    }

    if (!state.nodes.nameInput?.value.trim() || previousKey !== chat.key) {
      state.nodes.nameInput.value = chat.name;
    }
    if (!state.nodes.phoneInput?.value.trim() || previousKey !== chat.key) {
      state.nodes.phoneInput.value = chat.phoneGuess;
    }

    syncLeadWithPhone();
    renderNativeActionBars();
  };

  const fetchWorkspaceData = async () => {
    if (!state.token) {
      resetApiCapabilities();
      state.me = null;
      state.workspaceId = "";
      applyWorkspaceCustomStages();
      applyWorkspaceTemplateMode();
      state.subscription = null;
      state.canUseCrm = false;
      state.trustCenter = null;
      state.messagingMode = null;
      state.templates = [];
      state.leads = [];
      state.reminders = [];
      state.workspaceUsers = [];
      state.leadInbox = null;
      state.productivity = null;
      state.currentLead = null;
      renderTemplates();
      fillProfileForm(null);
      renderHotLeads();
      renderCustomStageMeta();
      applyTemplateModeUI();
      renderTagSuggestions();
      renderStageShortcuts();
      renderStageFilters();
      renderStageLeads();
      setModeState();
      updateLeadMeta();
      updatePipelineMeta();
      renderComplianceMeta();
      renderMessagingModeMeta();
      renderOwnerSelect();
      renderTeamInbox();
      renderProductivityPanel();
      await refreshFollowupMeta();
      renderNativeActionBars();
      return;
    }

    const meData = await apiRequest("/auth/me");
    const billingData = await apiRequest("/billing/subscription");
    state.me = meData.user || null;
    state.workspaceId = String(meData?.workspace?.id || meData?.user?.workspaceId || "").trim();
    applyWorkspaceCustomStages();
    applyWorkspaceTemplateMode();
    state.subscription = billingData.subscription || null;
    state.canUseCrm = Boolean(state.subscription?.canUseCrm);

    if (!state.canUseCrm) {
      state.trustCenter = null;
      state.messagingMode = null;
      state.templates = [];
      state.leads = [];
      state.reminders = [];
      state.workspaceUsers = [];
      state.leadInbox = null;
      state.productivity = null;
      state.currentLead = null;
      renderTemplates();
      renderHotLeads();
      renderCustomStageMeta();
      applyTemplateModeUI();
      renderTagSuggestions();
      renderStageShortcuts();
      renderStageFilters();
      renderStageLeads();
      updateLeadMeta();
      updatePipelineMeta();
      renderComplianceMeta();
      renderMessagingModeMeta();
      renderOwnerSelect();
      renderTeamInbox();
      renderProductivityPanel();
      setModeState();
      await refreshFollowupMeta();
      setStatus("Sesion activa, pero suscripcion inactiva.", true);
      return;
    }

    const safeView = LEAD_INBOX_VIEWS.includes(state.leadInboxView) ? state.leadInboxView : "my";
    const [
      templatesData,
      leadsData,
      remindersData,
      trustCenterData,
      usersData,
      inboxData,
      productivityData,
      modeData,
    ] = await Promise.all([
      apiRequest("/templates"),
      apiRequest("/leads"),
      apiRequest("/reminders"),
      optionalApiRequest("complianceTrustCenter", "/compliance/trust-center", { trustCenter: null }),
      optionalApiRequest("authUsers", "/auth/users", { users: [] }),
      optionalApiRequest("leadsInbox", `/leads/inbox?view=${encodeURIComponent(safeView)}`, { inbox: null }),
      optionalApiRequest("analyticsProductivity", "/analytics/productivity", { productivity: null }),
      optionalApiRequest("complianceMessagingMode", "/compliance/messaging-mode", { mode: null }),
    ]);
    state.templates = templatesData.templates || [];
    state.leads = leadsData.leads || [];
    state.reminders = remindersData.reminders || [];
    state.trustCenter = trustCenterData.trustCenter || null;
    state.workspaceUsers = usersData.users || [];
    state.leadInbox = inboxData.inbox || null;
    state.leadInboxView = state.leadInbox?.view || safeView;
    state.productivity = productivityData.productivity || null;
    state.messagingMode = modeData.mode || null;
    renderTemplates();
    updatePipelineMeta();
    renderComplianceMeta();
    renderMessagingModeMeta();
    renderOwnerSelect();
    renderHotLeads();
    renderCustomStageMeta();
    applyTemplateModeUI();
    renderTagSuggestions();
    renderStageShortcuts();
    renderStageFilters();
    renderStageLeads();
    renderTeamInbox();
    renderProductivityPanel();
    syncLeadWithPhone();
    await refreshFollowupMeta();
    setModeState();
    const modeLabel = state.templateMode === "real_estate" ? "Inmobiliaria" : "General";
    const riskLevel = String(state.trustCenter?.antiSpamRisk?.level || "low");
    const riskScore = Number(state.trustCenter?.antiSpamRisk?.score || 0);
    const messagingMode = String(state.messagingMode?.resolvedMode || "crm_manual");
    setStatus(
      `CRM activo (${modeLabel}) para ${state.me?.email || "workspace actual"} | compliance: ${riskLevel} (${riskScore}) | mode:${messagingMode}.`,
    );
    renderNativeActionBars();
  };

  const insertMessageIntoComposer = (message) => {
    const composer = getComposerEl();
    if (!composer) {
      setStatus("No se encontro el cuadro de mensaje en WhatsApp Web.", true);
      return false;
    }

    composer.focus();
    composer.textContent = message;
    composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: message }));
    return true;
  };

  const applyBlurMode = () => {
    document.documentElement.classList.toggle("wacrm-blur-mode", state.blurMode);
    if (state.nodes.blurBtn) {
      state.nodes.blurBtn.textContent = state.blurMode ? "Blur ON" : "Blur OFF";
    }
  };

  const getLeadCopilotContext = () => {
    const lead = state.currentLead;
    if (!lead) {
      return null;
    }
    const stageLabel = getLeadPipelineLabel(lead);
    const tags = Array.isArray(lead.tags) ? lead.tags.slice(0, 5).join(", ") : "-";
    const reminder = getNextDueReminderForLead(lead.id);
    return {
      lead,
      stageLabel,
      tags,
      reminderText: reminder?.note ? String(reminder.note).slice(0, 160) : "",
    };
  };

  const buildCopilotOutput = (mode) => {
    const context = getLeadCopilotContext();
    if (!context) {
      return "Primero selecciona o guarda un lead del chat actual.";
    }
    const name = String(context.lead.name || state.currentChat?.name || "cliente").trim();

    if (mode === "summary") {
      return `Resumen lead: ${name} | etapa: ${context.stageLabel} | tags: ${context.tags || "-"}${
        context.reminderText ? ` | recordatorio: ${context.reminderText}` : ""
      }`;
    }
    if (mode === "next") {
      const nextAction = context.lead.stage === "new"
        ? "hacer primer contacto y validar presupuesto/zona"
        : context.lead.stage === "contacted"
          ? "cerrar fecha de visita o llamada de calificaci\u00f3n"
          : context.lead.stage === "qualified"
            ? "presentar propuesta y resolver objeciones"
            : context.lead.stage === "won"
              ? "activar onboarding y solicitar referidos"
              : "agendar reactivacion a 30 dias";
      return `Siguiente accion recomendada: ${nextAction}.`;
    }

    const opening = context.lead.stage === "new" ? "Gracias por escribirnos." : "Seguimos con tu consulta.";
    const reminderLine = context.reminderText ? ` ${context.reminderText}.` : "";
    return `Hola ${name}, ${opening}${reminderLine} Si te parece, hoy avanzamos con los siguientes pasos y te envio opciones concretas.`;
  };

  const trackManualAssist = async (action, context = "") => {
    const payload = {
      action,
      context: String(context || "").trim().slice(0, 80),
    };
    return optionalApiRequest(
      "complianceManualAssist",
      "/compliance/manual-assist",
      { usage: null },
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  };

  const runCopilot = async (mode) => {
    const actionByMode = {
      reply: "copilot_reply",
      summary: "copilot_summary",
      next: "copilot_next",
    };
    const action = actionByMode[mode] || "copilot_reply";
    try {
      await trackManualAssist(action, `mode:${mode}`);
    } catch (error) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("limite por minuto")) {
        setStatus("Limite por minuto del Copiloto alcanzado. Espera unos segundos.", true);
        return;
      }
      throw error;
    }

    const output = buildCopilotOutput(mode);
    if (state.nodes.copilotOutput) {
      state.nodes.copilotOutput.value = output;
    }
    setStatus("Copiloto listo. Revisa el texto antes de insertarlo.");
  };

  const insertCopilotOutput = async () => {
    const text = String(state.nodes.copilotOutput?.value || "").trim();
    if (!text) {
      setStatus("Genera una sugerencia antes de insertar.", true);
      return;
    }
    try {
      await trackManualAssist("copilot_insert", "insert");
    } catch (error) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("limite por minuto")) {
        setStatus("Limite por minuto del Copiloto alcanzado. Espera unos segundos.", true);
        return;
      }
      throw error;
    }
    const inserted = insertMessageIntoComposer(text);
    if (!inserted) {
      return;
    }
    setStatus("Texto del copiloto insertado. Envio manual.");
  };

  const handoffToHuman = async () => {
    await trackManualAssist("copilot_handoff", "handoff");
    const lead = await ensureCurrentLead();
    await apiRequest(`/leads/${lead.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note: "Derivacion manual a humano solicitada desde Copiloto." }),
    });
    setStatus("Lead marcado para derivacion humana.");
  };

  const getNextDueReminderForLead = (leadId) => {
    const now = Date.now();
    const reminders = Array.isArray(state.reminders) ? state.reminders : [];
    const candidates = reminders
      .filter((reminder) => reminder && reminder.leadId === leadId && reminder.status !== "done")
      .filter((reminder) => {
        const dueTime = new Date(reminder.dueAt || "").getTime();
        return !Number.isNaN(dueTime) && dueTime <= now;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    return candidates[0] || null;
  };

  const buildManualFollowupMessage = (lead, reminder) => {
    const contactName = String(lead?.name || state.currentChat?.name || "cliente").trim();
    const reminderText = String(reminder?.note || "").trim();
    const intro = reminderText
      ? `te escribo para ${reminderText.toLowerCase()}.`
      : "te escribo para dar seguimiento a tu consulta.";
    return `Hola ${contactName}, ${intro} ¿Te viene bien continuar hoy por este medio?`;
  };

  const refreshFollowupMeta = async () => {
    const followupMetaEl = state.nodes.followupMetaEl;
    if (!followupMetaEl) {
      return;
    }
    const count = await getTodayFollowupCount();
    followupMetaEl.textContent = `Seguimientos manuales hoy: ${count}/${FOLLOWUP_DAILY_LIMIT}.`;
    if (state.nodes.insertFollowupBtn) {
      state.nodes.insertFollowupBtn.disabled = !state.currentLead || count >= FOLLOWUP_DAILY_LIMIT;
    }
  };

  const insertManualFollowup = async () => {
    const lead = await ensureCurrentLead();
    const todayCount = await getTodayFollowupCount();
    if (todayCount >= FOLLOWUP_DAILY_LIMIT) {
      setStatus(`Limite diario alcanzado (${FOLLOWUP_DAILY_LIMIT}). Vuelve a intentar manana.`, true);
      await refreshFollowupMeta();
      return;
    }

    const reminder = getNextDueReminderForLead(lead.id);
    const message = buildManualFollowupMessage(lead, reminder);
    const inserted = insertMessageIntoComposer(message);
    if (!inserted) {
      return;
    }

    const nextCount = await incrementTodayFollowupCount();
    void markTutorialStep("create_followup");
    const reminderNote = reminder?.note ? ` | recordatorio: ${String(reminder.note).slice(0, 180)}` : "";
    try {
      await apiRequest(`/leads/${lead.id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          note: `Seguimiento manual insertado en WhatsApp (${nextCount}/${FOLLOWUP_DAILY_LIMIT})${reminderNote}`.slice(0, 500),
        }),
      });
    } catch (_error) {
      // Keep manual flow resilient even if note logging fails.
    }

    await refreshFollowupMeta();
    setStatus(`Seguimiento insertado. Revisa y envia manualmente (${nextCount}/${FOLLOWUP_DAILY_LIMIT} hoy).`);
  };

  const insertTemplateIntoComposer = () => {
    const templateId = state.nodes.templateSelect?.value || "";
    const template = state.templates.find((item) => item.id === templateId);
    if (!template) {
      setStatus("Selecciona una plantilla valida.", true);
      return;
    }

    const contactName = state.nodes.nameInput?.value?.trim() || state.currentChat?.name || "cliente";
    const message = String(template.body || "").replace(/\{\{\s*name\s*\}\}/gi, contactName);
    const inserted = insertMessageIntoComposer(message);
    if (!inserted) {
      return;
    }

    void markTutorialStep("insert_template");
    setStatus("Plantilla insertada. Revisa y envia manualmente.");
  };

  const saveLead = async () => {
    const phone = normalizePhone(state.nodes.phoneInput?.value || "");
    const name = String(state.nodes.nameInput?.value || "").trim();
    if (!phone || !name) {
      setStatus("Completa nombre y telefono para guardar el lead.", true);
      return;
    }

    const tagsRaw = parseCsvTags(String(state.nodes.tagsInput?.value || ""));
    const profile = state.templateMode === "real_estate" ? getProfileFromForm() : null;
    const derivedTags = profile ? buildProfileDerivedTags(profile) : [];
    const stage = state.nodes.stageSelect?.value || "new";
    const pipelineStageKey = getDefaultPipelineKeyFromStage(stage);
    const tags = withPipelineStageTag(mergeTags(tagsRaw, derivedTags), pipelineStageKey);
    const payload = {
      name,
      phoneE164: phone,
      consentStatus: state.nodes.consentSelect?.value || "pending",
      consentSource: "whatsapp_web_manual",
      stage,
      ownerUserId: String(state.nodes.ownerSelect?.value || "").trim() || null,
      tags,
    };

    const result = await apiRequest("/leads/upsert", { method: "POST", body: JSON.stringify(payload) });
    const leadId = result?.lead?.id;
    if (leadId && profile && hasProfileData(profile)) {
      await apiRequest(`/leads/${leadId}/notes`, {
        method: "POST",
        body: JSON.stringify({ note: buildProfileNote(profile) }),
      });
      void markTutorialStep("add_profile");
    }
    void markTutorialStep("save_lead");
    setStatus("Lead/ficha guardados.");
    await fetchWorkspaceData();
  };

  const ensureCurrentLead = async () => {
    if (state.currentLead) {
      return state.currentLead;
    }

    await saveLead();
    if (!state.currentLead) {
      throw new Error("No hay lead asociado al chat actual.");
    }

    return state.currentLead;
  };

  const syncLeadPipelineStage = async (lead, stage, stageKey, note) => {
    const nextTags = withPipelineStageTag(lead?.tags || [], stageKey);
    await apiRequest(`/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage, tags: nextTags }),
    });
    if (note) {
      await apiRequest(`/leads/${lead.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
    }
  };

  const updateLeadStage = async () => {
    const lead = await ensureCurrentLead();

    const stage = state.nodes.stageSelect?.value || lead.stage;
    const currentPipelineKey = getLeadPipelineStageKey(lead);
    const currentPipeline = getPipelineStageByKey(currentPipelineKey);
    const isCurrentCompatible = Boolean(currentPipeline && currentPipeline.stage === stage);
    const nextPipelineKey = isCurrentCompatible ? currentPipelineKey : getDefaultPipelineKeyFromStage(stage);
    await syncLeadPipelineStage(lead, stage, nextPipelineKey);
    void markTutorialStep("set_stage");
    setStatus("Etapa actualizada.");
    await fetchWorkspaceData();
  };

  const applyStageShortcut = async (shortcut) => {
    const lead = await ensureCurrentLead();
    await syncLeadPipelineStage(lead, shortcut.stage, shortcut.key, shortcut.note);
    void markTutorialStep("set_stage");
    setStatus(`Atajo aplicado: ${shortcut.label}.`);
    await fetchWorkspaceData();
  };

  const addLeadNote = async () => {
    const lead = await ensureCurrentLead();

    const note = String(state.nodes.noteInput?.value || "").trim();
    if (!note) {
      setStatus("Escribe una nota antes de guardar.", true);
      return;
    }

    await apiRequest(`/leads/${lead.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    state.nodes.noteInput.value = "";
    setStatus("Nota guardada.");
    await fetchWorkspaceData();
  };

  const addReminder = async () => {
    const lead = await ensureCurrentLead();

    const note = String(state.nodes.reminderNoteInput?.value || "").trim();
    const dueAtLocal = String(state.nodes.reminderDateInput?.value || "").trim();
    const dueDate = new Date(dueAtLocal);
    if (!note || !dueAtLocal || Number.isNaN(dueDate.getTime())) {
      setStatus("Completa nota y fecha valida para el recordatorio.", true);
      return;
    }
    const dueAtIso = dueDate.toISOString();

    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify({
        leadId: lead.id,
        note,
        dueAt: dueAtIso,
      }),
    });
    state.nodes.reminderNoteInput.value = "";
    void markTutorialStep("create_followup");
    setStatus("Recordatorio creado.");
    await fetchWorkspaceData();
  };

  const createQuickFollowup = async () => {
    const lead = await ensureCurrentLead();
    const hoursRaw = Number.parseInt(String(state.nodes.followupHoursInput?.value || "24"), 10);
    const hours = Number.isNaN(hoursRaw) ? 24 : Math.max(1, Math.min(720, hoursRaw));
    const dueAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const noteLabel = state.templateMode === "real_estate" ? "Seguimiento inmobiliario" : "Seguimiento comercial";
    if (state.nodes.followupHoursInput) {
      state.nodes.followupHoursInput.value = String(hours);
    }

    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify({
        leadId: lead.id,
        note: `${noteLabel} (${hours}h)`,
        dueAt,
      }),
    });
    void markTutorialStep("create_followup");
    setStatus("Seguimiento rapido creado.");
    await fetchWorkspaceData();
  };

  const withSyncGuard = async (task) => {
    if (state.syncing) {
      return;
    }
    state.syncing = true;
    renderNativeActionBars();
    try {
      await task();
    } catch (error) {
      setStatus(error?.message || "Error inesperado.", true);
    } finally {
      state.syncing = false;
      setModeState();
      renderNativeActionBars();
    }
  };

  const createDock = () => {
    const dock = document.createElement("aside");
    dock.id = "wacrm-dock";
    dock.innerHTML = `
      <button type="button" class="wacrm-dock-toggle" id="wacrm-dock-toggle" title="Abrir menu CRM">CRM</button>
      <div class="wacrm-dock-menu" id="wacrm-dock-menu">
        <button type="button" class="wacrm-dock-item active" data-action="overview" data-section="overview" title="Inicio y leads calientes">H</button>
        <button type="button" class="wacrm-dock-item" data-action="save-lead" data-section="lead" title="Guardar lead del chat actual">L</button>
        <button type="button" class="wacrm-dock-item" data-action="insert-template" data-section="actions" title="Insertar plantilla seleccionada">A</button>
        <button type="button" class="wacrm-dock-item" data-action="quick-followup" data-section="actions" title="Crear seguimiento rapido (24h)">S</button>
        <button type="button" class="wacrm-dock-item" data-action="crm" data-section="crm" title="Vista CRM Kanban">K</button>
        <button type="button" class="wacrm-dock-item" data-action="tutorial" data-section="tutorial" title="Tutorial">T</button>
        <button type="button" class="wacrm-dock-item" data-action="all" data-section="all" title="Ver todo el panel">+</button>
      </div>
    `;
    document.body.appendChild(dock);

    state.nodes.dock = dock;
    state.nodes.dockMenu = dock.querySelector("#wacrm-dock-menu");
    state.nodes.dockToggle = dock.querySelector("#wacrm-dock-toggle");
    state.nodes.dockButtons = Array.from(dock.querySelectorAll("[data-action]"));
    state.nodes.dockToggle?.addEventListener("click", () => {
      state.dockOpen = !state.dockOpen;
      state.nodes.dock?.classList.toggle("open", state.dockOpen);
    });
    state.nodes.dockButtons.forEach((button) => {
      button.addEventListener("click", () => {
        runDockAction(button.dataset.action || "overview");
        state.dockOpen = false;
        state.nodes.dock?.classList.remove("open");
      });
    });
  };

  const createPanel = () => {
    const root = document.createElement("aside");
    root.id = "wacrm-root";
    root.innerHTML = `
      <div class="wacrm-card">
        <div class="wacrm-header">
          <span class="wacrm-title">WhatsWidget ${CRM_BUILD_TAG}</span>
          <div class="wacrm-header-actions">
            <button type="button" class="wacrm-minify" id="wacrm-toggle-blur">Blur OFF</button>
            <button type="button" class="wacrm-minify" id="wacrm-toggle">Minimizar</button>
          </div>
        </div>
        <div class="wacrm-body" id="wacrm-body">
          <p class="wacrm-status" id="wacrm-status">Inicializando CRM...</p>
          <div class="wacrm-tabs" id="wacrm-tabs">
            <button type="button" class="wacrm-tab active" data-section="overview">Inicio</button>
            <button type="button" class="wacrm-tab" data-section="lead">Leads</button>
            <button type="button" class="wacrm-tab" data-section="actions">Acciones</button>
            <button type="button" class="wacrm-tab" data-section="crm">CRM</button>
            <button type="button" class="wacrm-tab" data-section="tutorial">Tutorial</button>
          </div>
          <div class="wacrm-block" id="wacrm-gate"></div>
          <div class="wacrm-grid wacrm-hidden" id="wacrm-tools">
            <div class="wacrm-block" data-section="overview">
              <h4>Chat actual</h4>
              <p class="wacrm-meta" id="wacrm-chat-meta">Abre una conversacion para gestionar.</p>
              <p class="wacrm-meta" id="wacrm-pipeline-meta">Pipeline: new:0 | contacted:0 | qualified:0 | won:0 | lost:0</p>
              <p class="wacrm-meta" id="wacrm-compliance-meta">Compliant Mode ON | riesgo: low (0).</p>
              <p class="wacrm-meta" id="wacrm-mode-meta">Modo: crm_manual | proveedor: dry_run.</p>
            </div>
            <div class="wacrm-block" data-section="tutorial">
              <h4>Tutorial rapido</h4>
              <p class="wacrm-meta" id="wacrm-tutorial-summary">Progreso tutorial: 0/6</p>
              <div class="wacrm-checklist" id="wacrm-tutorial-list"></div>
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn ghost" id="wacrm-reset-tutorial">Reiniciar tutorial</button>
              </div>
            </div>
            <div class="wacrm-block" data-section="overview">
              <h4>Leads calientes hoy</h4>
              <p class="wacrm-meta" id="wacrm-hot-meta">Sin leads calientes hoy.</p>
              <div class="wacrm-hot-list" id="wacrm-hot-leads"></div>
            </div>
            <div class="wacrm-block" data-section="overview,crm">
              <h4>Bandeja multiagente</h4>
              <div class="wacrm-chip-row" id="wacrm-inbox-filters"></div>
              <p class="wacrm-meta" id="wacrm-inbox-counts">all:0 | my:0 | unassigned:0 | overdue:0</p>
              <div class="wacrm-stage-list" id="wacrm-inbox-list"></div>
            </div>
            <div class="wacrm-block" data-section="overview,crm">
              <h4>Productividad</h4>
              <p class="wacrm-meta" id="wacrm-productivity-meta">Sin datos de productividad.</p>
              <div class="wacrm-stage-list" id="wacrm-productivity-list"></div>
            </div>
            <div class="wacrm-block" data-section="crm">
              <h4>CRM Kanban</h4>
              <p class="wacrm-meta">Arrastra leads entre columnas para mover su etapa.</p>
              <div class="wacrm-kanban-board" id="wacrm-kanban-board"></div>
            </div>
            <div class="wacrm-block" data-section="overview,lead">
              <h4>Contactos por etapa</h4>
              <div class="wacrm-chip-row" id="wacrm-stage-filters"></div>
              <p class="wacrm-meta" id="wacrm-stage-filter-meta">0 contacto(s) en todas.</p>
              <div class="wacrm-stage-list" id="wacrm-stage-leads"></div>
            </div>
            <div class="wacrm-block" data-section="lead">
              <h4>Lead rapido</h4>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Plantilla
                  <select class="wacrm-select" id="wacrm-template-mode">
                    <option value="general">General</option>
                    <option value="real_estate">Inmobiliaria</option>
                  </select>
                </label>
                <div class="wacrm-label">
                  <span>Modo activo</span>
                  <p class="wacrm-meta" id="wacrm-template-mode-meta">Inmobiliaria</p>
                </div>
              </div>
              <label class="wacrm-label">Nombre<input class="wacrm-input" id="wacrm-name" /></label>
              <label class="wacrm-label">Telefono E.164<input class="wacrm-input" id="wacrm-phone" placeholder="+51999999999" /></label>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Etapa
                  <select class="wacrm-select" id="wacrm-stage"></select>
                </label>
                <label class="wacrm-label">Consentimiento
                  <select class="wacrm-select" id="wacrm-consent"></select>
                </label>
              </div>
              <label class="wacrm-label">Responsable
                <select class="wacrm-select" id="wacrm-owner-user">
                  <option value="">Sin asignar</option>
                </select>
              </label>
              <label class="wacrm-label">Tags (coma)<input class="wacrm-input" id="wacrm-tags" placeholder="nuevo, premium" /></label>
              <div class="wacrm-chip-row" id="wacrm-tag-suggestions"></div>
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn" id="wacrm-save-lead">Guardar lead</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-refresh">Refrescar</button>
                <button type="button" class="wacrm-btn secondary" id="wacrm-update-stage">Actualizar etapa</button>
              </div>
              <p class="wacrm-meta">Atajos de pipeline</p>
              <div class="wacrm-actions" id="wacrm-stage-shortcuts"></div>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Nueva etapa
                  <input class="wacrm-input" id="wacrm-custom-stage-input" placeholder="Separacion, postventa, etc." />
                </label>
                <div class="wacrm-label">
                  <span>Accion</span>
                  <button type="button" class="wacrm-btn ghost" id="wacrm-add-custom-stage">Crear etapa</button>
                </div>
              </div>
              <p class="wacrm-meta" id="wacrm-custom-stage-meta">Sin etapas personalizadas.</p>
              <p class="wacrm-meta" id="wacrm-lead-meta">Sin lead asociado al chat actual.</p>
            </div>
            <div class="wacrm-block" data-section="lead" id="wacrm-general-block">
              <h4>Playbook general</h4>
              <ol class="wacrm-playbook" id="wacrm-template-steps"></ol>
              <p class="wacrm-meta">Usa estos pasos para servicios, ecommerce o ventas generales.</p>
            </div>
            <div class="wacrm-block" data-section="lead" id="wacrm-real-estate-block">
              <h4>Ficha inmobiliaria</h4>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Operacion
                  <select class="wacrm-select" id="wacrm-operation"></select>
                </label>
                <label class="wacrm-label">Tipo propiedad
                  <select class="wacrm-select" id="wacrm-property-type"></select>
                </label>
              </div>
              <label class="wacrm-label">Distrito/Zona
                <input class="wacrm-input" id="wacrm-district" placeholder="Miraflores, Surco, etc." />
              </label>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Presupuesto min
                  <input class="wacrm-input" id="wacrm-budget-min" placeholder="300000" />
                </label>
                <label class="wacrm-label">Presupuesto max
                  <input class="wacrm-input" id="wacrm-budget-max" placeholder="500000" />
                </label>
              </div>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Dormitorios
                  <select class="wacrm-select" id="wacrm-bedrooms"></select>
                </label>
                <label class="wacrm-label">Tiempo compra/cierre
                  <select class="wacrm-select" id="wacrm-timeline"></select>
                </label>
              </div>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Fuente
                  <select class="wacrm-select" id="wacrm-source"></select>
                </label>
                <label class="wacrm-label">Urgencia
                  <select class="wacrm-select" id="wacrm-urgency"></select>
                </label>
              </div>
              <p class="wacrm-meta">Al guardar lead se guarda la ficha y se generan etiquetas automaticamente.</p>
            </div>
            <div class="wacrm-block" data-section="actions">
              <h4>Plantilla en chat</h4>
              <label class="wacrm-label">Plantilla
                <select class="wacrm-select" id="wacrm-template"></select>
              </label>
              <button type="button" class="wacrm-btn secondary" id="wacrm-insert-template">Insertar en caja de mensaje</button>
              <button type="button" class="wacrm-btn ghost" id="wacrm-insert-followup">Insertar seguimiento manual</button>
              <p class="wacrm-meta" id="wacrm-followup-meta">Seguimientos manuales hoy: 0/${FOLLOWUP_DAILY_LIMIT}.</p>
              <p class="wacrm-meta">Limite diario de seguimiento manual para cumplimiento: ${FOLLOWUP_DAILY_LIMIT}.</p>
              <p class="wacrm-meta">No envia automaticamente. Solo inserta texto para envio manual.</p>
            </div>
            <div class="wacrm-block" data-section="actions">
              <h4>Notas y recordatorios</h4>
              <label class="wacrm-label">Nota
                <textarea class="wacrm-textarea" id="wacrm-note" placeholder="Escribe seguimiento..."></textarea>
              </label>
              <button type="button" class="wacrm-btn" id="wacrm-save-note">Guardar nota</button>
              <label class="wacrm-label">Fecha recordatorio
                <input class="wacrm-input" id="wacrm-reminder-date" type="datetime-local" />
              </label>
              <label class="wacrm-label">Nota recordatorio
                <input class="wacrm-input" id="wacrm-reminder-note" placeholder="Llamar manana" />
              </label>
              <button type="button" class="wacrm-btn secondary" id="wacrm-save-reminder">Crear recordatorio</button>
              <div class="wacrm-grid two">
                <label class="wacrm-label">Seguimiento rapido (horas)
                  <input class="wacrm-input" id="wacrm-followup-hours" type="number" min="1" max="720" value="24" />
                </label>
                <div class="wacrm-label">
                  <span>Accion</span>
                  <button type="button" class="wacrm-btn ghost" id="wacrm-quick-followup">Crear seguimiento rapido</button>
                </div>
              </div>
            </div>
            <div class="wacrm-block" data-section="actions">
              <h4>Copiloto asistido</h4>
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn ghost" id="wacrm-copilot-reply">Sugerir respuesta</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-copilot-summary">Resumir lead</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-copilot-next">Siguiente accion</button>
              </div>
              <label class="wacrm-label">Salida copiloto
                <textarea class="wacrm-textarea" id="wacrm-copilot-output" placeholder="Genera una sugerencia..."></textarea>
              </label>
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn secondary" id="wacrm-copilot-insert">Insertar en chat</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-copilot-human">Derivar a humano</button>
              </div>
              <p class="wacrm-meta">Modo asistido: nunca envia automaticamente.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    state.nodes.root = root;
    state.nodes.bodyEl = root.querySelector("#wacrm-body");
    state.nodes.statusEl = root.querySelector("#wacrm-status");
    state.nodes.tabButtons = Array.from(root.querySelectorAll("#wacrm-tabs [data-section]"));
    state.nodes.gateEl = root.querySelector("#wacrm-gate");
    state.nodes.toolsEl = root.querySelector("#wacrm-tools");
    state.nodes.chatEl = root.querySelector("#wacrm-chat-meta");
    state.nodes.pipelineMetaEl = root.querySelector("#wacrm-pipeline-meta");
    state.nodes.complianceMetaEl = root.querySelector("#wacrm-compliance-meta");
    state.nodes.messagingModeMetaEl = root.querySelector("#wacrm-mode-meta");
    state.nodes.tutorialSummaryEl = root.querySelector("#wacrm-tutorial-summary");
    state.nodes.tutorialListEl = root.querySelector("#wacrm-tutorial-list");
    state.nodes.hotLeadsMetaEl = root.querySelector("#wacrm-hot-meta");
    state.nodes.hotLeadsEl = root.querySelector("#wacrm-hot-leads");
    state.nodes.inboxFiltersEl = root.querySelector("#wacrm-inbox-filters");
    state.nodes.inboxCountsEl = root.querySelector("#wacrm-inbox-counts");
    state.nodes.inboxListEl = root.querySelector("#wacrm-inbox-list");
    state.nodes.productivityMetaEl = root.querySelector("#wacrm-productivity-meta");
    state.nodes.productivityListEl = root.querySelector("#wacrm-productivity-list");
    state.nodes.crmBoardEl = root.querySelector("#wacrm-kanban-board");
    state.nodes.stageFiltersEl = root.querySelector("#wacrm-stage-filters");
    state.nodes.stageFilterMetaEl = root.querySelector("#wacrm-stage-filter-meta");
    state.nodes.stageLeadsEl = root.querySelector("#wacrm-stage-leads");
    state.nodes.templateModeSelect = root.querySelector("#wacrm-template-mode");
    state.nodes.templateModeMetaEl = root.querySelector("#wacrm-template-mode-meta");
    state.nodes.templateStepsEl = root.querySelector("#wacrm-template-steps");
    state.nodes.generalBlock = root.querySelector("#wacrm-general-block");
    state.nodes.realEstateBlock = root.querySelector("#wacrm-real-estate-block");
    state.nodes.nameInput = root.querySelector("#wacrm-name");
    state.nodes.phoneInput = root.querySelector("#wacrm-phone");
    state.nodes.stageSelect = root.querySelector("#wacrm-stage");
    state.nodes.consentSelect = root.querySelector("#wacrm-consent");
    state.nodes.ownerSelect = root.querySelector("#wacrm-owner-user");
    state.nodes.tagsInput = root.querySelector("#wacrm-tags");
    state.nodes.tagSuggestionsEl = root.querySelector("#wacrm-tag-suggestions");
    state.nodes.stageShortcutsEl = root.querySelector("#wacrm-stage-shortcuts");
    state.nodes.customStageInput = root.querySelector("#wacrm-custom-stage-input");
    state.nodes.customStageMetaEl = root.querySelector("#wacrm-custom-stage-meta");
    state.nodes.operationSelect = root.querySelector("#wacrm-operation");
    state.nodes.propertyTypeSelect = root.querySelector("#wacrm-property-type");
    state.nodes.districtInput = root.querySelector("#wacrm-district");
    state.nodes.budgetMinInput = root.querySelector("#wacrm-budget-min");
    state.nodes.budgetMaxInput = root.querySelector("#wacrm-budget-max");
    state.nodes.bedroomsSelect = root.querySelector("#wacrm-bedrooms");
    state.nodes.timelineSelect = root.querySelector("#wacrm-timeline");
    state.nodes.sourceSelect = root.querySelector("#wacrm-source");
    state.nodes.urgencySelect = root.querySelector("#wacrm-urgency");
    state.nodes.leadMetaEl = root.querySelector("#wacrm-lead-meta");
    state.nodes.templateSelect = root.querySelector("#wacrm-template");
    state.nodes.insertFollowupBtn = root.querySelector("#wacrm-insert-followup");
    state.nodes.followupMetaEl = root.querySelector("#wacrm-followup-meta");
    state.nodes.noteInput = root.querySelector("#wacrm-note");
    state.nodes.reminderDateInput = root.querySelector("#wacrm-reminder-date");
    state.nodes.reminderNoteInput = root.querySelector("#wacrm-reminder-note");
    state.nodes.followupHoursInput = root.querySelector("#wacrm-followup-hours");
    state.nodes.quickFollowupBtn = root.querySelector("#wacrm-quick-followup");
    state.nodes.noteBtn = root.querySelector("#wacrm-save-note");
    state.nodes.stageBtn = root.querySelector("#wacrm-update-stage");
    state.nodes.reminderBtn = root.querySelector("#wacrm-save-reminder");
    state.nodes.blurBtn = root.querySelector("#wacrm-toggle-blur");
    state.nodes.copilotOutput = root.querySelector("#wacrm-copilot-output");

    populateSelect(
      state.nodes.stageSelect,
      LEAD_STAGES.map((stage) => ({ value: stage, label: stage }))
    );
    populateSelect(
      state.nodes.consentSelect,
      CONSENT_STATES.map((consent) => ({ value: consent, label: consent }))
    );
    populateSelect(state.nodes.operationSelect, REAL_ESTATE_PROFILE.operation);
    populateSelect(state.nodes.propertyTypeSelect, REAL_ESTATE_PROFILE.propertyType);
    populateSelect(state.nodes.bedroomsSelect, REAL_ESTATE_PROFILE.bedrooms);
    populateSelect(state.nodes.timelineSelect, REAL_ESTATE_PROFILE.timeline);
    populateSelect(state.nodes.sourceSelect, REAL_ESTATE_PROFILE.source);
    populateSelect(state.nodes.urgencySelect, REAL_ESTATE_PROFILE.urgency);
    state.nodes.consentSelect.value = "opted_in";
    applyTemplateModeUI();
    renderTagSuggestions();
    renderStageShortcuts();
    renderTutorial();
    renderHotLeads();
    renderCustomStageMeta();
    renderStageFilters();
    renderStageLeads();
    renderComplianceMeta();
    renderMessagingModeMeta();
    renderOwnerSelect();
    renderTeamInbox();
    renderProductivityPanel();
    applyBlurMode();

    root.querySelector("#wacrm-toggle").addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      state.nodes.bodyEl.classList.toggle("wacrm-hidden", state.collapsed);
      root.querySelector("#wacrm-toggle").textContent = state.collapsed ? "Expandir" : "Minimizar";
    });
    root.querySelector("#wacrm-toggle-blur").addEventListener("click", () => {
      state.blurMode = !state.blurMode;
      void storageSet({ [BLUR_MODE_KEY]: state.blurMode });
      applyBlurMode();
    });

    state.nodes.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveSection(button.dataset.section || "overview");
      });
    });

    root.querySelector("#wacrm-refresh").addEventListener("click", () => {
      void withSyncGuard(fetchWorkspaceData);
    });
    root.querySelector("#wacrm-save-lead").addEventListener("click", () => {
      void withSyncGuard(saveLead);
    });
    root.querySelector("#wacrm-update-stage").addEventListener("click", () => {
      void withSyncGuard(updateLeadStage);
    });
    root.querySelector("#wacrm-insert-template").addEventListener("click", () => {
      insertTemplateIntoComposer();
    });
    root.querySelector("#wacrm-insert-followup").addEventListener("click", () => {
      void withSyncGuard(insertManualFollowup);
    });
    root.querySelector("#wacrm-save-note").addEventListener("click", () => {
      void withSyncGuard(addLeadNote);
    });
    root.querySelector("#wacrm-save-reminder").addEventListener("click", () => {
      void withSyncGuard(addReminder);
    });
    root.querySelector("#wacrm-quick-followup").addEventListener("click", () => {
      void withSyncGuard(createQuickFollowup);
    });
    root.querySelector("#wacrm-copilot-reply").addEventListener("click", () => {
      void withSyncGuard(async () => {
        await runCopilot("reply");
      });
    });
    root.querySelector("#wacrm-copilot-summary").addEventListener("click", () => {
      void withSyncGuard(async () => {
        await runCopilot("summary");
      });
    });
    root.querySelector("#wacrm-copilot-next").addEventListener("click", () => {
      void withSyncGuard(async () => {
        await runCopilot("next");
      });
    });
    root.querySelector("#wacrm-copilot-insert").addEventListener("click", () => {
      void withSyncGuard(async () => {
        await insertCopilotOutput();
      });
    });
    root.querySelector("#wacrm-copilot-human").addEventListener("click", () => {
      void withSyncGuard(handoffToHuman);
    });
    root.querySelector("#wacrm-add-custom-stage").addEventListener("click", () => {
      void withSyncGuard(addCustomStage);
    });
    root.querySelector("#wacrm-reset-tutorial").addEventListener("click", () => {
      void resetTutorial();
    });

    state.nodes.phoneInput.addEventListener("input", () => {
      syncLeadWithPhone();
    });
    state.nodes.templateModeSelect?.addEventListener("change", () => {
      state.templateMode = normalizeTemplateMode(state.nodes.templateModeSelect.value);
      void persistTemplateMode();
      applyTemplateModeUI();
      renderTagSuggestions();
      renderStageShortcuts();
      renderStageFilters();
      renderStageLeads();
      syncLeadWithPhone();
      setStatus(`Plantilla activa: ${state.templateMode === "real_estate" ? "Inmobiliaria" : "General"}.`);
    });
    state.nodes.inboxFiltersEl?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const chip = target.closest("[data-inbox-view]");
      if (!(chip instanceof HTMLElement)) {
        return;
      }

      const view = String(chip.dataset.inboxView || "").trim();
      if (!LEAD_INBOX_VIEWS.includes(view)) {
        return;
      }
      state.leadInboxView = view;
      void withSyncGuard(fetchWorkspaceData);
    });
    state.nodes.customStageInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void withSyncGuard(addCustomStage);
      }
    });
    enablePanelDragging(root);
    void refreshFollowupMeta();
    setActiveSection(state.activeSection);
  };

  const syncConfigFromStorage = async () => {
    const values = await storageGet(STORAGE_KEYS);
    state.apiBaseUrl = normalizeApiBaseUrl(values[BACKEND_URL_STORAGE_KEY] || values.crm_api_base_url || "");
    state.token = String(values.crm_token || "").trim();
    resetApiCapabilities();
    state.tutorialProgress = normalizeTutorialProgress(values[TUTORIAL_PROGRESS_KEY]);
    state.panelPosition = normalizePanelPosition(values[PANEL_POSITION_KEY]);
    state.customStageStore = normalizeCustomStageStore(values[CUSTOM_STAGES_KEY]);
    state.templateModeStore = normalizeTemplateModeStore(values[TEMPLATE_MODE_KEY]);
    state.blurMode = Boolean(values[BLUR_MODE_KEY]);
    applyWorkspaceCustomStages();
    applyWorkspaceTemplateMode();
    renderTutorial();
    renderCustomStageMeta();
    applyTemplateModeUI();
    renderStageShortcuts();
    renderStageFilters();
    renderStageLeads();
    renderTagSuggestions();
    renderMessagingModeMeta();
    renderOwnerSelect();
    renderTeamInbox();
    renderProductivityPanel();
    applyBlurMode();
  };

  const startWatchers = () => {
    const chromeApi = getChromeApi();
    if (hasChromeStorage() && isExtensionContextAlive() && chromeApi?.storage?.onChanged) {
      try {
        chromeApi.storage.onChanged.addListener((changes, areaName) => {
          if (areaName !== "local") {
            return;
          }

          let mustReload = false;
          if (changes.crm_api_base_url || changes[BACKEND_URL_STORAGE_KEY]) {
            const backendUrlRaw = changes[BACKEND_URL_STORAGE_KEY]
              ? changes[BACKEND_URL_STORAGE_KEY].newValue
              : changes.crm_api_base_url?.newValue;
            state.apiBaseUrl = normalizeApiBaseUrl(backendUrlRaw || "");
            resetApiCapabilities();
            mustReload = true;
          }
          if (changes.crm_token) {
            state.token = String(changes.crm_token.newValue || "").trim();
            resetApiCapabilities();
            mustReload = true;
          }
          if (changes[PANEL_POSITION_KEY]) {
            state.panelPosition = normalizePanelPosition(changes[PANEL_POSITION_KEY].newValue);
            positionPanel();
          }
          if (changes[CUSTOM_STAGES_KEY]) {
            state.customStageStore = normalizeCustomStageStore(changes[CUSTOM_STAGES_KEY].newValue);
            applyWorkspaceCustomStages();
            renderCustomStageMeta();
            renderStageShortcuts();
            renderStageFilters();
            renderStageLeads();
          }
          if (changes[TEMPLATE_MODE_KEY]) {
            state.templateModeStore = normalizeTemplateModeStore(changes[TEMPLATE_MODE_KEY].newValue);
            applyWorkspaceTemplateMode();
            applyTemplateModeUI();
            renderTagSuggestions();
            renderStageShortcuts();
            renderStageFilters();
            renderStageLeads();
          }
          if (changes[BLUR_MODE_KEY]) {
            state.blurMode = Boolean(changes[BLUR_MODE_KEY].newValue);
            applyBlurMode();
          }

          if (mustReload) {
            void withSyncGuard(fetchWorkspaceData);
          }
        });
      } catch (_error) {
        // Ignore storage watcher wiring errors when extension context is being reloaded.
      }
    }

    state.syncTimer = window.setInterval(() => {
      if (!isExtensionContextAlive()) {
        if (state.syncTimer) {
          window.clearInterval(state.syncTimer);
          state.syncTimer = null;
        }
        return;
      }
      renderChatInfo();
      positionPanel();
      setModeState();
      renderNativeActionBars();
    }, 2500);

    window.addEventListener("resize", positionPanel);
  };

  const positionPanel = () => {
    const root = state.nodes.root;
    if (!root) {
      return;
    }

    if (state.panelPosition) {
      applyPanelPosition(state.panelPosition.left, state.panelPosition.top);
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      root.style.left = "auto";
      root.style.right = "8px";
      root.style.top = "8px";
      root.style.bottom = "auto";
      return;
    }

    const contactHeader =
      document.querySelector("#main header") ||
      document.querySelector("[data-testid='conversation-header']") ||
      document.querySelector("header");

    const panelRect = root.getBoundingClientRect();
    const panelWidth = Math.round(panelRect.width || 368);
    const fallbackTop = 72;
    const fallbackLeft = Math.max(8, window.innerWidth - panelWidth - 16);

    if (!(contactHeader instanceof HTMLElement)) {
      applyPanelPosition(fallbackLeft, fallbackTop);
      return;
    }

    const headerRect = contactHeader.getBoundingClientRect();
    const centeredLeft = Math.round(headerRect.left + (headerRect.width - panelWidth) / 2);
    const topBelowHeader = Math.round(headerRect.bottom + 10);
    applyPanelPosition(centeredLeft, topBelowHeader);
  };

  const init = async () => {
    createPanel();
    createDock();
    positionPanel();
    setActiveSection(state.activeSection);
    await syncConfigFromStorage();
    renderChatInfo();
    positionPanel();
    setModeState();
    updateLeadMeta();
    await withSyncGuard(fetchWorkspaceData);
    startWatchers();
  };

  void init().catch((error) => {
    if (isInvalidatedContextError(error)) {
      return;
    }
    console.warn("[WACRM] init failed:", error?.message || error);
  });
})();
