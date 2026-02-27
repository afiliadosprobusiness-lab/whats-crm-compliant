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
      return;
    }

    state.nodes.leadMetaEl.textContent = `Lead: ${state.currentLead.name} | etapa: ${state.currentLead.stage} | consentimiento: ${state.currentLead.consentStatus}`;
    state.nodes.noteBtn.disabled = false;
    state.nodes.stageBtn.disabled = false;
    state.nodes.reminderBtn.disabled = false;
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
      setModeState();
      updateLeadMeta();
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
    syncLeadWithPhone();
    setModeState();
    setStatus(`CRM activo para ${state.me?.email || "workspace actual"}.`);
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

    const tagsRaw = String(state.nodes.tagsInput?.value || "");
    const payload = {
      name,
      phoneE164: phone,
      consentStatus: state.nodes.consentSelect?.value || "pending",
      consentSource: "whatsapp_web_manual",
      stage: state.nodes.stageSelect?.value || "new",
      tags: tagsRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    await apiRequest("/leads", { method: "POST", body: JSON.stringify(payload) });
    setStatus("Lead guardado.");
    await fetchWorkspaceData();
  };

  const updateLeadStage = async () => {
    if (!state.currentLead) {
      setStatus("No hay lead asociado para actualizar etapa.", true);
      return;
    }

    const stage = state.nodes.stageSelect?.value || state.currentLead.stage;
    await apiRequest(`/leads/${state.currentLead.id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    setStatus("Etapa actualizada.");
    await fetchWorkspaceData();
  };

  const addLeadNote = async () => {
    if (!state.currentLead) {
      setStatus("No hay lead asociado para agregar nota.", true);
      return;
    }

    const note = String(state.nodes.noteInput?.value || "").trim();
    if (!note) {
      setStatus("Escribe una nota antes de guardar.", true);
      return;
    }

    await apiRequest(`/leads/${state.currentLead.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    state.nodes.noteInput.value = "";
    setStatus("Nota guardada.");
    await fetchWorkspaceData();
  };

  const addReminder = async () => {
    if (!state.currentLead) {
      setStatus("No hay lead asociado para crear recordatorio.", true);
      return;
    }

    const note = String(state.nodes.reminderNoteInput?.value || "").trim();
    const dueAtLocal = String(state.nodes.reminderDateInput?.value || "").trim();
    const dueAtIso = new Date(dueAtLocal).toISOString();
    if (!note || !dueAtLocal || Number.isNaN(new Date(dueAtLocal).getTime())) {
      setStatus("Completa nota y fecha valida para el recordatorio.", true);
      return;
    }

    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify({
        leadId: state.currentLead.id,
        note,
        dueAt: dueAtIso,
      }),
    });
    state.nodes.reminderNoteInput.value = "";
    setStatus("Recordatorio creado.");
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
          <span class="wacrm-title">CRM WhatsApp</span>
          <button type="button" class="wacrm-minify" id="wacrm-toggle">Minimizar</button>
        </div>
        <div class="wacrm-body" id="wacrm-body">
          <p class="wacrm-status" id="wacrm-status">Inicializando CRM...</p>
          <div class="wacrm-block" id="wacrm-gate"></div>
          <div class="wacrm-grid wacrm-hidden" id="wacrm-tools">
            <div class="wacrm-block">
              <h4>Chat actual</h4>
              <p class="wacrm-meta" id="wacrm-chat-meta">Abre una conversacion para gestionar.</p>
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
              <div class="wacrm-actions">
                <button type="button" class="wacrm-btn" id="wacrm-save-lead">Guardar lead</button>
                <button type="button" class="wacrm-btn ghost" id="wacrm-refresh">Refrescar</button>
                <button type="button" class="wacrm-btn secondary" id="wacrm-update-stage">Actualizar etapa</button>
              </div>
              <p class="wacrm-meta" id="wacrm-lead-meta">Sin lead asociado al chat actual.</p>
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
    state.nodes.nameInput = root.querySelector("#wacrm-name");
    state.nodes.phoneInput = root.querySelector("#wacrm-phone");
    state.nodes.stageSelect = root.querySelector("#wacrm-stage");
    state.nodes.consentSelect = root.querySelector("#wacrm-consent");
    state.nodes.tagsInput = root.querySelector("#wacrm-tags");
    state.nodes.leadMetaEl = root.querySelector("#wacrm-lead-meta");
    state.nodes.templateSelect = root.querySelector("#wacrm-template");
    state.nodes.noteInput = root.querySelector("#wacrm-note");
    state.nodes.reminderDateInput = root.querySelector("#wacrm-reminder-date");
    state.nodes.reminderNoteInput = root.querySelector("#wacrm-reminder-note");
    state.nodes.noteBtn = root.querySelector("#wacrm-save-note");
    state.nodes.stageBtn = root.querySelector("#wacrm-update-stage");
    state.nodes.reminderBtn = root.querySelector("#wacrm-save-reminder");

    LEAD_STAGES.forEach((stage) => {
      const option = document.createElement("option");
      option.value = stage;
      option.textContent = stage;
      state.nodes.stageSelect.appendChild(option);
    });
    CONSENT_STATES.forEach((consent) => {
      const option = document.createElement("option");
      option.value = consent;
      option.textContent = consent;
      state.nodes.consentSelect.appendChild(option);
    });
    state.nodes.consentSelect.value = "opted_in";

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
