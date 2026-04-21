(() => {
  const COPY = {
    de: {
      languageName: "Deutsch",
      reportTitle: "Ablauf auf",
      lead: "Klare Schrittfolge mit markierten Screenshots für Doku, Support und SOPs.",
      hint: "Dieser Report kann direkt als HTML gespeichert oder über den Browser als PDF gedruckt werden.",
      steps: "Schritte",
      start: "Start",
      end: "Ende",
      startPage: "Startseite",
      lastPage: "Letzte Seite",
      noSteps: "Keine aufgezeichneten Schritte vorhanden.",
      noScreenshot: "Kein Screenshot verfügbar",
      stepLabel: "Schritt",
      value: "Wert",
      status: "Status",
      enabled: "aktiviert",
      disabled: "deaktiviert",
      recordingOn: "Aufnahme auf",
      exportedMarkdownMessage: "Markdown-ZIP",
      exportedHtmlMessage: "HTML-ZIP",
      exportedConfluenceMessage: "Confluence-HTML",
      confluenceTitle: "Confluence Export für",
      confluenceLead: "Bereinigt für Copy-Paste nach Confluence mit eingebetteten Screenshots.",
      confluenceHint:
        "Öffne diese Datei im Browser und kopiere den Inhalt in eine Confluence-Seite. Die Struktur ist bewusst schlicht gehalten.",
      confluenceHowToTitle: "So nutzt du den Export",
      confluenceHowToSteps: [
        "Datei im Browser öffnen",
        "Den eigentlichen Report-Inhalt markieren und kopieren",
        "In den Confluence-Editor einfügen"
      ]
    },
    en: {
      languageName: "English",
      reportTitle: "Flow on",
      lead: "Clear step-by-step documentation with annotated screenshots for SOPs, support, and training.",
      hint: "This report can be saved as HTML directly or printed as PDF in the browser.",
      steps: "Steps",
      start: "Start",
      end: "End",
      startPage: "Start page",
      lastPage: "Last page",
      noSteps: "No recorded steps available.",
      noScreenshot: "No screenshot available",
      stepLabel: "Step",
      value: "Value",
      status: "Status",
      enabled: "enabled",
      disabled: "disabled",
      recordingOn: "Recording on",
      exportedMarkdownMessage: "Markdown ZIP",
      exportedHtmlMessage: "HTML ZIP",
      exportedConfluenceMessage: "Confluence HTML",
      confluenceTitle: "Confluence Export for",
      confluenceLead: "Prepared for copy-paste into Confluence with embedded screenshots.",
      confluenceHint:
        "Open this file in your browser and copy the report content into a Confluence page. The structure is intentionally simple.",
      confluenceHowToTitle: "How to use this export",
      confluenceHowToSteps: [
        "Open the file in your browser",
        "Select and copy the actual report content",
        "Paste it into the Confluence editor"
      ]
    }
  };

  function resolveRecording(source) {
    if (!source) {
      return null;
    }

    return source.session ? source.session : source;
  }

  function normalizeLanguage(language) {
    return language === "en" ? "en" : "de";
  }

  function getCopy(sourceOrLanguage) {
    const language =
      typeof sourceOrLanguage === "string"
        ? normalizeLanguage(sourceOrLanguage)
        : normalizeLanguage(resolveRecording(sourceOrLanguage)?.language);

    return COPY[language];
  }

  function getLanguageLabel(language, uiLanguage = "de") {
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedUiLanguage = normalizeLanguage(uiLanguage);
    const labels = {
      de: { de: "Deutsch", en: "Englisch" },
      en: { de: "German", en: "English" }
    };

    return labels[normalizedUiLanguage][normalizedLanguage];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getLocale(sourceOrLanguage) {
    const language =
      typeof sourceOrLanguage === "string"
        ? normalizeLanguage(sourceOrLanguage)
        : normalizeLanguage(resolveRecording(sourceOrLanguage)?.language);

    return language === "en" ? "en-US" : "de-DE";
  }

  function formatTimestamp(value, sourceOrLanguage) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(getLocale(sourceOrLanguage), {
      dateStyle: "medium",
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
      return String(value);
    }
  }

  function getHostLabel(value) {
    if (!value) {
      return "recording";
    }

    try {
      return new URL(value).hostname || "recording";
    } catch (error) {
      return "recording";
    }
  }

  function sanitizeSegment(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function buildDisplayTitle(recording) {
    return recording?.page_title || shortenUrl(recording?.initial_url || recording?.current_url || "");
  }

  function buildExportBaseName(source) {
    const recording = resolveRecording(source);
    const host = sanitizeSegment(getHostLabel(recording?.initial_url)) || "recording";
    const stamp = String(recording?.started_at || new Date().toISOString()).replace(/[:.]/g, "-");
    return `screensteps-${host}-${stamp}`;
  }

  function buildFileName(source, extension) {
    return `${buildExportBaseName(source)}.${extension}`;
  }

  function buildRecordingFileName(source) {
    return `${buildExportBaseName(source)}.screensteps`;
  }

  function getScreenshotMap(recording) {
    return new Map((recording?.screenshots || []).map((item) => [item.name, item]));
  }

  function sanitizeTransferStep(step, index) {
    if (!step || typeof step !== "object") {
      return null;
    }

    const cleanedStep = {
      step: Number.isInteger(step.step) ? step.step : index + 1,
      action: step.action || "click",
      description: step.description || step.label || "Interaction",
      label: step.label || "",
      selector: step.selector || "",
      xpath: step.xpath || "",
      attributes: {
        id: step.attributes?.id || "",
        name: step.attributes?.name || "",
        "aria-label": step.attributes?.["aria-label"] || "",
        role: step.attributes?.role || "",
        type: step.attributes?.type || "",
        placeholder: step.attributes?.placeholder || "",
        href: step.attributes?.href || "",
        "data-testid": step.attributes?.["data-testid"] || ""
      },
      url: step.url || "",
      timestamp: step.timestamp || new Date().toISOString(),
      screenshot: step.screenshot || null
    };

    if (step.value_preview !== undefined) {
      cleanedStep.value_preview = step.value_preview;
    }

    if (typeof step.checked === "boolean") {
      cleanedStep.checked = step.checked;
    }

    return cleanedStep;
  }

  function sanitizeTransferScreenshot(screenshot) {
    if (!screenshot || typeof screenshot !== "object" || !screenshot.name || !screenshot.data_url) {
      return null;
    }

    return {
      name: String(screenshot.name),
      mime_type: screenshot.mime_type || "image/jpeg",
      data_url: String(screenshot.data_url)
    };
  }

  function buildTransferRecording(source) {
    const recording = resolveRecording(source);

    if (!recording) {
      return null;
    }

    return {
      id: recording.id || "",
      language: normalizeLanguage(recording.language),
      started_at: recording.started_at || new Date().toISOString(),
      ended_at: recording.ended_at || recording.started_at || new Date().toISOString(),
      initial_url: recording.initial_url || recording.current_url || "",
      current_url: recording.current_url || recording.initial_url || "",
      page_title: recording.page_title || "",
      steps: (recording.steps || []).map(sanitizeTransferStep).filter(Boolean),
      screenshots: (recording.screenshots || []).map(sanitizeTransferScreenshot).filter(Boolean)
    };
  }

  function buildStepNote(step, copy) {
    if (step.value_preview) {
      return `${copy.value}: ${step.value_preview}`;
    }

    if (typeof step.checked === "boolean") {
      return `${copy.status}: ${step.checked ? copy.enabled : copy.disabled}`;
    }

    return "";
  }

  function buildStepHtml(step, screenshot, options = {}) {
    const { imageSrcResolver, copy } = options;
    const resolvedImageSrc = screenshot
      ? imageSrcResolver?.(screenshot, step) ?? screenshot.data_url ?? ""
      : "";
    const imageMarkup = resolvedImageSrc
      ? `<img class="step-image" src="${escapeHtml(resolvedImageSrc)}" alt="${escapeHtml(
          `${copy.stepLabel} ${step.step}`
        )}" />`
      : `<div class="step-image step-image-empty">${escapeHtml(copy.noScreenshot)}</div>`;
    const note = buildStepNote(step, copy);
    const noteMarkup = note ? `<p class="step-note">${escapeHtml(note)}</p>` : "";

    return `
      <article class="step-card">
        ${imageMarkup}
        <div class="step-body">
          <p class="step-kicker">${escapeHtml(copy.stepLabel)} ${step.step} <span>${escapeHtml(
            step.action || "step"
          )}</span></p>
          <h2>${escapeHtml(step.description || "Interaction")}</h2>
          ${noteMarkup}
        </div>
      </article>
    `;
  }

  function buildReportBody(source, options = {}) {
    const { printMode = false, imageSrcResolver } = options;
    const recording = resolveRecording(source);
    const copy = getCopy(recording);
    const steps = recording?.steps || [];
    const screenshotMap = getScreenshotMap(recording);
    const title = buildDisplayTitle(recording);
    const hintMarkup = printMode ? "" : `<p class="hint">${escapeHtml(copy.hint)}</p>`;
    const stepsMarkup =
      steps.length > 0
        ? steps
            .map((step) =>
              buildStepHtml(step, screenshotMap.get(step.screenshot), {
                imageSrcResolver,
                copy
              })
            )
            .join("\n")
        : `<div class="empty-state">${escapeHtml(copy.noSteps)}</div>`;

    return `
      <main class="report">
        <header class="report-header">
          <div>
            <p class="eyebrow">ScreenSteps</p>
            <h1>${escapeHtml(copy.reportTitle)} ${escapeHtml(title)}</h1>
            <p class="lead">${escapeHtml(copy.lead)}</p>
          </div>
          <div class="session-stats">
            <div><span>${escapeHtml(copy.steps)}</span><strong>${steps.length}</strong></div>
            <div><span>${escapeHtml(copy.start)}</span><strong>${escapeHtml(
              formatTimestamp(recording?.started_at, recording)
            )}</strong></div>
            <div><span>${escapeHtml(copy.end)}</span><strong>${escapeHtml(
              formatTimestamp(recording?.ended_at, recording)
            )}</strong></div>
          </div>
        </header>

        ${hintMarkup}

        <section class="session-card">
          <div>
            <span>${escapeHtml(copy.startPage)}</span>
            <strong>${escapeHtml(shortenUrl(recording?.initial_url || "-"))}</strong>
          </div>
          <div>
            <span>${escapeHtml(copy.lastPage)}</span>
            <strong>${escapeHtml(shortenUrl(recording?.current_url || recording?.initial_url || "-"))}</strong>
          </div>
        </section>

        <section class="steps-grid">
          ${stepsMarkup}
        </section>
      </main>
    `;
  }

  function buildStyles() {
    return `
      :root {
        color-scheme: light;
        --bg: #f7f4eb;
        --panel: #ffffff;
        --panel-soft: #f1f4f2;
        --border: rgba(22, 52, 40, 0.12);
        --text: #173529;
        --muted: #5f7369;
        --accent: #0f766e;
        --shadow: 0 18px 32px rgba(18, 41, 34, 0.08);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.08), transparent 24%),
          linear-gradient(180deg, #faf6eb, var(--bg));
      }

      .report {
        max-width: 1120px;
        margin: 0 auto;
        padding: 40px 24px 56px;
      }

      .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 18px;
      }

      .eyebrow {
        margin: 0 0 10px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: 34px;
        line-height: 1.05;
      }

      .lead {
        margin-top: 10px;
        max-width: 620px;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.45;
      }

      .hint {
        margin: 0 0 18px;
        color: var(--muted);
        font-size: 14px;
      }

      .session-stats,
      .session-card {
        display: grid;
        gap: 12px;
      }

      .session-stats {
        min-width: 260px;
      }

      .session-stats div,
      .session-card div {
        display: grid;
        gap: 4px;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.86);
        box-shadow: var(--shadow);
      }

      .session-stats span,
      .session-card span {
        font-size: 12px;
        color: var(--muted);
      }

      .session-stats strong,
      .session-card strong {
        font-size: 14px;
        line-height: 1.35;
        word-break: break-word;
      }

      .session-card {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        margin-bottom: 24px;
      }

      .steps-grid {
        display: grid;
        gap: 18px;
      }

      .step-card {
        overflow: hidden;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .step-image {
        display: block;
        width: 100%;
        max-height: 560px;
        object-fit: contain;
        background: #eaf1ed;
      }

      .step-image-empty {
        min-height: 220px;
        display: grid;
        place-items: center;
        color: var(--muted);
        background: var(--panel-soft);
      }

      .step-body {
        padding: 18px;
      }

      .step-kicker {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      h2 {
        font-size: 22px;
        line-height: 1.25;
      }

      .step-note {
        margin-top: 10px;
        color: var(--muted);
        font-size: 14px;
      }

      .empty-state {
        padding: 32px;
        border-radius: 20px;
        border: 1px dashed var(--border);
        background: rgba(255, 255, 255, 0.7);
        color: var(--muted);
        text-align: center;
      }

      @media (max-width: 760px) {
        .report {
          padding: 24px 16px 40px;
        }

        .report-header {
          flex-direction: column;
        }

        h1 {
          font-size: 28px;
        }
      }

      @media print {
        body {
          background: #ffffff;
        }

        .report {
          max-width: none;
          padding: 0;
        }

        .hint {
          display: none;
        }

        .step-card,
        .session-card div,
        .session-stats div {
          box-shadow: none;
        }

        .step-card {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `;
  }

  function buildHtmlDocument(source, options = {}) {
    const recording = resolveRecording(source);
    const { printMode = false, imageSrcResolver } = options;

    return `<!doctype html>
<html lang="${normalizeLanguage(recording?.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(buildFileName(recording, "html"))}</title>
    <style>${buildStyles()}</style>
  </head>
  <body>
    ${buildReportBody(recording, { printMode, imageSrcResolver })}
  </body>
</html>`;
  }

  function buildConfluenceReadyStyles() {
    return `
      body {
        margin: 0;
        padding: 24px;
        color: #172b4d;
        background: #f7f8fa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      .confluence-shell {
        max-width: 980px;
        margin: 0 auto;
      }

      .confluence-intro,
      .confluence-report {
        background: #ffffff;
        border: 1px solid #dfe1e6;
        border-radius: 12px;
      }

      .confluence-intro {
        margin-bottom: 16px;
        padding: 18px 20px;
      }

      .confluence-report {
        padding: 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: #6b778c;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3,
      p,
      ol,
      ul {
        margin-top: 0;
      }

      h1 {
        margin-bottom: 8px;
        font-size: 30px;
        line-height: 1.1;
      }

      .lead {
        margin-bottom: 14px;
        color: #42526e;
      }

      .session-meta {
        margin: 0 0 24px;
        padding: 0;
        list-style: none;
      }

      .session-meta li {
        margin-bottom: 6px;
      }

      .steps {
        margin: 0;
        padding-left: 22px;
      }

      .step {
        margin-bottom: 28px;
      }

      .step h2 {
        margin-bottom: 8px;
        font-size: 22px;
        line-height: 1.25;
      }

      .step-note {
        color: #5e6c84;
      }

      .step img {
        display: block;
        width: 100%;
        max-width: 100%;
        margin-top: 12px;
        border: 1px solid #dfe1e6;
        border-radius: 10px;
      }

      .empty-state {
        color: #5e6c84;
      }
    `;
  }

  function buildConfluenceReadyDocument(source) {
    const recording = resolveRecording(source);
    const copy = getCopy(recording);
    const steps = recording?.steps || [];
    const screenshotMap = getScreenshotMap(recording);
    const title = buildDisplayTitle(recording);
    const howToItems = (copy.confluenceHowToSteps || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const stepsMarkup =
      steps.length > 0
        ? steps
            .map((step) => {
              const screenshot = screenshotMap.get(step.screenshot);
              const note = buildStepNote(step, copy);
              const imageMarkup =
                screenshot?.data_url
                  ? `<img src="${escapeHtml(screenshot.data_url)}" alt="${escapeHtml(
                      `${copy.stepLabel} ${step.step}`
                    )}" />`
                  : "";

              return `
                <li class="step">
                  <h2>${escapeHtml(copy.stepLabel)} ${step.step}: ${escapeHtml(
                    step.description || "Interaction"
                  )}</h2>
                  ${note ? `<p class="step-note">${escapeHtml(note)}</p>` : ""}
                  ${imageMarkup}
                </li>
              `;
            })
            .join("\n")
        : `<p class="empty-state">${escapeHtml(copy.noSteps)}</p>`;

    return `<!doctype html>
<html lang="${normalizeLanguage(recording?.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(buildFileName(recording, "confluence.html"))}</title>
    <style>${buildConfluenceReadyStyles()}</style>
  </head>
  <body>
    <div class="confluence-shell">
      <section class="confluence-intro">
        <p class="eyebrow">ScreenSteps</p>
        <h1>${escapeHtml(copy.confluenceTitle)} ${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(copy.confluenceLead)}</p>
        <p>${escapeHtml(copy.confluenceHint)}</p>
        <h2>${escapeHtml(copy.confluenceHowToTitle)}</h2>
        <ol>${howToItems}</ol>
      </section>

      <main class="confluence-report">
        <p class="eyebrow">ScreenSteps</p>
        <h1>${escapeHtml(copy.reportTitle)} ${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(copy.lead)}</p>
        <ul class="session-meta">
          <li><strong>${escapeHtml(copy.start)}:</strong> ${escapeHtml(
            formatTimestamp(recording?.started_at, recording)
          )}</li>
          <li><strong>${escapeHtml(copy.end)}:</strong> ${escapeHtml(
            formatTimestamp(recording?.ended_at, recording)
          )}</li>
          <li><strong>${escapeHtml(copy.steps)}:</strong> ${steps.length}</li>
          <li><strong>${escapeHtml(copy.startPage)}:</strong> ${escapeHtml(
            shortenUrl(recording?.initial_url || "-")
          )}</li>
          <li><strong>${escapeHtml(copy.lastPage)}:</strong> ${escapeHtml(
            shortenUrl(recording?.current_url || recording?.initial_url || "-")
          )}</li>
        </ul>
        <ol class="steps">
          ${stepsMarkup}
        </ol>
      </main>
    </div>
  </body>
</html>`;
  }

  function buildClipboardHtml(source) {
    const recording = resolveRecording(source);
    const copy = getCopy(recording);
    const steps = recording?.steps || [];
    const screenshotMap = getScreenshotMap(recording);
    const title = buildDisplayTitle(recording);
    const metaCards = [
      { label: copy.steps, value: String(steps.length) },
      { label: copy.start, value: formatTimestamp(recording?.started_at, recording) },
      { label: copy.end, value: formatTimestamp(recording?.ended_at, recording) },
      { label: copy.startPage, value: shortenUrl(recording?.initial_url || "-") },
      { label: copy.lastPage, value: shortenUrl(recording?.current_url || recording?.initial_url || "-") }
    ];
    const metaMarkup = metaCards
      .map(
        (item) => `
          <td style="padding:0 12px 12px 0;vertical-align:top;">
            <div style="padding:12px 14px;border:1px solid #d9e4de;border-radius:14px;background:#f8fbf9;">
              <div style="font-size:12px;line-height:1.4;color:#5f7369;">${escapeHtml(item.label)}</div>
              <div style="margin-top:4px;font-size:14px;line-height:1.45;font-weight:700;color:#173529;word-break:break-word;">${escapeHtml(
                item.value
              )}</div>
            </div>
          </td>
        `
      )
      .join("");
    const stepsMarkup =
      steps.length > 0
        ? steps
            .map((step) => {
              const screenshot = screenshotMap.get(step.screenshot);
              const note = buildStepNote(step, copy);
              const noteMarkup = note
                ? `<div style="margin-top:8px;font-size:14px;line-height:1.5;color:#5f7369;">${escapeHtml(note)}</div>`
                : "";
              const imageMarkup = screenshot?.data_url
                ? `
                  <img
                    src="${escapeHtml(screenshot.data_url)}"
                    alt="${escapeHtml(`${copy.stepLabel} ${step.step}`)}"
                    style="display:block;width:100%;max-width:100%;margin-top:14px;border:1px solid #d9e4de;border-radius:14px;background:#f3f7f5;"
                  />
                `
                : "";

              return `
                <div style="margin-top:18px;padding:18px;border:1px solid #d9e4de;border-radius:18px;background:#ffffff;">
                  <div style="font-size:12px;line-height:1.4;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#5f7369;">
                    ${escapeHtml(copy.stepLabel)} ${step.step} · ${escapeHtml(step.action || "step")}
                  </div>
                  <div style="margin-top:8px;font-size:22px;line-height:1.3;font-weight:700;color:#173529;">
                    ${escapeHtml(step.description || "Interaction")}
                  </div>
                  ${noteMarkup}
                  ${imageMarkup}
                </div>
              `;
            })
            .join("")
        : `
          <div style="margin-top:18px;padding:20px;border:1px dashed #d9e4de;border-radius:18px;background:#ffffff;color:#5f7369;">
            ${escapeHtml(copy.noSteps)}
          </div>
        `;

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#173529;background:#f7f4eb;padding:24px;">
        <div style="max-width:840px;margin:0 auto;">
          <div style="font-size:12px;line-height:1.4;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#5f7369;">ScreenSteps</div>
          <div style="margin-top:8px;font-size:32px;line-height:1.15;font-weight:800;color:#173529;">
            ${escapeHtml(copy.reportTitle)} ${escapeHtml(title)}
          </div>
          <div style="margin-top:10px;font-size:15px;line-height:1.55;color:#5f7369;">
            ${escapeHtml(copy.lead)}
          </div>
          <table role="presentation" style="width:100%;margin-top:18px;border-collapse:collapse;">
            <tr>${metaMarkup}</tr>
          </table>
          ${stepsMarkup}
        </div>
      </div>
    `.trim();
  }

  function buildClipboardText(source) {
    const recording = resolveRecording(source);
    const copy = getCopy(recording);
    const steps = recording?.steps || [];
    const lines = [
      `ScreenSteps - ${buildDisplayTitle(recording)}`,
      "",
      `${copy.start}: ${formatTimestamp(recording?.started_at, recording)}`,
      `${copy.end}: ${formatTimestamp(recording?.ended_at, recording)}`,
      `${copy.steps}: ${steps.length}`,
      `${copy.startPage}: ${shortenUrl(recording?.initial_url || "-")}`,
      `${copy.lastPage}: ${shortenUrl(recording?.current_url || recording?.initial_url || "-")}`,
      ""
    ];

    for (const step of steps) {
      const note = buildStepNote(step, copy);
      lines.push(`${copy.stepLabel} ${step.step}: ${step.description || "Interaction"}`);
      if (note) {
        lines.push(note);
      }
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  async function legacyCopyToClipboard(html, text) {
    if (typeof document === "undefined" || typeof document.execCommand !== "function") {
      throw new Error("Clipboard access is not available.");
    }

    return new Promise((resolve, reject) => {
      const listener = (event) => {
        event.preventDefault();
        event.clipboardData?.setData("text/html", html);
        event.clipboardData?.setData("text/plain", text);
      };

      document.addEventListener("copy", listener, { once: true });
      const successful = document.execCommand("copy");
      document.removeEventListener("copy", listener);

      if (successful) {
        resolve();
      } else {
        reject(new Error("Clipboard access failed."));
      }
    });
  }

  async function copyRecordingToClipboard(source) {
    const recording = resolveRecording(source);

    if (!recording) {
      throw new Error("Keine Aufnahme zum Kopieren vorhanden.");
    }

    const html = buildClipboardHtml(recording);
    const text = buildClipboardText(recording);

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.write &&
      typeof globalThis.ClipboardItem === "function"
    ) {
      const item = new globalThis.ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      });
      await navigator.clipboard.write([item]);
      return;
    }

    await legacyCopyToClipboard(html, text);
  }

  function buildMarkdownDocument(source) {
    const recording = resolveRecording(source);
    const copy = getCopy(recording);
    const steps = recording?.steps || [];
    const screenshotMap = getScreenshotMap(recording);
    const lines = [
      "# ScreenSteps",
      "",
      `${copy.recordingOn} **${buildDisplayTitle(recording)}**`,
      "",
      `- ${copy.start}: ${formatTimestamp(recording?.started_at, recording)}`,
      `- ${copy.end}: ${formatTimestamp(recording?.ended_at, recording)}`,
      `- ${copy.steps}: ${steps.length}`,
      ""
    ];

    if (steps.length === 0) {
      lines.push(copy.noSteps);
      return lines.join("\n");
    }

    for (const step of steps) {
      const screenshot = screenshotMap.get(step.screenshot);
      const note = buildStepNote(step, copy);

      lines.push(`## ${copy.stepLabel} ${step.step}`);
      lines.push("");
      lines.push(step.description || "Interaction");
      lines.push("");

      if (note) {
        lines.push(note);
        lines.push("");
      }

      if (screenshot?.name) {
        lines.push(`![${copy.stepLabel} ${step.step}](images/${screenshot.name})`);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  function createCrc32Table() {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
      let current = index;

      for (let bit = 0; bit < 8; bit += 1) {
        current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
      }

      table[index] = current >>> 0;
    }

    return table;
  }

  const CRC32_TABLE = createCrc32Table();

  function calculateCrc32(bytes) {
    let crc = 0xffffffff;

    for (const byte of bytes) {
      crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  function toDosDateTime(input) {
    const date = input instanceof Date && !Number.isNaN(input.getTime()) ? input : new Date();
    const year = Math.max(date.getFullYear(), 1980);

    return {
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
    };
  }

  function createZipFileHeader(entry, nameBytes) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, entry.dosTime, true);
    view.setUint16(12, entry.dosDate, true);
    view.setUint32(14, entry.crc32, true);
    view.setUint32(18, entry.bytes.length, true);
    view.setUint32(22, entry.bytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);

    return header;
  }

  function createZipCentralHeader(entry, nameBytes, offset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, entry.dosTime, true);
    view.setUint16(14, entry.dosDate, true);
    view.setUint32(16, entry.crc32, true);
    view.setUint32(20, entry.bytes.length, true);
    view.setUint32(24, entry.bytes.length, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, offset, true);
    header.set(nameBytes, 46);

    return header;
  }

  function createZipBlob(entries) {
    const encoder = new TextEncoder();
    const localChunks = [];
    const centralChunks = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.name);
      const localHeader = createZipFileHeader(entry, nameBytes);
      localChunks.push(localHeader, entry.bytes);
      centralChunks.push(createZipCentralHeader(entry, nameBytes, offset));
      offset += localHeader.length + entry.bytes.length;
    }

    const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    return new Blob([...localChunks, ...centralChunks, endRecord], {
      type: "application/zip"
    });
  }

  async function dataUrlToBytes(dataUrl) {
    const response = await fetch(dataUrl);
    return new Uint8Array(await response.arrayBuffer());
  }

  async function buildMarkdownZipEntries(recording, folderName) {
    const encoder = new TextEncoder();
    const modifiedAt = new Date(recording?.ended_at || recording?.started_at || Date.now());
    const { date, time } = toDosDateTime(modifiedAt);
    const entries = [
      {
        name: `${folderName}/README.md`,
        bytes: encoder.encode(buildMarkdownDocument(recording)),
        dosDate: date,
        dosTime: time
      }
    ];

    for (const screenshot of recording.screenshots || []) {
      if (!screenshot?.data_url || !screenshot?.name) {
        continue;
      }

      entries.push({
        name: `${folderName}/images/${screenshot.name}`,
        bytes: await dataUrlToBytes(screenshot.data_url),
        dosDate: date,
        dosTime: time
      });
    }

    return entries.map((entry) => ({
      ...entry,
      crc32: calculateCrc32(entry.bytes)
    }));
  }

  async function buildHtmlZipEntries(recording, folderName) {
    const encoder = new TextEncoder();
    const modifiedAt = new Date(recording?.ended_at || recording?.started_at || Date.now());
    const { date, time } = toDosDateTime(modifiedAt);
    const htmlContent = buildHtmlDocument(recording, {
      imageSrcResolver: (screenshot) => `images/${screenshot.name}`
    });
    const entries = [
      {
        name: `${folderName}/index.html`,
        bytes: encoder.encode(htmlContent),
        dosDate: date,
        dosTime: time
      }
    ];

    for (const screenshot of recording.screenshots || []) {
      if (!screenshot?.data_url || !screenshot?.name) {
        continue;
      }

      entries.push({
        name: `${folderName}/images/${screenshot.name}`,
        bytes: await dataUrlToBytes(screenshot.data_url),
        dosDate: date,
        dosTime: time
      });
    }

    return entries.map((entry) => ({
      ...entry,
      crc32: calculateCrc32(entry.bytes)
    }));
  }

  async function downloadZip(entries, zipFileName) {
    const zipBlob = createZipBlob(entries);
    const zipUrl = URL.createObjectURL(zipBlob);

    await chrome.downloads.download({
      url: zipUrl,
      filename: zipFileName,
      conflictAction: "uniquify",
      saveAs: false
    });

    window.setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
  }

  async function downloadBlob(blob, fileName) {
    const blobUrl = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url: blobUrl,
      filename: fileName,
      conflictAction: "uniquify",
      saveAs: false
    });

    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  }

  async function downloadMarkdownZip(source) {
    const recording = resolveRecording(source);

    if (!recording) {
      throw new Error("Keine Aufnahme zum Exportieren vorhanden.");
    }

    const folderName = buildExportBaseName(recording);
    const zipFileName = `${folderName}.zip`;
    const entries = await buildMarkdownZipEntries(recording, folderName);
    await downloadZip(entries, zipFileName);

    return {
      folderName,
      zipFileName
    };
  }

  async function downloadHtmlZip(source) {
    const recording = resolveRecording(source);

    if (!recording) {
      throw new Error("Keine Aufnahme zum Exportieren vorhanden.");
    }

    const folderName = `${buildExportBaseName(recording)}-html`;
    const zipFileName = `${folderName}.zip`;
    const entries = await buildHtmlZipEntries(recording, folderName);
    await downloadZip(entries, zipFileName);

    return {
      folderName,
      zipFileName
    };
  }

  async function downloadConfluenceReadyHtml(source) {
    const recording = resolveRecording(source);

    if (!recording) {
      throw new Error("Keine Aufnahme zum Exportieren vorhanden.");
    }

    const fileName = `${buildExportBaseName(recording)}-confluence-ready.html`;
    const blob = new Blob([buildConfluenceReadyDocument(recording)], {
      type: "text/html;charset=utf-8"
    });

    await downloadBlob(blob, fileName);

    return {
      fileName
    };
  }

  function buildRecordingTransferPayload(source) {
    const recording = buildTransferRecording(source);

    if (!recording) {
      return null;
    }

    return {
      format: "screensteps-recording",
      format_version: 1,
      exported_at: new Date().toISOString(),
      recording
    };
  }

  async function downloadRecordingFile(source) {
    const payload = buildRecordingTransferPayload(source);

    if (!payload?.recording) {
      throw new Error("Keine Aufnahme zum Exportieren vorhanden.");
    }

    const fileName = buildRecordingFileName(payload.recording);
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/vnd.screensteps.recording+json;charset=utf-8"
    });

    await downloadBlob(blob, fileName);

    return {
      fileName
    };
  }

  globalThis.UiRecorderExportUtils = {
    buildClipboardHtml,
    buildFileName,
    buildRecordingTransferPayload,
    buildConfluenceReadyDocument,
    buildHtmlDocument,
    buildMarkdownDocument,
    copyRecordingToClipboard,
    downloadConfluenceReadyHtml,
    downloadMarkdownZip,
    downloadHtmlZip,
    downloadRecordingFile,
    downloadMarkdownBundle: downloadMarkdownZip,
    getLanguageLabel,
    normalizeLanguage,
    resolveRecording
  };
})();
