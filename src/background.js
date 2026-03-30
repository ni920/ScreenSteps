const STORAGE_KEY = "uiRecorderState";
const CAPTURE_OPTIONS = { format: "jpeg", quality: 72 };
const CLICK_CAPTURE_DELAY_MS = 160;
const NAVIGATION_CAPTURE_DELAY_MS = 260;
const START_CAPTURE_DELAY_MS = 90;
const DEDUPE_WINDOW_MS = 700;
const PRE_CAPTURE_PREPARE_DELAY_MS = 60;
const BADGE_COLOR = "#c2410c";
const MARKER_COLOR = "#f97316";
const MARKER_FILL = "rgba(249, 115, 22, 0.18)";
const MARKER_POINT_FILL = "#ffffff";
const SUPPORTED_URL_PATTERN = /^https?:\/\//i;

const SESSION_COPY = {
  de: {
    start: (label) => (label ? `Seite '${label}' geoeffnet` : "Aufzeichnung gestartet"),
    navigation: (label) => `Navigation zu ${label}`
  },
  en: {
    start: (label) => (label ? `Opened page '${label}'` : "Recording started"),
    navigation: (label) => `Navigated to ${label}`
  }
};

const UI_COPY = {
  de: {
    alreadyRecording: "Es laeuft bereits eine Aufnahme. Bitte stoppe sie zuerst.",
    noActiveTab: "Kein aktiver Tab verfuegbar.",
    unsupportedUrl: "Bitte starte das Recording auf einer normalen http(s)-Webseite.",
    activationFailed: "Recording konnte auf dieser Seite nicht aktiviert werden.",
    cannotClearWhileRecording: "Eine laufende Aufnahme kann nicht geleert werden.",
    missingRecordingId: "Keine Recording-ID uebergeben.",
    cannotDeleteActiveRecording: "Die laufende Aufnahme kann nicht gelöscht werden.",
    cannotEditActiveRecording: "Eine laufende Aufnahme kann nicht bearbeitet werden.",
    recordingNotFound: "Recording wurde nicht gefunden.",
    trackedTabClosed: "Die aufgezeichnete Registerkarte wurde geschlossen.",
    tabSwitchStoppedRecording: "Die Aufnahme wurde beendet, weil du zu einem anderen Tab gewechselt hast."
  },
  en: {
    alreadyRecording: "A recording is already running. Please stop it first.",
    noActiveTab: "No active tab available.",
    unsupportedUrl: "Please start the recording on a regular http(s) page.",
    activationFailed: "Recording could not be activated on this page.",
    cannotClearWhileRecording: "An active recording cannot be cleared.",
    missingRecordingId: "No recording ID was provided.",
    cannotDeleteActiveRecording: "The active recording cannot be deleted.",
    cannotEditActiveRecording: "An active recording cannot be edited.",
    recordingNotFound: "Recording could not be found.",
    trackedTabClosed: "The recorded tab was closed.",
    tabSwitchStoppedRecording: "The recording was stopped because you switched to another tab."
  }
};

let stateCache = null;
let stateQueue = Promise.resolve();

function normalizeLanguage(language) {
  return language === "en" ? "en" : "de";
}

function normalizeManagerView(view) {
  return view === "list" || view === "grid" ? view : "detail";
}

function getSessionCopy(language) {
  return SESSION_COPY[normalizeLanguage(language)];
}

function getUiCopy(language) {
  return UI_COPY[normalizeLanguage(language)];
}

function normalizePreferences(preferences = {}) {
  const fallbackLanguage = normalizeLanguage(preferences.recording_language || preferences.ui_language);
  return {
    recording_language: normalizeLanguage(preferences.recording_language),
    ui_language: normalizeLanguage(preferences.ui_language || fallbackLanguage),
    manager_view: normalizeManagerView(preferences.manager_view)
  };
}

function createInitialState() {
  return {
    status: "idle",
    error: "",
    session: null,
    recordings: [],
    preferences: normalizePreferences()
  };
}

function queueStateChange(task) {
  stateQueue = stateQueue.then(task, task);
  return stateQueue;
}

function isSupportedUrl(url) {
  return SUPPORTED_URL_PATTERN.test(url || "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeScreenshot(asset) {
  if (!asset || typeof asset !== "object") {
    return null;
  }

  if (!asset.name || !asset.data_url) {
    return null;
  }

  return {
    name: String(asset.name),
    mime_type: asset.mime_type || "image/jpeg",
    data_url: String(asset.data_url)
  };
}

function ensureAttributeShape(attributes = {}) {
  return {
    id: attributes.id || "",
    name: attributes.name || "",
    "aria-label": attributes["aria-label"] || "",
    role: attributes.role || "",
    type: attributes.type || "",
    placeholder: attributes.placeholder || "",
    href: attributes.href || "",
    "data-testid": attributes["data-testid"] || ""
  };
}

function normalizeStep(step) {
  if (!step || typeof step !== "object") {
    return null;
  }

  const normalized = {
    step: Number.isInteger(step.step) ? step.step : 0,
    action: step.action || "click",
    description: step.description || "Interaktion",
    label: step.label || "",
    selector: step.selector || "",
    xpath: step.xpath || "",
    attributes: ensureAttributeShape(step.attributes),
    url: step.url || "",
    timestamp: step.timestamp || new Date().toISOString(),
    screenshot: step.screenshot || null
  };

  if (step.value_preview) {
    normalized.value_preview = step.value_preview;
  }

  if (typeof step.checked === "boolean") {
    normalized.checked = step.checked;
  }

  return normalized;
}

function normalizeEditableSteps(steps = []) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
    .map((step, index) =>
      normalizeStep({
        ...step,
        step: index + 1,
        description: step?.description || step?.label || "Interaktion"
      })
    )
    .filter(Boolean);
}

function normalizeSession(session) {
  if (!session || typeof session !== "object") {
    return null;
  }

  const steps = Array.isArray(session.steps) ? session.steps.map(normalizeStep).filter(Boolean) : [];
  const screenshots = Array.isArray(session.screenshots)
    ? session.screenshots.map(normalizeScreenshot).filter(Boolean)
    : [];
  const nextStepNumber =
    Number.isInteger(session.next_step_number) && session.next_step_number > 0
      ? session.next_step_number
      : steps.length + 1;

  return {
    id: session.id || `session-${Date.now()}`,
    tabId: Number.isInteger(session.tabId) ? session.tabId : null,
    windowId: Number.isInteger(session.windowId) ? session.windowId : null,
    language: normalizeLanguage(session.language),
    started_at: session.started_at || new Date().toISOString(),
    ended_at: session.ended_at || null,
    initial_url: session.initial_url || session.current_url || "",
    current_url: session.current_url || session.initial_url || "",
    page_title: session.page_title || "",
    steps,
    screenshots,
    next_step_number: nextStepNumber,
    pending_navigation_url: session.pending_navigation_url || "",
    last_event_signature: session.last_event_signature || "",
    last_event_at: Number.isFinite(session.last_event_at) ? session.last_event_at : 0
  };
}

function sortRecordings(recordings) {
  return recordings.sort((left, right) => {
    const leftTime = Date.parse(left.ended_at || left.started_at || "") || 0;
    const rightTime = Date.parse(right.ended_at || right.started_at || "") || 0;
    return rightTime - leftTime;
  });
}

function upsertRecording(state, session) {
  const recording = normalizeSession({
    ...clonePlain(session),
    ended_at: session.ended_at || new Date().toISOString(),
    pending_navigation_url: "",
    last_event_signature: "",
    last_event_at: 0
  });

  if (!recording) {
    return;
  }

  state.recordings = sortRecordings([
    recording,
    ...state.recordings.filter((item) => item.id !== recording.id)
  ]);
}

function normalizeState(rawState) {
  const base = createInitialState();
  const state = rawState && typeof rawState === "object" ? rawState : {};

  base.status = state.status === "recording" ? "recording" : "idle";
  base.error = state.error || "";
  base.session = normalizeSession(state.session);
  base.recordings = Array.isArray(state.recordings)
    ? state.recordings.map(normalizeSession).filter(Boolean)
    : [];
  base.preferences = normalizePreferences(state.preferences);

  if (base.session?.ended_at && !base.recordings.some((item) => item.id === base.session.id)) {
    base.recordings.push(normalizeSession(base.session));
  }

  base.recordings = sortRecordings(base.recordings);
  return base;
}

async function readState() {
  if (stateCache) {
    return stateCache;
  }

  const stored = await chrome.storage.local.get(STORAGE_KEY);
  stateCache = normalizeState(stored[STORAGE_KEY]);
  return stateCache;
}

async function saveState(state) {
  const normalized = normalizeState(state);
  stateCache = normalized;
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
}

function buildSessionResponse(session) {
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    tabId: session.tabId,
    windowId: session.windowId,
    language: session.language,
    started_at: session.started_at,
    ended_at: session.ended_at,
    initial_url: session.initial_url,
    current_url: session.current_url,
    page_title: session.page_title,
    steps: session.steps,
    screenshots: session.screenshots,
    step_count: session.steps.length,
    screenshot_count: session.screenshots.length
  };
}

function buildStateResponse(state, senderTabId) {
  const isActiveForSender =
    Boolean(senderTabId) &&
    state.status === "recording" &&
    state.session &&
    state.session.tabId === senderTabId;

  return {
    status: state.status,
    error: state.error,
    activeForTab: isActiveForSender,
    recording_count: state.recordings.length,
    preferences: state.preferences,
    session: buildSessionResponse(state.session)
  };
}

function buildLibraryResponse(state) {
  return {
    status: state.status,
    error: state.error,
    preferences: state.preferences,
    session: buildSessionResponse(state.session),
    recordings: state.recordings.map((recording) => buildSessionResponse(recording))
  };
}

function sanitizeStepPayload(payload = {}) {
  const step = {
    action: payload.action || "click",
    description: payload.description || "Interaktion",
    label: payload.label || "",
    selector: payload.selector || "",
    xpath: payload.xpath || "",
    attributes: ensureAttributeShape(payload.attributes),
    url: payload.url || "",
    timestamp: payload.timestamp || new Date().toISOString(),
    screenshot: null
  };

  if (payload.value_preview) {
    step.value_preview = payload.value_preview;
  }

  if (typeof payload.checked === "boolean") {
    step.checked = payload.checked;
  }

  return step;
}

function buildScreenshotAsset(stepNumber, dataUrl) {
  return {
    name: `step-${String(stepNumber).padStart(3, "0")}.jpg`,
    mime_type: "image/jpeg",
    data_url: dataUrl
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeMarker(marker) {
  if (!marker || typeof marker !== "object") {
    return null;
  }

  const viewportWidth = Number(marker.viewportWidth);
  const viewportHeight = Number(marker.viewportHeight);
  const x = Number(marker.x);
  const y = Number(marker.y);
  const width = Number(marker.width);
  const height = Number(marker.height);
  const clickX = Number(marker.clickX);
  const clickY = Number(marker.clickY);

  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return null;
  }

  return {
    x,
    y,
    width: Number.isFinite(width) ? Math.max(width, 0) : 0,
    height: Number.isFinite(height) ? Math.max(height, 0) : 0,
    clickX: Number.isFinite(clickX) ? clickX : x + Math.max(width, 24) / 2,
    clickY: Number.isFinite(clickY) ? clickY : y + Math.max(height, 24) / 2,
    viewportWidth,
    viewportHeight
  };
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function blobToDataUrl(blob) {
  const base64 = toBase64(await blob.arrayBuffer());
  return `data:${blob.type};base64,${base64}`;
}

async function annotateScreenshot(asset, marker) {
  const normalizedMarker = normalizeMarker(marker);
  if (!asset || !normalizedMarker) {
    return asset;
  }

  try {
    const response = await fetch(asset.data_url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");

    if (!context) {
      return asset;
    }

    context.drawImage(bitmap, 0, 0);

    const scaleX = bitmap.width / normalizedMarker.viewportWidth;
    const scaleY = bitmap.height / normalizedMarker.viewportHeight;
    const lineWidth = Math.max(4, Math.round(Math.min(bitmap.width, bitmap.height) * 0.006));
    const padding = Math.max(10, Math.round(Math.min(bitmap.width, bitmap.height) * 0.014));
    const markerWidth = Math.max(normalizedMarker.width * scaleX, 28);
    const markerHeight = Math.max(normalizedMarker.height * scaleY, 28);
    const left = clamp(normalizedMarker.x * scaleX - padding, 0, Math.max(bitmap.width - 4, 0));
    const top = clamp(normalizedMarker.y * scaleY - padding, 0, Math.max(bitmap.height - 4, 0));
    const width = clamp(markerWidth + padding * 2, 24, Math.max(bitmap.width - left, 24));
    const height = clamp(markerHeight + padding * 2, 24, Math.max(bitmap.height - top, 24));
    const pointX = clamp(normalizedMarker.clickX * scaleX, 0, bitmap.width);
    const pointY = clamp(normalizedMarker.clickY * scaleY, 0, bitmap.height);
    const outerRadius = Math.max(14, Math.round(lineWidth * 2.4));
    const innerRadius = Math.max(5, Math.round(lineWidth * 0.85));

    context.save();
    context.fillStyle = MARKER_FILL;
    context.strokeStyle = MARKER_COLOR;
    context.lineWidth = lineWidth;
    context.fillRect(left, top, width, height);
    context.strokeRect(left, top, width, height);

    context.beginPath();
    context.arc(pointX, pointY, outerRadius, 0, Math.PI * 2);
    context.fillStyle = MARKER_COLOR;
    context.globalAlpha = 0.22;
    context.fill();

    context.globalAlpha = 1;
    context.beginPath();
    context.arc(pointX, pointY, outerRadius, 0, Math.PI * 2);
    context.strokeStyle = MARKER_COLOR;
    context.lineWidth = Math.max(3, Math.round(lineWidth * 0.75));
    context.stroke();

    context.beginPath();
    context.arc(pointX, pointY, innerRadius, 0, Math.PI * 2);
    context.fillStyle = MARKER_POINT_FILL;
    context.fill();
    context.restore();

    const annotatedBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.86
    });

    return {
      ...asset,
      data_url: await blobToDataUrl(annotatedBlob)
    };
  } catch (error) {
    console.warn("Screenshot annotation failed:", error);
    return asset;
  }
}

async function isExpectedTabActive(windowId, expectedTabId) {
  if (!expectedTabId || typeof windowId !== "number") {
    return true;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, windowId });
    return tabs[0]?.id === expectedTabId;
  } catch (error) {
    console.warn("Unable to resolve active tab for capture:", error);
    return false;
  }
}

async function sendCaptureMessage(tabId, type) {
  if (!tabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, { type });
  } catch (error) {
    console.warn(`Capture helper message '${type}' failed:`, error);
  }
}

async function captureScreenshot(windowId, stepNumber, expectedTabId = null) {
  try {
    if (!(await isExpectedTabActive(windowId, expectedTabId))) {
      return null;
    }

    await sendCaptureMessage(expectedTabId, "recorder:prepare-capture");
    await sleep(PRE_CAPTURE_PREPARE_DELAY_MS);

    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, CAPTURE_OPTIONS);
    return buildScreenshotAsset(stepNumber, dataUrl);
  } catch (error) {
    console.warn("Screenshot capture failed:", error);
    return null;
  } finally {
    await sendCaptureMessage(expectedTabId, "recorder:finish-capture");
  }
}

function getUrlLabel(url) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    for (let index = segments.length - 1; index >= 0; index -= 1) {
      let decodedSegment = segments[index];
      try {
        decodedSegment = decodeURIComponent(decodedSegment);
      } catch (error) {
        decodedSegment = segments[index];
      }

      const normalized = decodedSegment
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (normalized && normalized.length <= 60 && !/^[a-f0-9-]{12,}$/i.test(normalized)) {
        return /^[a-z0-9 ]+$/i.test(normalized)
          ? normalized.replace(/\b[a-z]/g, (match) => match.toUpperCase())
          : normalized;
      }
    }

    return parsed.hostname.replace(/^www\./i, "");
  } catch (error) {
    return String(url || "")
      .replace(/^https?:\/\//i, "")
      .split(/[?#]/)[0]
      .replace(/\/+$/g, "");
  }
}

async function appendStartStep(session) {
  if (!session) {
    return;
  }

  const copy = getSessionCopy(session.language);
  const label = session.page_title || getUrlLabel(session.initial_url);
  const stepNumber = session.next_step_number;
  session.next_step_number += 1;

  await sleep(START_CAPTURE_DELAY_MS);
  const screenshot = await captureScreenshot(session.windowId, stepNumber, session.tabId);

  session.steps.push({
    step: stepNumber,
    action: "start",
    description: copy.start(label),
    label,
    selector: "",
    xpath: "",
    attributes: ensureAttributeShape(),
    url: session.initial_url,
    timestamp: session.started_at,
    screenshot: screenshot ? screenshot.name : null
  });

  if (screenshot) {
    session.screenshots.push(screenshot);
  }
}

async function syncBadge(state) {
  if (state.status === "recording") {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    await chrome.action.setBadgeText({ text: "REC" });
    return;
  }

  await chrome.action.setBadgeText({ text: "" });
}

async function notifyTab(tabId, active, language = "de") {
  try {
    return await chrome.tabs.sendMessage(tabId, {
      type: "recorder:set-recording",
      active,
      language: normalizeLanguage(language)
    });
  } catch (error) {
    if (!active) {
      return { ok: true };
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content-script.js"]
    });

    return chrome.tabs.sendMessage(tabId, {
      type: "recorder:set-recording",
      active,
      language: normalizeLanguage(language)
    });
  }
}

async function startRecording(tabId, language) {
  const state = await readState();
  const uiCopy = getUiCopy(state.preferences.ui_language);

  if (state.status === "recording") {
    throw new Error(uiCopy.alreadyRecording);
  }

  const tab = await chrome.tabs.get(tabId);

  if (!tab?.id || typeof tab.windowId !== "number") {
    throw new Error(uiCopy.noActiveTab);
  }

  if (!isSupportedUrl(tab.url)) {
    throw new Error(uiCopy.unsupportedUrl);
  }

  const recordingLanguage = normalizeLanguage(language || state.preferences.recording_language);
  state.preferences.recording_language = recordingLanguage;
  state.status = "recording";
  state.error = "";
  state.session = {
    id: `session-${Date.now()}`,
    tabId: tab.id,
    windowId: tab.windowId,
    language: recordingLanguage,
    started_at: new Date().toISOString(),
    ended_at: null,
    initial_url: tab.url,
    current_url: tab.url,
    page_title: tab.title || "",
    steps: [],
    screenshots: [],
    next_step_number: 1,
    pending_navigation_url: "",
    last_event_signature: "",
    last_event_at: 0
  };

  await saveState(state);
  await syncBadge(state);

  try {
    await notifyTab(tab.id, true, recordingLanguage);
    await appendStartStep(state.session);
    await saveState(state);
  } catch (error) {
    state.status = "idle";
    state.error = uiCopy.activationFailed;
    state.session = null;
    await saveState(state);
    await syncBadge(state);
    throw error;
  }

  return buildStateResponse(state, tab.id);
}

async function stopRecording() {
  const state = await readState();

  if (!state.session) {
    return buildStateResponse(state);
  }

  if (state.status === "recording") {
    state.status = "idle";
    state.error = "";
    state.session.ended_at = state.session.ended_at || new Date().toISOString();
    state.session.pending_navigation_url = "";
    upsertRecording(state, state.session);
    await saveState(state);
    await syncBadge(state);
    await notifyTab(state.session.tabId, false, state.session.language);
  }

  return buildStateResponse(state, state.session.tabId);
}

async function clearCurrentSession() {
  const state = await readState();
  const uiCopy = getUiCopy(state.preferences.ui_language);

  if (state.status === "recording") {
    throw new Error(uiCopy.cannotClearWhileRecording);
  }

  state.error = "";
  state.session = null;
  await saveState(state);
  return buildStateResponse(state);
}

async function deleteRecording(recordingId) {
  const state = await readState();
  const uiCopy = getUiCopy(state.preferences.ui_language);

  if (!recordingId) {
    throw new Error(uiCopy.missingRecordingId);
  }

  if (state.status === "recording" && state.session?.id === recordingId) {
    throw new Error(uiCopy.cannotDeleteActiveRecording);
  }

  state.recordings = state.recordings.filter((recording) => recording.id !== recordingId);

  if (state.session?.id === recordingId && state.status !== "recording") {
    state.session = null;
  }

  await saveState(state);
  return buildLibraryResponse(state);
}

async function updateRecording(recordingId, payload = {}) {
  const state = await readState();
  const uiCopy = getUiCopy(state.preferences.ui_language);

  if (!recordingId) {
    throw new Error(uiCopy.missingRecordingId);
  }

  if (state.status === "recording" && state.session?.id === recordingId) {
    throw new Error(uiCopy.cannotEditActiveRecording);
  }

  const recordingIndex = state.recordings.findIndex((recording) => recording.id === recordingId);
  if (recordingIndex === -1) {
    throw new Error(uiCopy.recordingNotFound);
  }

  const currentRecording = state.recordings[recordingIndex];
  const updatedRecording = normalizeSession({
    ...clonePlain(currentRecording),
    page_title:
      typeof payload.page_title === "string" ? payload.page_title.trim() : currentRecording.page_title,
    steps: normalizeEditableSteps(payload.steps || currentRecording.steps),
    next_step_number: Array.isArray(payload.steps) ? payload.steps.length + 1 : currentRecording.next_step_number
  });

  state.recordings[recordingIndex] = updatedRecording;
  state.recordings = sortRecordings(state.recordings);

  if (state.session?.id === recordingId && state.status !== "recording") {
    state.session = normalizeSession(updatedRecording);
  }

  await saveState(state);
  return buildLibraryResponse(state);
}

async function updatePreferences(input = {}) {
  const state = await readState();
  const nextPreferences =
    typeof input === "string"
      ? { recording_language: input, ui_language: input }
      : {
          recording_language: input.recording_language || input.language || state.preferences.recording_language,
          ui_language:
            input.ui_language ||
            state.preferences.ui_language ||
            input.recording_language ||
            input.language,
          manager_view: input.manager_view || state.preferences.manager_view
        };

  state.preferences = normalizePreferences({
    ...state.preferences,
    ...nextPreferences
  });
  await saveState(state);
  return buildStateResponse(state);
}

async function appendTrackedStep(sender, payload) {
  const state = await readState();

  if (state.status !== "recording" || !state.session) {
    return buildStateResponse(state, sender.tab?.id);
  }

  if (!sender.tab?.id || sender.tab.id !== state.session.tabId) {
    return buildStateResponse(state, sender.tab?.id);
  }

  const signature =
    payload.signature ||
    [
      payload.action,
      payload.selector,
      payload.url,
      payload.label,
      payload.value_preview || "",
      payload.checked
    ].join("|");

  const eventTimestamp = Date.parse(payload.timestamp || "");
  const eventTime = Number.isFinite(eventTimestamp) ? eventTimestamp : Date.now();

  if (
    signature &&
    signature === state.session.last_event_signature &&
    eventTime - state.session.last_event_at < DEDUPE_WINDOW_MS
  ) {
    return buildStateResponse(state, sender.tab.id);
  }

  state.session.last_event_signature = signature;
  state.session.last_event_at = eventTime;
  state.session.current_url = payload.url || state.session.current_url;
  state.session.page_title = sender.tab?.title || state.session.page_title;

  const stepNumber = state.session.next_step_number;
  state.session.next_step_number += 1;

  await sleep(CLICK_CAPTURE_DELAY_MS);
  const screenshot = await captureScreenshot(state.session.windowId, stepNumber, state.session.tabId);
  const annotatedScreenshot =
    screenshot && payload.marker ? await annotateScreenshot(screenshot, payload.marker) : screenshot;
  const step = sanitizeStepPayload(payload);
  step.step = stepNumber;
  step.screenshot = annotatedScreenshot ? annotatedScreenshot.name : null;

  state.session.steps.push(step);

  if (annotatedScreenshot) {
    state.session.screenshots.push(annotatedScreenshot);
  }

  await saveState(state);
  return buildStateResponse(state, sender.tab.id);
}

async function appendNavigationStep(tabId, tabUrl, tabTitle) {
  const state = await readState();

  if (state.status !== "recording" || !state.session || state.session.tabId !== tabId) {
    return;
  }

  const nextUrl = tabUrl || state.session.pending_navigation_url || "";
  if (!nextUrl || nextUrl === state.session.current_url) {
    state.session.pending_navigation_url = "";
    await saveState(state);
    return;
  }

  const copy = getSessionCopy(state.session.language);
  const stepNumber = state.session.next_step_number;
  state.session.next_step_number += 1;
  state.session.page_title = tabTitle || state.session.page_title;
  const destinationLabel = tabTitle || getUrlLabel(nextUrl);

  await sleep(NAVIGATION_CAPTURE_DELAY_MS);
  const screenshot = await captureScreenshot(state.session.windowId, stepNumber, state.session.tabId);

  state.session.steps.push({
    step: stepNumber,
    action: "navigation",
    description: copy.navigation(destinationLabel),
    label: destinationLabel,
    selector: "",
    xpath: "",
    attributes: ensureAttributeShape(),
    url: nextUrl,
    timestamp: new Date().toISOString(),
    screenshot: screenshot ? screenshot.name : null
  });

  if (screenshot) {
    state.session.screenshots.push(screenshot);
  }

  state.session.current_url = nextUrl;
  state.session.pending_navigation_url = "";
  await saveState(state);
}

async function handleTabUpdated(tabId, changeInfo, tab) {
  const state = await readState();

  if (state.status !== "recording" || !state.session || state.session.tabId !== tabId) {
    return;
  }

  let changed = false;

  if (typeof changeInfo.url === "string" && changeInfo.url !== state.session.current_url) {
    state.session.pending_navigation_url = changeInfo.url;
    changed = true;
  }

  if (typeof changeInfo.title === "string" && changeInfo.title) {
    state.session.page_title = changeInfo.title;
    changed = true;
  }

  if (changed) {
    await saveState(state);
  }

  if (changeInfo.status === "complete") {
    await appendNavigationStep(tabId, tab.url, tab.title);

    if (isSupportedUrl(tab.url)) {
      try {
        await notifyTab(tabId, true, state.session.language);
      } catch (error) {
        console.warn("Unable to re-arm content script:", error);
      }
    }
  }
}

async function handleTabRemoved(tabId) {
  const state = await readState();

  if (state.status !== "recording" || !state.session || state.session.tabId !== tabId) {
    return;
  }

  state.status = "idle";
  state.error = getUiCopy(state.preferences.ui_language).trackedTabClosed;
  state.session.ended_at = state.session.ended_at || new Date().toISOString();
  upsertRecording(state, state.session);
  await saveState(state);
  await syncBadge(state);
}

async function handleTabActivated(activeInfo) {
  const state = await readState();

  if (
    state.status !== "recording" ||
    !state.session ||
    activeInfo.windowId !== state.session.windowId ||
    activeInfo.tabId === state.session.tabId
  ) {
    return;
  }

  state.status = "idle";
  state.error = getUiCopy(state.preferences.ui_language).tabSwitchStoppedRecording;
  state.session.ended_at = state.session.ended_at || new Date().toISOString();
  state.session.pending_navigation_url = "";
  upsertRecording(state, state.session);
  await saveState(state);
  await syncBadge(state);

  try {
    await notifyTab(state.session.tabId, false, state.session.language);
  } catch (error) {
    console.warn("Unable to stop content script after tab switch:", error);
  }
}

async function handleMessage(message, sender) {
  switch (message.type) {
    case "recorder:get-state": {
      const state = await readState();
      return { ok: true, state: buildStateResponse(state, sender.tab?.id) };
    }
    case "recorder:get-library": {
      const state = await readState();
      return { ok: true, library: buildLibraryResponse(state) };
    }
    case "recorder:start":
      return {
        ok: true,
        state: await queueStateChange(() => startRecording(message.tabId, message.language))
      };
    case "recorder:stop":
      return {
        ok: true,
        state: await queueStateChange(() => stopRecording())
      };
    case "recorder:clear":
    case "recorder:clear-current":
      return {
        ok: true,
        state: await queueStateChange(() => clearCurrentSession())
      };
    case "recorder:update-preferences":
      return {
        ok: true,
        state: await queueStateChange(() =>
          updatePreferences(message.preferences || { language: message.language, manager_view: message.manager_view })
        )
      };
    case "recorder:delete-recording":
      return {
        ok: true,
        library: await queueStateChange(() => deleteRecording(message.recordingId))
      };
    case "recorder:update-recording":
      return {
        ok: true,
        library: await queueStateChange(() => updateRecording(message.recordingId, message.payload || {}))
      };
    case "recorder:track-step":
      return {
        ok: true,
        state: await queueStateChange(() => appendTrackedStep(sender, message.payload || {}))
      };
    default:
      return { ok: false, error: "Unbekannter Nachrichtentyp." };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void queueStateChange(async () => {
    const state = await readState();
    await saveState(state);
    await syncBadge(state);
  });
});

chrome.runtime.onStartup.addListener(() => {
  void queueStateChange(async () => {
    const state = await readState();
    await saveState(state);
    await syncBadge(state);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error("Recorder message failed:", error);
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "complete") {
    return;
  }

  void queueStateChange(() => handleTabUpdated(tabId, changeInfo, tab));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void queueStateChange(() => handleTabRemoved(tabId));
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  void queueStateChange(() => handleTabActivated(activeInfo));
});

void queueStateChange(async () => {
  const state = await readState();
  await saveState(state);
  await syncBadge(state);
});
