(() => {
  if (window.__wacrmInjected) {
    return;
  }
  window.__wacrmInjected = true;

  const DEFAULT_API_BASE_URL = "https://whats-crm-compliant.vercel.app/api/v1";
  const STORAGE_KEYS = [
    "crm_api_base_url",
    "crm_token",
    "crm_google_client_id",
    "crm_firebase_web_api_key",
    "crm_tutorial_progress_v1",
    "crm_followup_usage_v1",
  ];
  const FOLLOWUP_USAGE_KEY = "crm_followup_usage_v1";
  const FOLLOWUP_DAILY_LIMIT = 20;
  const FOLLOWUP_USAGE_RETENTION_DAYS = 45;
  const LEAD_STAGES = ["new", "contacted", "qualified", "won", "lost"];
  const CONSENT_STATES = ["opted_in", "pending", "opted_out"];
  const CRM_BUILD_TAG = "0.4.3-2026-02-27";
  const TUTORIAL_PROGRESS_KEY = "crm_tutorial_progress_v1";
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
      label: "Completar ficha inmobiliaria",
      hint: "Define operacion, tipo, zona, presupuesto y urgencia.",
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
  const SUGGESTED_TAGS = [
    "comprador",
    "propietario",
    "inversionista",
    "alquiler",
    "venta",
    "departamento",
    "casa",
    "terreno",
    "credito",
    "urgente",
  ];
  const STAGE_SHORTCUTS = [
    { label: "Nuevo", stage: "new", note: "Lead registrado en CRM." },
    { label: "Contactado", stage: "contacted", note: "Contacto inicial realizado." },
    { label: "Visita", stage: "qualified", note: "Visita agendada para este lead." },
    { label: "Oferta", stage: "qualified", note: "Lead solicita propuesta/oferta." },
    { label: "Cierre", stage: "won", note: "Lead marcado como cierre exitoso." },
    { label: "Perdido", stage: "lost", note: "Lead descartado por ahora." },
  ];
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

  const hasChromeStorage = typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
  const state = {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    token: "",
    me: null,
    subscription: null,
    canUseCrm: false,
    templates: [],
    leads: [],
    reminders: [],
    currentLead: null,
    currentChat: null,
    activeSection: "overview",
    dockOpen: false,
    collapsed: false,
    syncing: false,
    syncTimer: null,
    tutorialProgress: {},
    nodes: {},
  };

  const storageGet = async (keys) => {
    if (!hasChromeStorage) {
      return {};
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result || {}));
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
      throw new Error(await parseApiError(response));
    }

    return response.json().catch(() => ({}));
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
    if (!hasChromeStorage) {
      return;
    }

    await new Promise((resolve) => {
      chrome.storage.local.set(payload, resolve);
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
    tagLists.flat().forEach((tag) => {
      const clean = slugTag(tag);
      if (clean) {
        unique.add(clean);
      }
    });
    return Array.from(unique).slice(0, 8);
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
    if (state.nodes.tagsInput) state.nodes.tagsInput.value = (lead.tags || []).join(", ");
    fillProfileForm(parseProfileNote(lead));
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
        <span class="wacrm-hot-meta">${item.lead.stage} | ${item.lead.phoneE164 || "-"}</span>
      `;
      button.addEventListener("click", () => fillLeadIntoForm(item.lead));
      listEl.appendChild(button);
    });
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

  const setActiveSection = (section) => {
    const allowed = new Set(["overview", "lead", "actions", "tutorial", "all"]);
    const nextSection = allowed.has(section) ? section : "overview";
    state.activeSection = nextSection;

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

  const setModeState = () => {
    const gateEl = state.nodes.gateEl;
    const toolsEl = state.nodes.toolsEl;
    if (!gateEl || !toolsEl) {
      return;
    }

    if (!getWhatsAppLoggedIn()) {
      gateEl.textContent = "Inicia sesion en WhatsApp Web para habilitar el CRM.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      return;
    }

    if (!state.token) {
      gateEl.textContent = "Inicia sesion en la extension para activar el CRM.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      return;
    }

    if (!state.canUseCrm) {
      gateEl.textContent = "Tu suscripcion CRM no esta activa. Solicita activacion al administrador.";
      gateEl.classList.remove("wacrm-hidden");
      toolsEl.classList.add("wacrm-hidden");
      return;
    }

    gateEl.classList.add("wacrm-hidden");
    toolsEl.classList.remove("wacrm-hidden");
  };

  const updateLeadMeta = () => {
    if (!state.nodes.leadMetaEl) {
      return;
    }

    if (!state.currentLead) {
      state.nodes.leadMetaEl.textContent = "Sin lead asociado al chat actual.";
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
    state.nodes.leadMetaEl.textContent = `Lead: ${state.currentLead.name} | etapa: ${state.currentLead.stage} | tags: ${tagsText}`;
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
      if (state.nodes.tagsInput) {
        state.nodes.tagsInput.value = (state.currentLead.tags || []).join(", ");
      }
      fillProfileForm(parseProfileNote(state.currentLead));
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
    SUGGESTED_TAGS.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wacrm-chip";
      button.textContent = tag;
      button.addEventListener("click", () => appendTagToInput(tag));
      container.appendChild(button);
    });
  };

  const renderStageShortcuts = () => {
    const container = state.nodes.stageShortcutsEl;
    if (!container) {
      return;
    }
    container.innerHTML = "";
    STAGE_SHORTCUTS.forEach((shortcut) => {
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
  };

  const fetchWorkspaceData = async () => {
    if (!state.token) {
      state.me = null;
      state.subscription = null;
      state.canUseCrm = false;
      state.templates = [];
      state.leads = [];
      state.reminders = [];
      state.currentLead = null;
      renderTemplates();
      fillProfileForm(null);
      renderHotLeads();
      setModeState();
      updateLeadMeta();
      updatePipelineMeta();
      await refreshFollowupMeta();
      return;
    }

    const meData = await apiRequest("/auth/me");
    const billingData = await apiRequest("/billing/subscription");
    state.me = meData.user || null;
    state.subscription = billingData.subscription || null;
    state.canUseCrm = Boolean(state.subscription?.canUseCrm);

    if (!state.canUseCrm) {
      state.templates = [];
      state.leads = [];
      state.reminders = [];
      state.currentLead = null;
      renderTemplates();
      renderHotLeads();
      updateLeadMeta();
      updatePipelineMeta();
      setModeState();
      await refreshFollowupMeta();
      setStatus("Sesion activa, pero suscripcion inactiva.", true);
      return;
    }

    const [templatesData, leadsData, remindersData] = await Promise.all([
      apiRequest("/templates"),
      apiRequest("/leads"),
      apiRequest("/reminders"),
    ]);
    state.templates = templatesData.templates || [];
    state.leads = leadsData.leads || [];
    state.reminders = remindersData.reminders || [];
    renderTemplates();
    updatePipelineMeta();
    renderHotLeads();
    syncLeadWithPhone();
    await refreshFollowupMeta();
    setModeState();
    setStatus(`CRM inmobiliario activo para ${state.me?.email || "workspace actual"}.`);
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
    const profile = getProfileFromForm();
    const derivedTags = buildProfileDerivedTags(profile);
    const tags = mergeTags(tagsRaw, derivedTags);
    const payload = {
      name,
      phoneE164: phone,
      consentStatus: state.nodes.consentSelect?.value || "pending",
      consentSource: "whatsapp_web_manual",
      stage: state.nodes.stageSelect?.value || "new",
      tags,
    };

    const result = await apiRequest("/leads/upsert", { method: "POST", body: JSON.stringify(payload) });
    const leadId = result?.lead?.id;
    if (leadId && hasProfileData(profile)) {
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

  const updateLeadStage = async () => {
    const lead = await ensureCurrentLead();

    const stage = state.nodes.stageSelect?.value || lead.stage;
    await apiRequest(`/leads/${lead.id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    void markTutorialStep("set_stage");
    setStatus("Etapa actualizada.");
    await fetchWorkspaceData();
  };

  const applyStageShortcut = async (shortcut) => {
    const lead = await ensureCurrentLead();
    await apiRequest(`/leads/${lead.id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage: shortcut.stage }),
    });
    if (shortcut.note) {
      await apiRequest(`/leads/${lead.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ note: shortcut.note }),
      });
    }
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
    if (state.nodes.followupHoursInput) {
      state.nodes.followupHoursInput.value = String(hours);
    }

    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify({
        leadId: lead.id,
        note: `Seguimiento inmobiliario (${hours}h)`,
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
    try {
      await task();
    } catch (error) {
      setStatus(error?.message || "Error inesperado.", true);
    } finally {
      state.syncing = false;
      setModeState();
    }
  };

  const createDock = () => {
    const dock = document.createElement("aside");
    dock.id = "wacrm-dock";
    dock.innerHTML = `
      <button type="button" class="wacrm-dock-toggle" id="wacrm-dock-toggle" title="Abrir menu CRM">CRM</button>
      <div class="wacrm-dock-menu" id="wacrm-dock-menu">
        <button type="button" class="wacrm-dock-item active" data-section="overview" title="Inicio">H</button>
        <button type="button" class="wacrm-dock-item" data-section="lead" title="Leads">L</button>
        <button type="button" class="wacrm-dock-item" data-section="actions" title="Acciones">A</button>
        <button type="button" class="wacrm-dock-item" data-section="tutorial" title="Tutorial">T</button>
        <button type="button" class="wacrm-dock-item" data-section="all" title="Todo">+</button>
      </div>
    `;
    document.body.appendChild(dock);

    state.nodes.dock = dock;
    state.nodes.dockMenu = dock.querySelector("#wacrm-dock-menu");
    state.nodes.dockToggle = dock.querySelector("#wacrm-dock-toggle");
    state.nodes.dockButtons = Array.from(dock.querySelectorAll("[data-section]"));
    state.nodes.dockToggle?.addEventListener("click", () => {
      state.dockOpen = !state.dockOpen;
      state.nodes.dock?.classList.toggle("open", state.dockOpen);
    });
    state.nodes.dockButtons.forEach((button) => {
      button.addEventListener("click", () => {
        openSectionFromMenu(button.dataset.section || "overview");
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
          <span class="wacrm-title">CRM WhatsApp ${CRM_BUILD_TAG}</span>
          <button type="button" class="wacrm-minify" id="wacrm-toggle">Minimizar</button>
        </div>
        <div class="wacrm-body" id="wacrm-body">
          <p class="wacrm-status" id="wacrm-status">Inicializando CRM...</p>
          <div class="wacrm-tabs" id="wacrm-tabs">
            <button type="button" class="wacrm-tab active" data-section="overview">Inicio</button>
            <button type="button" class="wacrm-tab" data-section="lead">Leads</button>
            <button type="button" class="wacrm-tab" data-section="actions">Acciones</button>
            <button type="button" class="wacrm-tab" data-section="tutorial">Tutorial</button>
          </div>
          <div class="wacrm-block" id="wacrm-gate"></div>
          <div class="wacrm-grid wacrm-hidden" id="wacrm-tools">
            <div class="wacrm-block" data-section="overview">
              <h4>Chat actual</h4>
              <p class="wacrm-meta" id="wacrm-chat-meta">Abre una conversacion para gestionar.</p>
              <p class="wacrm-meta" id="wacrm-pipeline-meta">Pipeline: new:0 | contacted:0 | qualified:0 | won:0 | lost:0</p>
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
            <div class="wacrm-block" data-section="lead">
              <h4>Lead rapido</h4>
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
              <label class="wacrm-label">Tags (coma)<input class="wacrm-input" id="wacrm-tags" placeholder="nuevo, premium" /></label>
              <div class="wacrm-chip-row" id="wacrm-tag-suggestions"></div>
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn" id="wacrm-save-lead">Guardar lead</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-refresh">Refrescar</button>
                <button type="button" class="wacrm-btn secondary" id="wacrm-update-stage">Actualizar etapa</button>
              </div>
              <p class="wacrm-meta">Atajos de pipeline</p>
              <div class="wacrm-actions" id="wacrm-stage-shortcuts"></div>
              <p class="wacrm-meta" id="wacrm-lead-meta">Sin lead asociado al chat actual.</p>
            </div>
            <div class="wacrm-block" data-section="lead">
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
    state.nodes.tutorialSummaryEl = root.querySelector("#wacrm-tutorial-summary");
    state.nodes.tutorialListEl = root.querySelector("#wacrm-tutorial-list");
    state.nodes.hotLeadsMetaEl = root.querySelector("#wacrm-hot-meta");
    state.nodes.hotLeadsEl = root.querySelector("#wacrm-hot-leads");
    state.nodes.nameInput = root.querySelector("#wacrm-name");
    state.nodes.phoneInput = root.querySelector("#wacrm-phone");
    state.nodes.stageSelect = root.querySelector("#wacrm-stage");
    state.nodes.consentSelect = root.querySelector("#wacrm-consent");
    state.nodes.tagsInput = root.querySelector("#wacrm-tags");
    state.nodes.tagSuggestionsEl = root.querySelector("#wacrm-tag-suggestions");
    state.nodes.stageShortcutsEl = root.querySelector("#wacrm-stage-shortcuts");
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
    renderTagSuggestions();
    renderStageShortcuts();
    renderTutorial();
    renderHotLeads();

    root.querySelector("#wacrm-toggle").addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      state.nodes.bodyEl.classList.toggle("wacrm-hidden", state.collapsed);
      root.querySelector("#wacrm-toggle").textContent = state.collapsed ? "Expandir" : "Minimizar";
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
    root.querySelector("#wacrm-reset-tutorial").addEventListener("click", () => {
      void resetTutorial();
    });

    state.nodes.phoneInput.addEventListener("input", () => {
      syncLeadWithPhone();
    });
    void refreshFollowupMeta();
    setActiveSection(state.activeSection);
  };

  const syncConfigFromStorage = async () => {
    const values = await storageGet(STORAGE_KEYS);
    state.apiBaseUrl = String(values.crm_api_base_url || "").trim() || DEFAULT_API_BASE_URL;
    state.token = String(values.crm_token || "").trim();
    state.tutorialProgress = normalizeTutorialProgress(values[TUTORIAL_PROGRESS_KEY]);
    renderTutorial();
  };

  const startWatchers = () => {
    if (hasChromeStorage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
          return;
        }

        let mustReload = false;
        if (changes.crm_api_base_url) {
          state.apiBaseUrl = String(changes.crm_api_base_url.newValue || "").trim() || DEFAULT_API_BASE_URL;
          mustReload = true;
        }
        if (changes.crm_token) {
          state.token = String(changes.crm_token.newValue || "").trim();
          mustReload = true;
        }

        if (mustReload) {
          void withSyncGuard(fetchWorkspaceData);
        }
      });
    }

    state.syncTimer = window.setInterval(() => {
      renderChatInfo();
      setModeState();
    }, 2500);
  };

  const init = async () => {
    createPanel();
    createDock();
    setActiveSection(state.activeSection);
    await syncConfigFromStorage();
    renderChatInfo();
    setModeState();
    updateLeadMeta();
    await withSyncGuard(fetchWorkspaceData);
    startWatchers();
  };

  void init();
})();
