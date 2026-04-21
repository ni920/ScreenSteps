const statusPill = document.getElementById("statusPill");
const messageBox = document.getElementById("message");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const managerButton = document.getElementById("managerButton");

const UI_COPY = {
  de: {
    title: "ScreenSteps",
    ready: "Bereit",
    recordingActive: "Recording aktiv",
    startButton: "Record starten",
    stopButton: "Record stoppen",
    managerButton: "Verwalten",
    messageRecording: "Die Aufnahme läuft.",
    messageStored: "Letzte Aufnahme gespeichert. Archiv, Exporte, Bearbeitung und Sprache findest du in der Verwaltung.",
    messageReady: "Bereit für eine neue Aufnahme.",
    starting: "Recording wird gestartet...",
    stopping: "Recording wird beendet...",
    noActiveTab: "Kein aktiver Tab gefunden.",
    unknownError: "Unbekannter Fehler."
  },
  en: {
    title: "ScreenSteps",
    ready: "Ready",
    recordingActive: "Recording active",
    startButton: "Start recording",
    stopButton: "Stop recording",
    managerButton: "Manage",
    messageRecording: "Recording is running.",
    messageStored: "Last recording saved. Archive, exports, editing, and language settings are available in Manage.",
    messageReady: "Ready for a new recording.",
    starting: "Starting recording...",
    stopping: "Stopping recording...",
    noActiveTab: "No active tab found.",
    unknownError: "Unknown error."
  }
};

let latestState = null;

function normalizeLanguage(language) {
  return language === "en" ? "en" : "de";
}

function getPreferredRecordingLanguage(state) {
  return state?.preferences?.recording_language || latestState?.preferences?.recording_language || "de";
}

function getUiLanguage(state) {
  return normalizeLanguage(
    state?.preferences?.ui_language ||
      state?.preferences?.recording_language ||
      latestState?.preferences?.ui_language ||
      latestState?.preferences?.recording_language
  );
}

function getCopy(state = latestState) {
  return UI_COPY[getUiLanguage(state)];
}

function setMessage(text, isError = false) {
  messageBox.textContent = text || "";
  messageBox.classList.toggle("error", Boolean(isError));
}

function applyStaticUi(state) {
  const copy = getCopy(state);
  document.documentElement.lang = getUiLanguage(state);
  document.title = copy.title;
  startButton.textContent = copy.startButton;
  stopButton.textContent = copy.stopButton;
  managerButton.textContent = copy.managerButton;
}

function renderState(state) {
  latestState = state;
  applyStaticUi(state);

  const copy = getCopy(state);
  const session = state?.session || null;
  const recording = state?.status === "recording";

  statusPill.textContent = recording ? copy.recordingActive : copy.ready;
  statusPill.classList.toggle("recording", recording);
  statusPill.classList.toggle("idle", !recording);

  startButton.disabled = recording;
  stopButton.disabled = !recording;

  if (state?.error) {
    setMessage(state.error, true);
  } else if (recording) {
    setMessage(copy.messageRecording);
  } else if (session?.ended_at) {
    setMessage(copy.messageStored);
  } else {
    setMessage(copy.messageReady);
  }
}

async function sendMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error || getCopy().unknownError);
  }

  return response;
}

async function getState() {
  const response = await sendMessage({ type: "recorder:get-state" });
  return response.state;
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id;
}

async function handleStart() {
  setMessage(getCopy().starting);

  try {
    const tabId = await getActiveTabId();
    if (!tabId) {
      throw new Error(getCopy().noActiveTab);
    }

    const response = await sendMessage({
      type: "recorder:start",
      tabId,
      language: getPreferredRecordingLanguage(latestState)
    });
    renderState(response.state);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleStop() {
  setMessage(getCopy().stopping);

  try {
    const response = await sendMessage({ type: "recorder:stop" });
    renderState(response.state);
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function handleOpenManager() {
  await chrome.tabs.create({
    url: chrome.runtime.getURL("manager/manager.html")
  });
}

async function initialize() {
  startButton.addEventListener("click", handleStart);
  stopButton.addEventListener("click", handleStop);
  managerButton.addEventListener("click", handleOpenManager);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.uiRecorderState) {
      return;
    }

    renderState(changes.uiRecorderState.newValue || { status: "idle", session: null, preferences: {} });
  });

  try {
    renderState(await getState());
  } catch (error) {
    setMessage(error.message, true);
  }
}

initialize();
