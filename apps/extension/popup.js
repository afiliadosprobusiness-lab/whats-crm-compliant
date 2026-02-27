const API_BASE_URL = "http://localhost:4001/api/v1";
const stages = ["new", "contacted", "qualified", "won", "lost"];

const state = {
  token: localStorage.getItem("crm_token") || "",
  authUser: null,
  workspace: null,
  subscription: null,
  leads: [],
  templates: [],
  campaigns: [],
  reminders: [],
};

const crmSections = Array.from(document.querySelectorAll("[data-crm]"));
const feedbackEl = document.getElementById("feedback");
const sessionLabelEl = document.getElementById("session-label");
const subscriptionLabelEl = document.getElementById("subscription-status");

const setFeedback = (text, isError = false) => {
  feedbackEl.textContent = text;
  feedbackEl.className = isError ? "error" : "";
};

const setCrmVisibility = (visible) => {
  crmSections.forEach((section) => {
    section.classList.toggle("is-hidden", !visible);
  });
};

const persistToken = (token) => {
  state.token = token;
  if (token) {
    localStorage.setItem("crm_token", token);
  } else {
    localStorage.removeItem("crm_token");
  }
};

const apiRequest = async (path, options = {}) => {
  const extraHeaders = options.headers || {};
  const authHeaders = state.token ? { Authorization: `Bearer ${state.token}` } : {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

const renderSession = () => {
  if (!state.authUser || !state.workspace) {
    sessionLabelEl.textContent = "Sin sesion";
    return;
  }

  sessionLabelEl.textContent = `${state.authUser.email} | ${state.workspace.companyName}`;
};

const renderSubscription = () => {
  if (!state.subscription) {
    subscriptionLabelEl.textContent = "Sin datos de suscripcion.";
    return;
  }

  const status = state.subscription.subscriptionStatus;
  const end = new Date(state.subscription.currentPeriodEnd).toLocaleDateString();
  const canUse = state.subscription.canUseCrm ? "Activo" : "Vencido";
  subscriptionLabelEl.textContent = `Estado: ${status} (${canUse}) | vence: ${end} | plan: S/${state.subscription.planMonthlyPricePen}`;
};

const renderStats = () => {
  document.getElementById("kpi-leads").textContent = String(state.leads.length);
  document.getElementById("kpi-optin").textContent = String(
    state.leads.filter((lead) => lead.consentStatus === "opted_in").length,
  );
  document.getElementById("kpi-campaigns").textContent = String(state.campaigns.length);
};

const renderTemplates = () => {
  const listEl = document.getElementById("template-list");
  const selectEl = document.getElementById("campaign-template-id");
  listEl.innerHTML = "";
  selectEl.innerHTML = "";

  if (state.templates.length === 0) {
    listEl.innerHTML = "<li>No templates yet.</li>";
    selectEl.innerHTML = "<option value=''>Create a template first</option>";
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

  const optedInLeads = state.leads.filter((lead) => lead.consentStatus === "opted_in");
  if (optedInLeads.length === 0) {
    recipientsEl.innerHTML = "<p>No opted_in leads.</p>";
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
    leadSelectEl.innerHTML = "<option value=''>Create a lead first</option>";
  } else {
    state.leads.forEach((lead) => {
      const option = document.createElement("option");
      option.value = lead.id;
      option.textContent = `${lead.name} (${lead.stage})`;
      leadSelectEl.appendChild(option);
    });
  }

  if (state.reminders.length === 0) {
    listEl.innerHTML = "<li>No reminders.</li>";
    return;
  }

  state.reminders.forEach((reminder) => {
    const lead = state.leads.find((item) => item.id === reminder.leadId);
    const li = document.createElement("li");
    li.textContent = `${new Date(reminder.dueAt).toLocaleString()} | ${
      lead?.name || reminder.leadId
    } | ${reminder.note}`;
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

    const title = document.createElement("h3");
    title.textContent = `${stage} (${leadsInStage.length})`;
    col.appendChild(title);

    if (leadsInStage.length === 0) {
      const empty = document.createElement("span");
      empty.className = "pill";
      empty.textContent = "No leads";
      col.appendChild(empty);
    } else {
      leadsInStage.forEach((lead) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = lead.name;
        col.appendChild(pill);
      });
    }

    pipelineEl.appendChild(col);
  });
};

const refreshSubscription = async () => {
  const data = await apiRequest("/billing/subscription");
  state.subscription = data.subscription || null;
  renderSubscription();
};

const refreshData = async () => {
  const [leadsData, templatesData, campaignsData, remindersData] = await Promise.all([
    apiRequest("/leads"),
    apiRequest("/templates"),
    apiRequest("/campaigns"),
    apiRequest("/reminders"),
  ]);

  state.leads = leadsData.leads || [];
  state.templates = templatesData.templates || [];
  state.campaigns = campaignsData.campaigns || [];
  state.reminders = remindersData.reminders || [];

  renderStats();
  renderTemplates();
  renderRecipients();
  renderReminders();
  renderPipeline();
};

const bootstrapAuthenticated = async () => {
  const me = await apiRequest("/auth/me");
  state.authUser = me.user;
  state.workspace = me.workspace;
  renderSession();

  await refreshSubscription();
  const canUseCrm = Boolean(state.subscription?.canUseCrm);
  setCrmVisibility(canUseCrm);

  if (canUseCrm) {
    await refreshData();
    setFeedback("Sesion activa y CRM habilitado.");
  } else {
    setFeedback("Suscripcion vencida. Renueva para usar el CRM.", true);
  }
};

const resetState = () => {
  persistToken("");
  state.authUser = null;
  state.workspace = null;
  state.subscription = null;
  state.leads = [];
  state.templates = [];
  state.campaigns = [];
  state.reminders = [];
  renderSession();
  renderSubscription();
  setCrmVisibility(false);
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
    setFeedback("Cuenta creada. Sesion iniciada.");
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
    // ignore logout API errors and clear local state anyway
  } finally {
    resetState();
    setFeedback("Sesion cerrada.");
  }
});

document.getElementById("renew-btn").addEventListener("click", async () => {
  try {
    await apiRequest("/billing/renew", {
      method: "POST",
      body: JSON.stringify({ months: 1, amountPen: 50 }),
    });
    await refreshSubscription();
    setCrmVisibility(Boolean(state.subscription?.canUseCrm));
    if (state.subscription?.canUseCrm) {
      await refreshData();
    }
    setFeedback("Suscripcion renovada.");
  } catch (error) {
    setFeedback(error.message || "Renew failed", true);
  }
});

document.getElementById("lead-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const tagsRaw = String(data.get("tags") || "");
  const payload = {
    name: String(data.get("name") || "").trim(),
    phoneE164: String(data.get("phoneE164") || "").trim(),
    consentStatus: String(data.get("consentStatus") || "pending"),
    consentSource: String(data.get("consentSource") || "manual").trim(),
    stage: String(data.get("stage") || "new"),
    tags: tagsRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };

  try {
    await apiRequest("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    setFeedback("Lead saved.");
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
    setFeedback("Template saved.");
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

document.getElementById("campaign-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const recipientLeadIds = Array.from(document.querySelectorAll("input[name='recipientLeadId']:checked")).map(
    (checkbox) => checkbox.value,
  );

  if (recipientLeadIds.length === 0) {
    setFeedback("Select at least one lead.", true);
    return;
  }

  const payload = {
    name: String(data.get("name") || "").trim(),
    templateId: String(data.get("templateId") || "").trim(),
    recipientLeadIds,
  };

  try {
    const created = await apiRequest("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await apiRequest(`/campaigns/${created.campaign.id}/send`, {
      method: "POST",
    });

    form.reset();
    setFeedback("Campaign sent.");
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

  const payload = {
    leadId: String(data.get("leadId") || "").trim(),
    note: String(data.get("note") || "").trim(),
    dueAt: new Date(dueAtRaw).toISOString(),
  };

  try {
    await apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    setFeedback("Reminder created.");
    await refreshData();
  } catch (error) {
    setFeedback(error.message, true);
  }
});

const bootstrap = async () => {
  setCrmVisibility(false);
  renderSession();
  renderSubscription();

  if (!state.token) {
    setFeedback("Inicia sesion para usar el CRM.");
    return;
  }

  try {
    await bootstrapAuthenticated();
  } catch (error) {
    resetState();
    setFeedback(`Sesion invalida: ${error.message}`, true);
  }
};

void bootstrap();

