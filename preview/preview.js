(async () => {
  const STORAGE_KEY = "uiRecorderState";
  const loadingMessage = document.getElementById("loadingMessage");
  const UI_COPY = {
    de: {
      previewTitle: "ScreenSteps Vorschau",
      loading: "Report wird geladen...",
      errorTitle: "Kein Export moeglich",
      missingRecording: "Es ist keine aufgezeichnete Session mit Schritten vorhanden.",
      renderFailed: "Der Report konnte nicht erzeugt werden."
    },
    en: {
      previewTitle: "ScreenSteps preview",
      loading: "Loading report...",
      errorTitle: "Export not available",
      missingRecording: "No recorded session with steps is available.",
      renderFailed: "The report could not be created."
    }
  };

  function normalizeLanguage(language) {
    return language === "en" ? "en" : "de";
  }

  function getUiLanguage(state) {
    return normalizeLanguage(state?.preferences?.ui_language || state?.preferences?.recording_language);
  }

  function getCopy(state) {
    return UI_COPY[getUiLanguage(state)];
  }

  function applyStaticUi(state) {
    const copy = getCopy(state);
    document.documentElement.lang = getUiLanguage(state);
    document.title = copy.previewTitle;
    if (loadingMessage) {
      loadingMessage.textContent = copy.loading;
    }
  }

  function renderError(copy, message) {
    document.body.innerHTML = `
      <main style="max-width:720px;margin:48px auto;padding:0 24px;font-family:'Segoe UI',sans-serif;color:#173529;">
        <h1 style="margin:0 0 12px;">${copy.errorTitle}</h1>
        <p style="margin:0;color:#5f7369;">${message}</p>
      </main>
    `;
  }

  let activeCopy = UI_COPY.de;

  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const state = stored[STORAGE_KEY];
    const copy = getCopy(state);
    activeCopy = copy;
    applyStaticUi(state);

    const searchParams = new URLSearchParams(window.location.search);
    const recordingId = searchParams.get("recordingId");
    const shouldPrint = searchParams.get("print") === "1";

    const selectedRecording =
      (recordingId &&
        (state?.recordings || []).find((recording) => recording.id === recordingId)) ||
      (state?.session?.id === recordingId ? state.session : null) ||
      state?.session ||
      state?.recordings?.[0];

    if (!selectedRecording?.steps?.length) {
      renderError(copy, copy.missingRecording);
      return;
    }

    const html = window.UiRecorderExportUtils.buildHtmlDocument(selectedRecording, {
      autoPrint: shouldPrint,
      printMode: true
    });

    document.open();
    document.write(html);
    document.close();
  } catch (error) {
    renderError(activeCopy, error.message || activeCopy.renderFailed);
  }
})();
