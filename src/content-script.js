(() => {
  if (window.top !== window) {
    return;
  }

  if (window.__uiRecorderInitialized) {
    return;
  }

  window.__uiRecorderInitialized = true;

  const MAX_TEXT_LENGTH = 120;
  const MAX_LABEL_LENGTH = 72;
  const CLICKABLE_SELECTOR = [
    "button",
    "a[href]",
    "summary",
    "[role='button']",
    "[role='link']",
    "input[type='button']",
    "input[type='submit']",
    "input[type='reset']",
    "input[type='image']"
  ].join(", ");
  const TEXT_INPUT_TYPES = new Set([
    "",
    "email",
    "number",
    "search",
    "tel",
    "text",
    "url"
  ]);
  const IGNORED_INPUT_TYPES = new Set([
    "button",
    "file",
    "hidden",
    "image",
    "range",
    "reset",
    "submit"
  ]);
  const CAPTURE_STYLE_ID = "__uiRecorderCaptureStyle";
  const COPY = {
    de: {
      fieldTypes: {
        textarea: "Textfeld",
        select: "Dropdown",
        button: "Button",
        link: "Link",
        section: "Bereich",
        checkbox: "Checkbox",
        radio: "Option",
        password: "Passwortfeld",
        email: "E-Mail-Feld",
        field: "Feld",
        element: "Element"
      },
      click: (typeName, label) =>
        label ? `Klick auf ${typeName} '${label}'` : `Klick auf ${typeName}`,
      select: (value, label) =>
        label
          ? `Option '${value}' in Dropdown '${label}' ausgewählt`
          : `Option '${value}' in Dropdown ausgewählt`,
      toggle: (typeName, label, checked) =>
        label
          ? `${typeName} '${label}' ${checked ? "aktiviert" : "deaktiviert"}`
          : `${typeName} ${checked ? "aktiviert" : "deaktiviert"}`,
      password: (label) =>
        label ? `Text in Passwortfeld '${label}' eingegeben` : "Text in Passwortfeld eingegeben",
      textInput: (label) => (label ? `Text in Feld '${label}' eingegeben` : "Text in Feld eingegeben"),
      textAreaInput: (label) =>
        label ? `Text in Textfeld '${label}' eingegeben` : "Text in Textfeld eingegeben",
      genericInput: (label) => (label ? `Eingabe in '${label}' geändert` : "Eingabe geändert")
    },
    en: {
      fieldTypes: {
        textarea: "text area",
        select: "dropdown",
        button: "button",
        link: "link",
        section: "section",
        checkbox: "checkbox",
        radio: "radio option",
        password: "password field",
        email: "email field",
        field: "field",
        element: "element"
      },
      click: (typeName, label) => (label ? `Clicked ${typeName} '${label}'` : `Clicked ${typeName}`),
      select: (value, label) =>
        label ? `Selected '${value}' in dropdown '${label}'` : `Selected '${value}' in dropdown`,
      toggle: (typeName, label, checked) =>
        label
          ? `${checked ? "Enabled" : "Disabled"} ${typeName} '${label}'`
          : `${checked ? "Enabled" : "Disabled"} ${typeName}`,
      password: (label) =>
        label ? `Entered text in password field '${label}'` : "Entered text in password field",
      textInput: (label) => (label ? `Entered text in field '${label}'` : "Entered text in field"),
      textAreaInput: (label) =>
        label ? `Entered text in text area '${label}'` : "Entered text in text area",
      genericInput: (label) => (label ? `Changed input in '${label}'` : "Changed input")
    }
  };

  let isRecording = false;
  let currentLanguage = "de";
  let lastSignature = "";
  let lastSentAt = 0;
  let captureLockCount = 0;

  function normalizeLanguage(language) {
    return language === "en" ? "en" : "de";
  }

  function getCopy() {
    return COPY[normalizeLanguage(currentLanguage)];
  }

  function ensureCaptureStyle() {
    let style = document.getElementById(CAPTURE_STYLE_ID);
    if (style) {
      return style;
    }

    style = document.createElement("style");
    style.id = CAPTURE_STYLE_ID;
    style.textContent = `
      html, body, * {
        scrollbar-width: none !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      *::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  function enableCaptureMode() {
    captureLockCount += 1;
    ensureCaptureStyle();
  }

  function disableCaptureMode() {
    captureLockCount = Math.max(0, captureLockCount - 1);
    if (captureLockCount > 0) {
      return;
    }

    document.getElementById(CAPTURE_STYLE_ID)?.remove();
  }

  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function truncate(value, maxLength = MAX_TEXT_LENGTH) {
    const normalized = normalizeText(value);
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 1)}...`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function looksLikeUrl(value) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return false;
    }

    return (
      /^https?:\/\//i.test(normalized) ||
      /^www\./i.test(normalized) ||
      /^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(normalized)
    );
  }

  function isLikelyTechnicalLabel(value) {
    const normalized = normalizeText(value);
    if (!normalized) {
      return true;
    }

    if (looksLikeUrl(normalized)) {
      return true;
    }

    if (/^[a-f0-9-]{12,}$/i.test(normalized)) {
      return true;
    }

    if (!/\s/.test(normalized) && normalized.length > 24 && /\d/.test(normalized)) {
      return true;
    }

    if (!/\s/.test(normalized) && (normalized.match(/[_:-]/g) || []).length >= 4) {
      return true;
    }

    return false;
  }

  function capitalizeWords(value) {
    return value.replace(/\b[a-z]/g, (match) => match.toUpperCase());
  }

  function humanizeIdentifier(value) {
    let normalized = safeDecode(normalizeText(value));
    if (!normalized) {
      return "";
    }

    normalized = normalized
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) {
      return "";
    }

    if (/^[a-z0-9 ]+$/.test(normalized)) {
      normalized = capitalizeWords(normalized);
    }

    return truncate(normalized, MAX_LABEL_LENGTH);
  }

  function getShortUrlLabel(value) {
    if (!value) {
      return "";
    }

    try {
      const parsed = new URL(value, window.location.href);
      const segments = parsed.pathname.split("/").filter(Boolean);

      for (let index = segments.length - 1; index >= 0; index -= 1) {
        const label = humanizeIdentifier(segments[index]);
        if (label && !isLikelyTechnicalLabel(label)) {
          return label;
        }
      }

      return truncate(parsed.hostname.replace(/^www\./i, ""), MAX_LABEL_LENGTH);
    } catch (error) {
      const normalized = normalizeText(value).replace(/^https?:\/\//i, "");
      const parts = normalized.split(/[/?#]/).filter(Boolean);
      const segment = humanizeIdentifier(parts[parts.length - 1] || "");
      return segment || truncate(parts[0] || normalized, MAX_LABEL_LENGTH);
    }
  }

  function getBestTextFragment(value) {
    const parts = String(value || "")
      .split(/\n+/)
      .map((part) => normalizeText(part))
      .filter(Boolean);

    if (parts.length === 0) {
      return "";
    }

    const shortNonUrl = parts.find(
      (part) => part.length <= MAX_LABEL_LENGTH && !looksLikeUrl(part) && !isLikelyTechnicalLabel(part)
    );
    if (shortNonUrl) {
      return shortNonUrl;
    }

    const readable = parts.find((part) => !looksLikeUrl(part) && !isLikelyTechnicalLabel(part));
    if (readable) {
      return readable;
    }

    return parts[0];
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function getVisibleText(element) {
    if (!element) {
      return "";
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === "button" || element.type === "submit" || element.type === "reset") {
        return truncate(element.value, MAX_LABEL_LENGTH);
      }
    }

    return truncate(getBestTextFragment(element.innerText || element.textContent || ""), MAX_LABEL_LENGTH);
  }

  function getDirectText(element) {
    if (!element) {
      return "";
    }

    const text = Array.from(element.childNodes || [])
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join(" ");

    return truncate(getBestTextFragment(text), MAX_LABEL_LENGTH);
  }

  function getHeadingText(element) {
    if (!element || typeof element.querySelector !== "function") {
      return "";
    }

    const heading = element.querySelector("h1, h2, h3, h4, h5, h6, [role='heading']");
    return heading ? truncate(getBestTextFragment(heading.textContent || ""), MAX_LABEL_LENGTH) : "";
  }

  function getDescendantMediaLabel(element) {
    if (!element || typeof element.querySelector !== "function") {
      return "";
    }

    const image = element.querySelector("img[alt]");
    if (image) {
      return truncate(image.getAttribute("alt"), MAX_LABEL_LENGTH);
    }

    const svgTitle = element.querySelector("svg title");
    if (svgTitle) {
      return truncate(svgTitle.textContent || "", MAX_LABEL_LENGTH);
    }

    return "";
  }

  function getAssociatedLabel(element) {
    if (!element) {
      return "";
    }

    if (element.labels && element.labels.length > 0) {
      return truncate(
        Array.from(element.labels)
          .map((label) => label.textContent || "")
          .join(" "),
        MAX_LABEL_LENGTH
      );
    }

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelText = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((node) => node.textContent || "")
        .join(" ");

      return truncate(labelText, MAX_LABEL_LENGTH);
    }

    return "";
  }

  function getMeaningfulCandidate(value, options = {}) {
    const { humanize = false, urlFallback = false } = options;
    const candidate = humanize ? humanizeIdentifier(value) : truncate(value, MAX_LABEL_LENGTH);
    if (!candidate) {
      return "";
    }

    if (looksLikeUrl(candidate)) {
      return urlFallback ? getShortUrlLabel(candidate) : "";
    }

    if (isLikelyTechnicalLabel(candidate)) {
      return "";
    }

    return candidate;
  }

  function getIdentifierFallback(element) {
    if (!element) {
      return "";
    }

    const candidates = [
      getMeaningfulCandidate(element.getAttribute("name"), { humanize: true }),
      getMeaningfulCandidate(element.id, { humanize: true })
    ];

    for (const candidate of candidates) {
      if (candidate) {
        return candidate;
      }
    }

    return "";
  }

  function getClickableLabel(element) {
    if (!element) {
      return "";
    }

    const baseCandidates = [
      getDirectText(element),
      getHeadingText(element),
      getVisibleText(element),
      getMeaningfulCandidate(element.getAttribute("aria-label")),
      getMeaningfulCandidate(element.getAttribute("title")),
      getAssociatedLabel(element),
      getDescendantMediaLabel(element)
    ];

    for (const candidate of baseCandidates) {
      const readable = getMeaningfulCandidate(candidate);
      if (readable) {
        return readable;
      }
    }

    if (element instanceof HTMLAnchorElement || element.getAttribute("role") === "link") {
      const hrefLabel = getShortUrlLabel(element.getAttribute("href") || element.href || "");
      if (hrefLabel) {
        return hrefLabel;
      }
    }

    return getIdentifierFallback(element);
  }

  function getFieldLabel(element) {
    if (!element) {
      return "";
    }

    const baseCandidates = [
      getAssociatedLabel(element),
      getMeaningfulCandidate(element.getAttribute("aria-label")),
      getMeaningfulCandidate(element.getAttribute("placeholder")),
      getMeaningfulCandidate(element.getAttribute("title")),
      getDirectText(element),
      getVisibleText(element),
      getDescendantMediaLabel(element)
    ];

    for (const candidate of baseCandidates) {
      const readable = getMeaningfulCandidate(candidate);
      if (readable) {
        return readable;
      }
    }

    return getIdentifierFallback(element);
  }

  function getSelectValue(select) {
    return truncate(
      Array.from(select.selectedOptions || [])
        .map((option) => option.textContent || option.value || "")
        .join(", ")
    );
  }

  function getFieldTypeName(element) {
    const copy = getCopy();
    const tagName = element.tagName.toLowerCase();

    if (tagName === "textarea") {
      return copy.fieldTypes.textarea;
    }

    if (tagName === "select") {
      return copy.fieldTypes.select;
    }

    if (tagName === "button") {
      return copy.fieldTypes.button;
    }

    if (tagName === "a") {
      return copy.fieldTypes.link;
    }

    if (tagName === "summary") {
      return copy.fieldTypes.section;
    }

    if (tagName === "input") {
      const inputType = (element.getAttribute("type") || "").toLowerCase();

      if (inputType === "checkbox") {
        return copy.fieldTypes.checkbox;
      }

      if (inputType === "radio") {
        return copy.fieldTypes.radio;
      }

      if (inputType === "password") {
        return copy.fieldTypes.password;
      }

      if (inputType === "email") {
        return copy.fieldTypes.email;
      }

      return copy.fieldTypes.field;
    }

    return copy.fieldTypes.element;
  }

  function getAttributes(element) {
    if (!element) {
      return {};
    }

    return {
      id: element.id || "",
      name: element.getAttribute("name") || "",
      "aria-label": element.getAttribute("aria-label") || "",
      role: element.getAttribute("role") || "",
      type:
        element instanceof HTMLInputElement ||
        element instanceof HTMLButtonElement ||
        element instanceof HTMLTextAreaElement
          ? element.getAttribute("type") || ""
          : "",
      placeholder: element.getAttribute("placeholder") || "",
      href: element.getAttribute("href") || "",
      "data-testid":
        element.getAttribute("data-testid") || element.getAttribute("data-test") || ""
    };
  }

  function buildMarkerFromRect(rect, originalMarker = null, event = null) {
    if (!rect) {
      return null;
    }

    const hasOriginalMarker =
      originalMarker &&
      typeof originalMarker === "object" &&
      Number.isFinite(Number(originalMarker.clickX)) &&
      Number.isFinite(Number(originalMarker.clickY));

    let clickX = rect.left + Math.max(rect.width, 24) / 2;
    let clickY = rect.top + Math.max(rect.height, 24) / 2;

    if (typeof event?.clientX === "number" && typeof event?.clientY === "number") {
      clickX = event.clientX;
      clickY = event.clientY;
    } else if (hasOriginalMarker) {
      const originalX = Number(originalMarker.x);
      const originalY = Number(originalMarker.y);
      const originalWidth = Number(originalMarker.width);
      const originalHeight = Number(originalMarker.height);
      const relativeX =
        Number.isFinite(originalWidth) && originalWidth > 0
          ? clamp((Number(originalMarker.clickX) - originalX) / originalWidth, 0, 1)
          : 0.5;
      const relativeY =
        Number.isFinite(originalHeight) && originalHeight > 0
          ? clamp((Number(originalMarker.clickY) - originalY) / originalHeight, 0, 1)
          : 0.5;

      clickX = rect.left + rect.width * relativeX;
      clickY = rect.top + rect.height * relativeY;
    }

    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      clickX,
      clickY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }

  function getMarker(element, event, originalMarker = null) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return null;
    }

    return buildMarkerFromRect(element.getBoundingClientRect(), originalMarker, event);
  }

  function resolveElementBySelector(selector) {
    if (!selector) {
      return null;
    }

    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function resolveElementByXPath(xpath) {
    if (!xpath) {
      return null;
    }

    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue instanceof Element ? result.singleNodeValue : null;
    } catch (error) {
      return null;
    }
  }

  function registerMarkerCandidate(candidateMap, element, score) {
    if (!(element instanceof Element)) {
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) {
      return;
    }

    const previousScore = candidateMap.get(element) || 0;
    candidateMap.set(element, Math.max(previousScore, score));
  }

  function registerAttributeCandidates(candidateMap, attributes = {}) {
    if (!attributes || typeof attributes !== "object") {
      return;
    }

    if (attributes.id) {
      registerMarkerCandidate(candidateMap, document.getElementById(attributes.id), 110);
    }

    if (attributes["data-testid"]) {
      const value = cssEscape(attributes["data-testid"]);
      for (const element of document.querySelectorAll(`[data-testid="${value}"], [data-test="${value}"]`)) {
        registerMarkerCandidate(candidateMap, element, 104);
      }
    }

    if (attributes.name) {
      const value = cssEscape(attributes.name);
      for (const element of document.querySelectorAll(`[name="${value}"]`)) {
        registerMarkerCandidate(candidateMap, element, 94);
      }
    }

    if (attributes["aria-label"]) {
      const value = cssEscape(attributes["aria-label"]);
      for (const element of document.querySelectorAll(`[aria-label="${value}"]`)) {
        registerMarkerCandidate(candidateMap, element, 92);
      }
    }

    if (attributes.href) {
      let normalizedHref = "";

      try {
        normalizedHref = new URL(attributes.href, window.location.href).href;
      } catch (error) {
        normalizedHref = attributes.href;
      }

      for (const element of document.querySelectorAll("a[href]")) {
        if (element.href === normalizedHref || element.getAttribute("href") === attributes.href) {
          registerMarkerCandidate(candidateMap, element, 96);
        }
      }
    }
  }

  function scoreMarkerCandidate(element, originalMarker = null) {
    if (!(element instanceof Element) || !originalMarker || typeof originalMarker !== "object") {
      return 0;
    }

    const rect = element.getBoundingClientRect();
    const originalCenterX = Number(originalMarker.x) + Number(originalMarker.width || 0) / 2;
    const originalCenterY = Number(originalMarker.y) + Number(originalMarker.height || 0) / 2;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - originalCenterX, centerY - originalCenterY);
    let score = Math.max(0, 42 - distance * 0.35);

    if (
      Number.isFinite(Number(originalMarker.clickX)) &&
      Number.isFinite(Number(originalMarker.clickY)) &&
      Number(originalMarker.clickX) >= rect.left &&
      Number(originalMarker.clickX) <= rect.right &&
      Number(originalMarker.clickY) >= rect.top &&
      Number(originalMarker.clickY) <= rect.bottom
    ) {
      score += 36;
    }

    return score;
  }

  function resolveMarkerElement(payload = {}) {
    const candidateMap = new Map();

    registerMarkerCandidate(candidateMap, resolveElementBySelector(payload.selector), 140);
    registerMarkerCandidate(candidateMap, resolveElementByXPath(payload.xpath), 126);
    registerAttributeCandidates(candidateMap, payload.attributes);

    const candidates = Array.from(candidateMap.entries());
    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((left, right) => {
      const leftScore = left[1] + scoreMarkerCandidate(left[0], payload.marker);
      const rightScore = right[1] + scoreMarkerCandidate(right[0], payload.marker);
      return rightScore - leftScore;
    });

    return candidates[0][0];
  }

  function resolveMarker(payload = {}) {
    const element = resolveMarkerElement(payload);
    if (!element) {
      return payload.marker || null;
    }

    return getMarker(element, null, payload.marker || null);
  }

  function buildSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    if (element.id) {
      return `#${cssEscape(element.id)}`;
    }

    const segments = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let segment = current.localName;

      if (!segment) {
        break;
      }

      if (current.id) {
        segment += `#${cssEscape(current.id)}`;
        segments.unshift(segment);
        break;
      }

      const stableAttributes = [
        ["name", current.getAttribute("name")],
        ["type", current.getAttribute("type")],
        ["role", current.getAttribute("role")],
        ["aria-label", current.getAttribute("aria-label")],
        ["data-testid", current.getAttribute("data-testid") || current.getAttribute("data-test")]
      ];

      const matchingAttribute = stableAttributes.find(([, value]) => normalizeText(value));
      if (matchingAttribute) {
        const [attributeName, attributeValue] = matchingAttribute;
        segment += `[${attributeName}="${cssEscape(attributeValue)}"]`;
      }

      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter(
          (child) => child.localName === current.localName
        );

        if (siblings.length > 1) {
          segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }

      segments.unshift(segment);

      const selector = segments.join(" > ");
      try {
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
      } catch (error) {
        break;
      }

      current = current.parentElement;
    }

    return segments.join(" > ");
  }

  function buildXPath(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const segments = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const siblings = current.parentNode
        ? Array.from(current.parentNode.children).filter((child) => child.tagName === current.tagName)
        : [];
      const index = siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : "";
      segments.unshift(`${tagName}${index}`);
      current = current.parentElement;
    }

    return `/${segments.join("/")}`;
  }

  function shouldSend(signature) {
    const now = Date.now();
    if (signature === lastSignature && now - lastSentAt < 500) {
      return false;
    }

    lastSignature = signature;
    lastSentAt = now;
    return true;
  }

  function findRelevantClickTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const elements = path.filter((node) => node instanceof Element);

    for (const element of elements) {
      if (element.matches && element.matches(CLICKABLE_SELECTOR)) {
        return element;
      }
    }

    return event.target instanceof Element ? event.target.closest(CLICKABLE_SELECTOR) : null;
  }

  function isTrackableField(element) {
    if (!element || !(element instanceof Element)) {
      return false;
    }

    if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      return true;
    }

    if (element instanceof HTMLInputElement) {
      const inputType = (element.type || "").toLowerCase();
      return !IGNORED_INPUT_TYPES.has(inputType);
    }

    return false;
  }

  function describeClick(element) {
    const copy = getCopy();
    const label = getClickableLabel(element);
    const typeName = getFieldTypeName(element);
    return {
      action: "click",
      description: copy.click(typeName, label),
      label
    };
  }

  function describeFieldChange(element) {
    const copy = getCopy();
    const label = getFieldLabel(element);

    if (element instanceof HTMLSelectElement) {
      const selectedLabel = getSelectValue(element);
      return {
        action: "select",
        description: copy.select(selectedLabel, label),
        label,
        value_preview: selectedLabel
      };
    }

    if (element instanceof HTMLInputElement) {
      const inputType = (element.type || "").toLowerCase();

      if (inputType === "checkbox" || inputType === "radio") {
        return {
          action: "toggle",
          description: copy.toggle(getFieldTypeName(element), label, element.checked),
          label,
          checked: element.checked
        };
      }

      if (inputType === "password") {
        return {
          action: "input",
          description: copy.password(label),
          label
        };
      }

      if (TEXT_INPUT_TYPES.has(inputType)) {
        return {
          action: "input",
          description: copy.textInput(label),
          label,
          value_preview: truncate(element.value)
        };
      }
    }

    if (element instanceof HTMLTextAreaElement) {
      return {
        action: "input",
        description: copy.textAreaInput(label),
        label,
        value_preview: truncate(element.value)
      };
    }

    return {
      action: "input",
      description: copy.genericInput(label),
      label
    };
  }

  function buildPayload(element, descriptionData, event) {
    return {
      ...descriptionData,
      selector: buildSelector(element),
      xpath: buildXPath(element),
      attributes: getAttributes(element),
      marker: getMarker(element, event),
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  }

  function sendStep(payload) {
    const signature = [
      payload.action,
      payload.selector,
      payload.url,
      payload.label,
      payload.value_preview || "",
      payload.checked
    ].join("|");

    if (!shouldSend(signature)) {
      return;
    }

    chrome.runtime.sendMessage({
      type: "recorder:track-step",
      payload: {
        ...payload,
        signature
      }
    });
  }

  function handleClick(event) {
    if (!isRecording) {
      return;
    }

    const target = findRelevantClickTarget(event);
    if (!target) {
      return;
    }

    sendStep(buildPayload(target, describeClick(target), event));
  }

  function handleChange(event) {
    if (!isRecording) {
      return;
    }

    const target = event.target;
    if (!isTrackableField(target)) {
      return;
    }

    sendStep(buildPayload(target, describeFieldChange(target), event));
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "recorder:set-recording") {
      isRecording = Boolean(message.active);
      currentLanguage = normalizeLanguage(message.language);
      sendResponse({ ok: true, active: isRecording });
      return true;
    }

    if (message.type === "recorder:prepare-capture") {
      enableCaptureMode();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "recorder:finish-capture") {
      disableCaptureMode();
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "recorder:resolve-marker") {
      sendResponse({ ok: true, marker: resolveMarker(message.payload || {}) });
      return true;
    }

    return false;
  });

  document.addEventListener("click", handleClick, true);
  document.addEventListener("change", handleChange, true);

  chrome.runtime.sendMessage({ type: "recorder:get-state" }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      return;
    }

    currentLanguage = normalizeLanguage(
      response.state?.session?.language || response.state?.preferences?.recording_language
    );
    isRecording = Boolean(response.state?.activeForTab);
  });
})();
