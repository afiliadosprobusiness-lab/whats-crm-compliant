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
  ];
  const LEAD_STAGES = ["new", "contacted", "qualified", "won", "lost"];
  const CONSENT_STATES = ["opted_in", "pending", "opted_out"];
  const CRM_BUILD_TAG = "0.3.0-2026-02-27";
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
    currentLead: null,
    currentChat: null,
    collapsed: false,
    syncing: false,
    syncTimer: null,
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

  const setStatus = (text, isError = false) => {
    if (!state.nodes.statusEl) {
      return;
    }
    state.nodes.statusEl.textContent = text;
    state.nodes.statusEl.classList.toggle("error", isError);
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
      gateEl.textContent = "Tu suscripcion CRM no esta activa. Renuevala desde la extension.";
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
      if (state.nodes.quickFollowupBtn) {
        state.nodes.quickFollowupBtn.disabled = true;
      }
      return;
    }

    const tagsText = Array.isArray(state.currentLead.tags) && state.currentLead.tags.length > 0
      ? state.currentLead.tags.join(", ")
      : "-";
    state.nodes.leadMetaEl.textContent = `Lead: ${state.currentLead.name} | etapa: ${state.currentLead.stage} | tags: ${tagsText}`;
    state.nodes.noteBtn.disabled = false;
    state.nodes.stageBtn.disabled = false;
    state.nodes.reminderBtn.disabled = false;
    if (state.nodes.quickFollowupBtn) {
      state.nodes.quickFollowupBtn.disabled = false;
    }
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
      state.currentLead = null;
      renderTemplates();
      fillProfileForm(null);
      setModeState();
      updateLeadMeta();
      updatePipelineMeta();
      return;
    }

    const meData = await apiRequest("/auth/me");
    const billingData = await apiRequest("/billing/subscription");
    state.me = meData.user || null;
    state.subscription = billingData.subscription || null;
    state.canUseCrm = Boolean(state.subscription?.canUseCrm);

    if (!state.canUseCrm) {
      setModeState();
      setStatus("Sesion activa, pero suscripcion inactiva.", true);
      return;
    }

    const [templatesData, leadsData] = await Promise.all([
      apiRequest("/templates"),
      apiRequest("/leads"),
    ]);
    state.templates = templatesData.templates || [];
    state.leads = leadsData.leads || [];
    renderTemplates();
    updatePipelineMeta();
    syncLeadWithPhone();
    setModeState();
    setStatus(`CRM inmobiliario activo para ${state.me?.email || "workspace actual"}.`);
  };

  const insertTemplateIntoComposer = () => {
    const templateId = state.nodes.templateSelect?.value || "";
    const template = state.templates.find((item) => item.id === templateId);
    if (!template) {
      setStatus("Selecciona una plantilla valida.", true);
      return;
    }

    const composer = getComposerEl();
    if (!composer) {
      setStatus("No se encontro el cuadro de mensaje en WhatsApp Web.", true);
      return;
    }

    const contactName = state.nodes.nameInput?.value?.trim() || state.currentChat?.name || "cliente";
    const message = String(template.body || "").replace(/\{\{\s*name\s*\}\}/gi, contactName);

    composer.focus();
    composer.textContent = message;
    composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: message }));
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
    }
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
    setStatus("Recordatorio creado.");
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
    setStatus("Seguimiento rapido creado.");
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
          <div class="wacrm-block" id="wacrm-gate"></div>
          <div class="wacrm-grid wacrm-hidden" id="wacrm-tools">
            <div class="wacrm-block">
              <h4>Chat actual</h4>
              <p class="wacrm-meta" id="wacrm-chat-meta">Abre una conversacion para gestionar.</p>
              <p class="wacrm-meta" id="wacrm-pipeline-meta">Pipeline: new:0 | contacted:0 | qualified:0 | won:0 | lost:0</p>
            </div>
            <div class="wacrm-block">
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
            <div class="wacrm-block">
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
            <div class="wacrm-block">
              <h4>Plantilla en chat</h4>
              <label class="wacrm-label">Plantilla
                <select class="wacrm-select" id="wacrm-template"></select>
              </label>
              <button type="button" class="wacrm-btn secondary" id="wacrm-insert-template">Insertar en caja de mensaje</button>
              <p class="wacrm-meta">No envia automaticamente. Solo inserta texto para envio manual.</p>
            </div>
            <div class="wacrm-block">
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
    state.nodes.gateEl = root.querySelector("#wacrm-gate");
    state.nodes.toolsEl = root.querySelector("#wacrm-tools");
    state.nodes.chatEl = root.querySelector("#wacrm-chat-meta");
    state.nodes.pipelineMetaEl = root.querySelector("#wacrm-pipeline-meta");
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

    root.querySelector("#wacrm-toggle").addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      state.nodes.bodyEl.classList.toggle("wacrm-hidden", state.collapsed);
      root.querySelector("#wacrm-toggle").textContent = state.collapsed ? "Expandir" : "Minimizar";
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
    root.querySelector("#wacrm-save-note").addEventListener("click", () => {
      void withSyncGuard(addLeadNote);
    });
    root.querySelector("#wacrm-save-reminder").addEventListener("click", () => {
      void withSyncGuard(addReminder);
    });
    root.querySelector("#wacrm-quick-followup").addEventListener("click", () => {
      void withSyncGuard(createQuickFollowup);
    });

    state.nodes.phoneInput.addEventListener("input", () => {
      syncLeadWithPhone();
    });
  };

  const syncConfigFromStorage = async () => {
    const values = await storageGet(STORAGE_KEYS);
    state.apiBaseUrl = String(values.crm_api_base_url || "").trim() || DEFAULT_API_BASE_URL;
    state.token = String(values.crm_token || "").trim();
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
    await syncConfigFromStorage();
    renderChatInfo();
    setModeState();
    updateLeadMeta();
    await withSyncGuard(fetchWorkspaceData);
    startWatchers();
  };

  void init();
})();
