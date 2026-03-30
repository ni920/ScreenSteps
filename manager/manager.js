const STORAGE_KEY = "uiRecorderState";
const pageTitle = document.getElementById("pageTitle");
const pageLead = document.getElementById("pageLead");
const refreshButton = document.getElementById("refreshButton");
const recordingCountLabel = document.getElementById("recordingCountLabel");
const stepTotalLabel = document.getElementById("stepTotalLabel");
const statusStatLabel = document.getElementById("statusStatLabel");
const recordingCount = document.getElementById("recordingCount");
const stepTotal = document.getElementById("stepTotal");
const statusLabel = document.getElementById("statusLabel");
const messageBox = document.getElementById("message");
const recordingsList = document.getElementById("recordingsList");
const activeSection = document.getElementById("activeSection");
const activeSectionTitle = document.getElementById("activeSectionTitle");
const archiveSectionTitle = document.getElementById("archiveSectionTitle");
const activeRecording = document.getElementById("activeRecording");
const uiLanguageLabel = document.getElementById("uiLanguageLabel");
const uiLanguageSelect = document.getElementById("uiLanguageSelect");
const recordingLanguageLabel = document.getElementById("recordingLanguageLabel");
const recordingLanguageSelect = document.getElementById("recordingLanguageSelect");
const viewLabel = document.getElementById("viewLabel");
const viewButtonsGroup = document.getElementById("viewButtonsGroup");
const detailViewButton = document.getElementById("detailViewButton");
const listViewButton = document.getElementById("listViewButton");
const gridViewButton = document.getElementById("gridViewButton");
const editorSection = document.getElementById("editorSection");
const editorTitle = document.getElementById("editorTitle");
const editorCopy = document.getElementById("editorCopy");
const recordingTitleLabel = document.getElementById("recordingTitleLabel");
const recordingTitleInput = document.getElementById("recordingTitleInput");
const editorSteps = document.getElementById("editorSteps");
const saveEditButton = document.getElementById("saveEditButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const UI_COPY = {
  de: {
    documentTitle: "ScreenSteps Verwaltung",
    pageTitle: "Aufnahmeverwaltung",
    pageLead: "Alle gespeicherten Recordings an einem Ort. Exportiere, pruefe oder lösche sie direkt hier.",
    refresh: "Aktualisieren",
    recordingCountLabel: "Gespeicherte Recordings",
    stepTotalLabel: "Gesamte Schritte",
    statusStatLabel: "Aktiver Status",
    statusReady: "Bereit",
    statusActive: "Recording aktiv",
    uiLanguageLabel: "Sprache der Erweiterung",
    recordingLanguageLabel: "Dokumentationssprache fuer neue Aufnahmen",
    viewLabel: "Ansicht",
    viewGroupLabel: "Ansichtsmodus",
    detail: "Detail",
    list: "Liste",
    grid: "Raster",
    editorTitle: "Recording bearbeiten",
    editorCopy: "Passe Titel, Schritttexte und Reihenfolge an und speichere die Version direkt im Archiv.",
    close: "Schliessen",
    save: "Speichern",
    titleLabel: "Titel",
    titlePlaceholder: "Aufnahmetitel",
    activeSectionTitle: "Aktive Aufnahme",
    archiveSectionTitle: "Archiv",
    previewAlt: "Preview fuer",
    noPreview: "Noch kein Vorschaubild vorhanden",
    activeBadge: "Aktiv",
    stepBadge: (count, language) => `${count} Schritte · ${language}`,
    metaStart: "Start",
    metaEnd: "Ende",
    metaLastUrl: "Letzte URL",
    metaLanguage: "Sprache",
    edit: "Bearbeiten",
    markdown: "Markdown ZIP",
    html: "HTML ZIP",
    confluence: "Confluence Export",
    pdf: "PDF",
    delete: "Löschen",
    emptyRecordings: "Noch keine gespeicherten Recordings vorhanden.",
    editorEmpty: "Dieses Recording enthaelt aktuell keine Schritte.",
    stepImageAlt: (step) => `Schritt ${step}`,
    editorStepTitle: (step, action) => `Schritt ${step} · ${action}`,
    moveUp: "Hoch",
    moveDown: "Runter",
    descriptionLabel: "Beschreibung",
    labelLabel: "Label",
    valueLabel: "Wert",
    stepStatusLabel: "Status",
    stepStatusEnabled: "aktiviert",
    stepStatusDisabled: "deaktiviert",
    recordingNotFound: "Recording wurde nicht gefunden.",
    unknownError: "Unbekannter Fehler.",
    recordingLanguageUpdated: "Standardsprache fuer neue Aufnahmen aktualisiert.",
    uiLanguageUpdated: "Sprache der Erweiterung aktualisiert.",
    recordingSaved: "Recording wurde gespeichert.",
    markdownDownloaded: (name) => `Markdown-ZIP '${name}' wurde in Downloads angelegt.`,
    htmlDownloaded: (name) => `HTML-ZIP '${name}' wurde in Downloads angelegt.`,
    confluenceDownloaded: (name) => `Confluence-Export '${name}' wurde in Downloads angelegt.`,
    pdfOpened: "Druckansicht geoeffnet. Im Dialog kannst du Als PDF speichern.",
    recordingDeleted: "Recording wurde gelöscht.",
    managerRefreshed: "Verwaltung aktualisiert.",
    managerLoadFailed: "Die Verwaltung konnte nicht geladen werden."
  },
  en: {
    documentTitle: "ScreenSteps manager",
    pageTitle: "Recording manager",
    pageLead: "All saved recordings in one place. Export, review, or delete them here.",
    refresh: "Refresh",
    recordingCountLabel: "Saved recordings",
    stepTotalLabel: "Total steps",
    statusStatLabel: "Current status",
    statusReady: "Ready",
    statusActive: "Recording active",
    uiLanguageLabel: "Extension language",
    recordingLanguageLabel: "Documentation language for new recordings",
    viewLabel: "View",
    viewGroupLabel: "View mode",
    detail: "Detail",
    list: "List",
    grid: "Grid",
    editorTitle: "Edit recording",
    editorCopy: "Adjust the title, step text, and order, then save the updated version directly to the archive.",
    close: "Close",
    save: "Save",
    titleLabel: "Title",
    titlePlaceholder: "Recording title",
    activeSectionTitle: "Active recording",
    archiveSectionTitle: "Archive",
    previewAlt: "Preview for",
    noPreview: "No preview available yet",
    activeBadge: "Active",
    stepBadge: (count, language) => `${count} steps · ${language}`,
    metaStart: "Started",
    metaEnd: "Ended",
    metaLastUrl: "Last URL",
    metaLanguage: "Language",
    edit: "Edit",
    markdown: "Markdown ZIP",
    html: "HTML ZIP",
    confluence: "Confluence Export",
    pdf: "PDF",
    delete: "Delete",
    emptyRecordings: "No saved recordings yet.",
    editorEmpty: "This recording currently has no steps.",
    stepImageAlt: (step) => `Step ${step}`,
    editorStepTitle: (step, action) => `Step ${step} · ${action}`,
    moveUp: "Up",
    moveDown: "Down",
    descriptionLabel: "Description",
    labelLabel: "Label",
    valueLabel: "Value",
    stepStatusLabel: "Status",
    stepStatusEnabled: "enabled",
    stepStatusDisabled: "disabled",
    recordingNotFound: "Recording could not be found.",
    unknownError: "Unknown error.",
    recordingLanguageUpdated: "Default language for new recordings updated.",
    uiLanguageUpdated: "Extension language updated.",
    recordingSaved: "Recording saved.",
    markdownDownloaded: (name) => `Markdown ZIP '${name}' was saved to Downloads.`,
    htmlDownloaded: (name) => `HTML ZIP '${name}' was saved to Downloads.`,
    confluenceDownloaded: (name) => `Confluence export '${name}' was saved to Downloads.`,
    pdfOpened: "Print preview opened. Use the dialog to save as PDF.",
    recordingDeleted: "Recording deleted.",
    managerRefreshed: "Manager refreshed.",
    managerLoadFailed: "The manager could not be loaded."
  }
};

let latestLibrary = null;
let latestManagerView = "detail";
let editingDraft = null;

function normalizeLanguage(language) {
  return language === "en" ? "en" : "de";
}

function normalizeManagerView(view) {
  return view === "list" || view === "grid" ? view : "detail";
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function getUiLanguage(source = latestLibrary) {
  return normalizeLanguage(source?.preferences?.ui_language || source?.preferences?.recording_language);
}

function getCopy(source = latestLibrary) {
  return UI_COPY[getUiLanguage(source)];
}

function t(key, ...args) {
  const value = getCopy()[key];
  return typeof value === "function" ? value(...args) : value;
}

function getLocale() {
  return getUiLanguage() === "en" ? "en-US" : "de-DE";
}

function setMessage(text, isError = false) {
  messageBox.textContent = text || "";
  messageBox.classList.toggle("error", Boolean(isError));
}

function applyStaticUi(library = latestLibrary) {
  const copy = getCopy(library);
  const uiLanguage = getUiLanguage(library);

  document.documentElement.lang = uiLanguage;
  document.title = copy.documentTitle;
  pageTitle.textContent = copy.pageTitle;
  pageLead.textContent = copy.pageLead;
  refreshButton.textContent = copy.refresh;
  recordingCountLabel.textContent = copy.recordingCountLabel;
  stepTotalLabel.textContent = copy.stepTotalLabel;
  statusStatLabel.textContent = copy.statusStatLabel;
  uiLanguageLabel.textContent = copy.uiLanguageLabel;
  recordingLanguageLabel.textContent = copy.recordingLanguageLabel;
  viewLabel.textContent = copy.viewLabel;
  viewButtonsGroup.setAttribute("aria-label", copy.viewGroupLabel);
  detailViewButton.textContent = copy.detail;
  listViewButton.textContent = copy.list;
  gridViewButton.textContent = copy.grid;
  editorTitle.textContent = copy.editorTitle;
  editorCopy.textContent = copy.editorCopy;
  cancelEditButton.textContent = copy.close;
  saveEditButton.textContent = copy.save;
  recordingTitleLabel.textContent = copy.titleLabel;
  recordingTitleInput.placeholder = copy.titlePlaceholder;
  activeSectionTitle.textContent = copy.activeSectionTitle;
  archiveSectionTitle.textContent = copy.archiveSectionTitle;

  uiLanguageSelect.options[0].textContent = window.UiRecorderExportUtils.getLanguageLabel("de", uiLanguage);
  uiLanguageSelect.options[1].textContent = window.UiRecorderExportUtils.getLanguageLabel("en", uiLanguage);
  recordingLanguageSelect.options[0].textContent = window.UiRecorderExportUtils.getLanguageLabel("de", uiLanguage);
  recordingLanguageSelect.options[1].textContent = window.UiRecorderExportUtils.getLanguageLabel("en", uiLanguage);
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

function shortenUrl(value) {
  if (!value) {
    return "-";
  }

  try {
    const parsed = new URL(value);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return value;
  }
}

function formatLanguage(language) {
  return window.UiRecorderExportUtils.getLanguageLabel(language, getUiLanguage());
}

function getPreview(recording) {
  const stepWithImage = (recording?.steps || []).find((step) => step.screenshot);
  if (!stepWithImage) {
    return null;
  }

  return (recording.screenshots || []).find((image) => image.name === stepWithImage.screenshot) || null;
}

function getScreenshotForStep(recording, step) {
  if (!recording || !step?.screenshot) {
    return null;
  }

  return (recording.screenshots || []).find((image) => image.name === step.screenshot) || null;
}

function createButton(label, className, onClick) {
  const button = document.createElement("button");
  button.className = `button ${className}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function createMetaItem(label, value) {
  const wrapper = document.createElement("div");
  const heading = document.createElement("span");
  heading.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = value;
  wrapper.append(heading, strong);
  return wrapper;
}

function findRecording(recordingId) {
  return latestLibrary?.recordings?.find((recording) => recording.id === recordingId) || null;
}

function setEditingState(recording) {
  editingDraft = recording ? clonePlain(recording) : null;
}

function updateEditingCardState() {
  const editingId = editingDraft?.id || "";
  for (const card of recordingsList.querySelectorAll(".recording-card")) {
    card.classList.toggle("is-editing", card.dataset.recordingId === editingId);
  }
}

function buildRecordingCard(recording, options = {}) {
  const { isActive = false } = options;
  const preview = getPreview(recording);
  const card = document.createElement("article");
  card.className = "recording-card";
  card.dataset.recordingId = recording.id;
  card.classList.toggle("is-editing", editingDraft?.id === recording.id);

  if (preview?.data_url) {
    const image = document.createElement("img");
    image.className = "recording-preview";
    image.src = preview.data_url;
    image.alt = `${t("previewAlt")} ${shortenUrl(recording.initial_url)}`;
    card.appendChild(image);
  } else {
    const empty = document.createElement("div");
    empty.className = "recording-preview empty";
    empty.textContent = t("noPreview");
    card.appendChild(empty);
  }

  const body = document.createElement("div");
  body.className = "recording-body";

  const topLine = document.createElement("div");
  topLine.className = "recording-topline";

  const title = document.createElement("h3");
  title.className = "recording-title";
  title.textContent = recording.page_title || shortenUrl(recording.initial_url || recording.current_url);

  const badge = document.createElement("span");
  badge.className = "recording-badge";
  badge.textContent = isActive
    ? `${t("activeBadge")} · ${formatLanguage(recording.language)}`
    : t("stepBadge", recording.steps.length, formatLanguage(recording.language));

  topLine.append(title, badge);

  const meta = document.createElement("div");
  meta.className = "recording-meta";
  meta.append(
    createMetaItem(t("metaStart"), formatTimestamp(recording.started_at)),
    createMetaItem(t("metaEnd"), formatTimestamp(recording.ended_at)),
    createMetaItem(t("metaLastUrl"), shortenUrl(recording.current_url || recording.initial_url)),
    createMetaItem(t("metaLanguage"), formatLanguage(recording.language))
  );

  body.append(topLine, meta);

  if (!isActive) {
    const actions = document.createElement("div");
    actions.className = "recording-actions";
    actions.append(
      createButton(t("edit"), "button-ghost", () => openEditor(recording.id)),
      createButton(t("markdown"), "button-ghost", () => handleMarkdownExport(recording)),
      createButton(t("html"), "button-ghost", () => handleHtmlExport(recording)),
      createButton(t("confluence"), "button-ghost", () => handleConfluenceExport(recording)),
      createButton(t("pdf"), "button-ghost", () => handlePdfExport(recording)),
      createButton(t("delete"), "button-danger", () => handleDelete(recording.id))
    );
    body.appendChild(actions);
  }

  card.appendChild(body);
  return card;
}

function renderEmptyState(target, text) {
  target.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  target.appendChild(empty);
}

function applyViewMode(view) {
  const normalizedView = normalizeManagerView(view);
  latestManagerView = normalizedView;
  recordingsList.dataset.view = normalizedView;
  activeRecording.dataset.view = normalizedView;
  detailViewButton.classList.toggle("is-active", normalizedView === "detail");
  listViewButton.classList.toggle("is-active", normalizedView === "list");
  gridViewButton.classList.toggle("is-active", normalizedView === "grid");
}

function updateStepNumbers() {
  if (!editingDraft) {
    return;
  }

  editingDraft.steps.forEach((step, index) => {
    step.step = index + 1;
  });
}

function renderEditor() {
  if (!editingDraft) {
    editorSection.classList.add("hidden");
    recordingTitleInput.value = "";
    editorSteps.innerHTML = "";
    updateEditingCardState();
    return;
  }

  editorSection.classList.remove("hidden");
  recordingTitleInput.value = editingDraft.page_title || "";
  editorSteps.innerHTML = "";

  if (!editingDraft.steps?.length) {
    renderEmptyState(editorSteps, t("editorEmpty"));
    updateEditingCardState();
    return;
  }

  for (const [index, step] of editingDraft.steps.entries()) {
    const screenshot = getScreenshotForStep(editingDraft, step);
    const card = document.createElement("article");
    card.className = "editor-step-card";

    if (screenshot?.data_url) {
      const image = document.createElement("img");
      image.className = "editor-step-image";
      image.src = screenshot.data_url;
      image.alt = t("stepImageAlt", index + 1);
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "editor-step-body";

    const header = document.createElement("div");
    header.className = "editor-step-header";

    const title = document.createElement("div");
    title.className = "editor-step-title";
    title.textContent = t("editorStepTitle", index + 1, step.action || "step");

    const actions = document.createElement("div");
    actions.className = "editor-step-actions";
    actions.append(
      createButton(t("moveUp"), "button button-ghost button-mini", () => moveStep(index, -1)),
      createButton(t("moveDown"), "button button-ghost button-mini", () => moveStep(index, 1)),
      createButton(t("delete"), "button button-danger button-mini", () => removeStep(index))
    );

    if (index === 0) {
      actions.firstChild.disabled = true;
    }

    if (index === editingDraft.steps.length - 1) {
      actions.children[1].disabled = true;
    }

    header.append(title, actions);

    const descriptionField = document.createElement("label");
    descriptionField.className = "editor-field";
    const descriptionLabel = document.createElement("span");
    descriptionLabel.textContent = t("descriptionLabel");
    const descriptionInput = document.createElement("textarea");
    descriptionInput.value = step.description || "";
    descriptionInput.rows = 3;
    descriptionInput.addEventListener("input", (event) => {
      editingDraft.steps[index].description = event.target.value;
    });
    descriptionField.append(descriptionLabel, descriptionInput);

    const labelField = document.createElement("label");
    labelField.className = "editor-field";
    const labelLabel = document.createElement("span");
    labelLabel.textContent = t("labelLabel");
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.value = step.label || "";
    labelInput.addEventListener("input", (event) => {
      editingDraft.steps[index].label = event.target.value;
    });
    labelField.append(labelLabel, labelInput);

    body.append(header, descriptionField, labelField);

    if (step.value_preview !== undefined) {
      const valueField = document.createElement("label");
      valueField.className = "editor-field";
      const valueLabel = document.createElement("span");
      valueLabel.textContent = t("valueLabel");
      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.value = step.value_preview || "";
      valueInput.addEventListener("input", (event) => {
        editingDraft.steps[index].value_preview = event.target.value;
      });
      valueField.append(valueLabel, valueInput);
      body.appendChild(valueField);
    }

    if (typeof step.checked === "boolean") {
      const status = document.createElement("p");
      status.className = "editor-step-status";
      status.textContent = `${t("stepStatusLabel")}: ${
        step.checked ? t("stepStatusEnabled") : t("stepStatusDisabled")
      }`;
      body.appendChild(status);
    }

    card.appendChild(body);
    editorSteps.appendChild(card);
  }

  updateEditingCardState();
}

function openEditor(recordingId) {
  const recording = findRecording(recordingId);
  if (!recording) {
    setMessage(t("recordingNotFound"), true);
    return;
  }

  setEditingState(recording);
  renderEditor();
  editorSection.scrollIntoView({ block: "start", behavior: "smooth" });
}

function closeEditor() {
  setEditingState(null);
  renderEditor();
}

function moveStep(index, direction) {
  if (!editingDraft) {
    return;
  }

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= editingDraft.steps.length) {
    return;
  }

  const [step] = editingDraft.steps.splice(index, 1);
  editingDraft.steps.splice(targetIndex, 0, step);
  updateStepNumbers();
  renderEditor();
}

function removeStep(index) {
  if (!editingDraft) {
    return;
  }

  editingDraft.steps.splice(index, 1);
  updateStepNumbers();
  renderEditor();
}

function renderLibrary(library) {
  latestLibrary = library;
  applyStaticUi(library);

  const recordings = library?.recordings || [];
  const totalSteps = recordings.reduce((sum, recording) => sum + (recording.steps?.length || 0), 0);
  const managerView = normalizeManagerView(library?.preferences?.manager_view);

  recordingCount.textContent = String(recordings.length);
  stepTotal.textContent = String(totalSteps);
  statusLabel.textContent = library?.status === "recording" ? t("statusActive") : t("statusReady");
  uiLanguageSelect.value = library?.preferences?.ui_language || library?.preferences?.recording_language || "de";
  recordingLanguageSelect.value = library?.preferences?.recording_language || "de";
  recordingLanguageSelect.disabled = library?.status === "recording";
  applyViewMode(managerView);

  activeRecording.innerHTML = "";
  if (library?.status === "recording" && library?.session) {
    activeSection.classList.remove("hidden");
    activeRecording.appendChild(buildRecordingCard(library.session, { isActive: true }));
  } else {
    activeSection.classList.add("hidden");
  }

  recordingsList.innerHTML = "";
  if (recordings.length === 0) {
    renderEmptyState(recordingsList, t("emptyRecordings"));
  } else {
    for (const recording of recordings) {
      recordingsList.appendChild(buildRecordingCard(recording));
    }
  }

  if (editingDraft) {
    if (!findRecording(editingDraft.id)) {
      closeEditor();
    } else {
      renderEditor();
    }
  } else {
    updateEditingCardState();
  }
}

async function sendMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error || t("unknownError"));
  }

  return response;
}

async function loadLibrary() {
  const response = await sendMessage({ type: "recorder:get-library" });
  return response.library;
}

async function updatePreferences(preferences) {
  const response = await sendMessage({
    type: "recorder:update-preferences",
    preferences
  });

  return response.state;
}

async function handleUiLanguageChange() {
  try {
    const state = await updatePreferences({
      ui_language: uiLanguageSelect.value
    });
    renderLibrary({
      ...latestLibrary,
      status: state.status,
      error: state.error,
      session: state.session,
      preferences: state.preferences
    });
    setMessage(t("uiLanguageUpdated"));
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleRecordingLanguageChange() {
  try {
    const state = await updatePreferences({
      recording_language: recordingLanguageSelect.value
    });
    renderLibrary({
      ...latestLibrary,
      status: state.status,
      error: state.error,
      session: state.session,
      preferences: state.preferences
    });
    setMessage(t("recordingLanguageUpdated"));
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleViewChange(view) {
  const normalizedView = normalizeManagerView(view);
  const previousView = latestManagerView;
  applyViewMode(normalizedView);

  try {
    const state = await updatePreferences({
      manager_view: normalizedView
    });
    latestLibrary = {
      ...latestLibrary,
      status: state.status,
      error: state.error,
      session: state.session,
      preferences: state.preferences
    };
    applyViewMode(state.preferences?.manager_view || normalizedView);
  } catch (error) {
    applyViewMode(previousView);
    setMessage(error.message, true);
  }
}

async function handleSaveEdit() {
  if (!editingDraft) {
    return;
  }

  saveEditButton.disabled = true;

  try {
    editingDraft.page_title = recordingTitleInput.value.trim();
    updateStepNumbers();

    const response = await sendMessage({
      type: "recorder:update-recording",
      recordingId: editingDraft.id,
      payload: {
        page_title: editingDraft.page_title,
        steps: editingDraft.steps
      }
    });

    const updatedRecording = response.library.recordings.find((recording) => recording.id === editingDraft.id);
    setEditingState(updatedRecording || null);
    renderLibrary(response.library);
    setMessage(t("recordingSaved"));
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    saveEditButton.disabled = false;
  }
}

async function handleMarkdownExport(recording) {
  try {
    const result = await window.UiRecorderExportUtils.downloadMarkdownZip(recording);
    setMessage(t("markdownDownloaded", result.zipFileName));
  } catch (error) {
    setMessage(error.message, true);
  }
}

function handleHtmlExport(recording) {
  try {
    window.UiRecorderExportUtils
      .downloadHtmlZip(recording)
      .then((result) => {
        setMessage(t("htmlDownloaded", result.zipFileName));
      })
      .catch((error) => {
        setMessage(error.message, true);
      });
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleConfluenceExport(recording) {
  try {
    const result = await window.UiRecorderExportUtils.downloadConfluenceReadyHtml(recording);
    setMessage(t("confluenceDownloaded", result.fileName));
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handlePdfExport(recording) {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL(`preview/preview.html?print=1&recordingId=${encodeURIComponent(recording.id)}`)
    });
    setMessage(t("pdfOpened"));
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleDelete(recordingId) {
  try {
    const response = await sendMessage({
      type: "recorder:delete-recording",
      recordingId
    });

    if (editingDraft?.id === recordingId) {
      setEditingState(null);
    }

    renderLibrary(response.library);
    setMessage(t("recordingDeleted"));
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function initialize() {
  refreshButton.addEventListener("click", async () => {
    try {
      renderLibrary(await loadLibrary());
      setMessage(t("managerRefreshed"));
    } catch (error) {
      setMessage(error.message, true);
    }
  });

  uiLanguageSelect.addEventListener("change", handleUiLanguageChange);
  recordingLanguageSelect.addEventListener("change", handleRecordingLanguageChange);
  detailViewButton.addEventListener("click", () => handleViewChange("detail"));
  listViewButton.addEventListener("click", () => handleViewChange("list"));
  gridViewButton.addEventListener("click", () => handleViewChange("grid"));
  recordingTitleInput.addEventListener("input", (event) => {
    if (editingDraft) {
      editingDraft.page_title = event.target.value;
    }
  });
  saveEditButton.addEventListener("click", handleSaveEdit);
  cancelEditButton.addEventListener("click", closeEditor);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    loadLibrary()
      .then(renderLibrary)
      .catch((error) => setMessage(error.message, true));
  });

  try {
    renderLibrary(await loadLibrary());
  } catch (error) {
    applyStaticUi();
    setMessage(error.message, true);
    renderEmptyState(recordingsList, t("managerLoadFailed"));
  }
}

initialize();
