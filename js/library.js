(function () {
  "use strict";

  const app = document.getElementById("library-app");
  if (!app) return;

  const elements = {
    grid: document.getElementById("library-grid"),
    detail: document.getElementById("library-detail"),
    status: document.getElementById("library-status"),
    authorProfile: document.getElementById("library-author-profile"),
    summary: document.getElementById("library-summary"),
    search: document.getElementById("library-search"),
    sortMenu: document.getElementById("library-sort-menu"),
    sortOptions: Array.from(document.querySelectorAll('input[name="library-sort"]')),
    filterMenu: document.getElementById("library-filter-menu"),
    filterListed: document.getElementById("library-filter-listed"),
    filterReview: document.getElementById("library-filter-review"),
    filterHidden: document.getElementById("library-filter-hidden"),
    filterCount: document.getElementById("library-filter-count"),
    filterHint: document.getElementById("library-filter-hint"),
    categories: document.getElementById("library-categories"),
    heroModules: document.getElementById("library-hero-modules"),
    heroDevelopers: document.getElementById("library-hero-developers"),
    previous: document.getElementById("library-prev"),
    next: document.getElementById("library-next"),
    pageLabel: document.getElementById("library-page-label"),
    pagination: document.querySelector(".library-pagination"),
    addButton: document.getElementById("library-add"),
    adminButton: document.getElementById("library-admin"),
    logoutButton: document.getElementById("library-admin-logout"),
    addDialog: document.getElementById("library-add-dialog"),
    addForm: document.getElementById("library-add-form"),
    repository: document.getElementById("library-repository"),
    submitStatus: document.getElementById("library-submit-status"),
    adminDialog: document.getElementById("library-admin-dialog"),
    adminForm: document.getElementById("library-admin-form"),
    adminKey: document.getElementById("library-admin-key"),
    adminStatus: document.getElementById("library-admin-status"),
    scoreDialog: document.getElementById("library-score-dialog"),
    scoreTitle: document.getElementById("library-score-title"),
    scoreSummary: document.getElementById("library-score-summary"),
    scoreBreakdown: document.getElementById("library-score-breakdown"),
    vtDialog: document.getElementById("library-vt-dialog"),
    vtTitle: document.getElementById("library-vt-title"),
    vtDescription: document.getElementById("library-vt-description"),
    apiDebugButton: document.getElementById("library-api-debug"),
    apiDebugDialog: document.getElementById("library-api-debug-dialog"),
    apiDebugSummary: document.getElementById("library-api-debug-summary"),
    apiDebugJson: document.getElementById("library-api-debug-json"),
    apiDebugCopy: document.getElementById("library-api-debug-copy")
  };

  const initialUrl = new URL(window.location.href);
  const initialPage = Number.parseInt(initialUrl.searchParams.get("page") || "1", 10);
  const initialSort = initialUrl.searchParams.get("sort") || "stars";
  const initialDirection = initialUrl.searchParams.get("direction") || "desc";
  const initialStates = (initialUrl.searchParams.get("states") || "LISTED")
    .split(",").map((value) => value.trim().toUpperCase()).filter(Boolean);
  const allowedStates = new Set(["LISTED", "NEEDS_REVIEW", "HIDDEN"]);
  const state = {
    page: Number.isInteger(initialPage) && initialPage > 0 && initialPage <= 100001 ? initialPage - 1 : 0,
    size: 12,
    totalPages: 0,
    totalItems: 0,
    items: [],
    query: String(initialUrl.searchParams.get("q") || "").slice(0, 100),
    author: "",
    sort: ["stars", "score", "updated", "name"].includes(initialSort) ? initialSort : "stars",
    direction: ["asc", "desc"].includes(initialDirection) ? initialDirection : "desc",
    selectedStates: initialStates.length && initialStates.every((value) => allowedStates.has(value))
      ? Array.from(new Set(initialStates)) : ["LISTED"],
    selectedTag: initialUrl.searchParams.get("tag") || "",
    availableTags: [],
    adminKey: sessionStorage.getItem("jme-library-admin-key") || "",
    requestNumber: 0,
    lastApiExchange: null
  };

  const apiBase = resolveApiBase(app.dataset.apiBase || "");
  const hiddenTopics = new Set((app.dataset.hiddenTopics || "")
    .split(",")
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean));

  function resolveApiBase(value) {
    try {
      const url = new URL(value, window.location.origin);
      const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      const sameHostHttp = url.protocol === "http:"
        && window.location.protocol === "http:"
        && url.hostname === window.location.hostname;
      if (url.protocol !== "https:" && !(url.protocol === "http:" && (local || sameHostHttp))) {
        throw new Error("The Library API must use HTTPS.");
      }
      return url.href.replace(/\/$/, "");
    } catch (error) {
      showStatus(error.message || "The Library API address is invalid.", true);
      return "";
    }
  }

  function safeUrl(value, repositoryOnly) {
    if (!value) return "";
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return "";
      if (url.username || url.password) return "";
      if (repositoryOnly && url.hostname !== "github.com") return "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function safeImageUrl(value) {
    const href = safeUrl(value);
    if (!href) return "";
    try {
      const url = new URL(href);
      const allowed = new Set([
        "raw.githubusercontent.com", "user-images.githubusercontent.com",
        "private-user-images.githubusercontent.com", "i.imgur.com",
        "opengraph.githubassets.com", "avatars.githubusercontent.com", "github.com"
      ]);
      return allowed.has(url.hostname.toLowerCase()) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined && text !== null) result.textContent = text;
    return result;
  }

  function icon(name) {
    const result = node("i", `fas fa-${name}`);
    result.setAttribute("aria-hidden", "true");
    return result;
  }

  function button(label, className, handler, iconName) {
    const result = node("button", className);
    result.type = "button";
    if (iconName) result.append(icon(iconName));
    result.append(document.createTextNode(label));
    result.addEventListener("click", handler);
    return result;
  }

  function externalLink(label, className, href, iconName) {
    const result = node("a", className);
    result.href = href;
    result.target = "_blank";
    result.rel = "noopener noreferrer";
    if (iconName) {
      const linkIcon = iconName === "github" ? node("i", "fab fa-github") : icon(iconName);
      linkIcon.setAttribute("aria-hidden", "true");
      result.append(linkIcon);
    }
    result.append(document.createTextNode(label));
    return result;
  }

  function showStatus(message, error) {
    elements.status.hidden = !message;
    elements.status.classList.toggle("library-status--error", Boolean(error));
    elements.status.textContent = message || "";
  }

  async function fetchJson(path, options) {
    if (!apiBase) throw new Error("Library API is not configured.");
    const request = options || {};
    const method = request.method || "GET";
    const startedAt = new Date();
    const headers = new Headers(request.headers || {});
    headers.set("Accept", "application/json");
    if (request.body) headers.set("Content-Type", "application/json");
    if (request.admin && state.adminKey) headers.set("X-API-Key", state.adminKey);
    const url = `${apiBase}${path}`;
    const visibleRequestHeaders = debugHeaders(headers);
    const visibleRequestBody = request.admin && !path.includes("/moderation")
      ? (request.body ? "[omitted for authenticated request]" : null)
      : parseJsonOrText(request.body || "");
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: request.body,
        mode: "cors",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
      const responseText = response.status === 204 ? "" : await response.text();
      const responseBody = parseJsonOrText(responseText);
      recordApiExchange({
        timestamp: startedAt.toISOString(),
        durationMs: Date.now() - startedAt.getTime(),
        request: {
          method,
          url,
          authenticated: Boolean(request.admin),
          headers: visibleRequestHeaders,
          body: boundedDebugValue(visibleRequestBody)
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: debugHeaders(response.headers),
          body: boundedDebugValue(responseBody)
        }
      });
      if (!response.ok) {
        const detail = responseBody && typeof responseBody === "object"
          ? (responseBody.message || responseBody.error || "") : "";
        const error = new Error(detail || `Request failed (${response.status}).`);
        error.status = response.status;
        throw error;
      }
      return response.status === 204 ? null : responseBody;
    } catch (error) {
      if (!state.lastApiExchange || state.lastApiExchange.timestamp !== startedAt.toISOString()) {
        recordApiExchange({
          timestamp: startedAt.toISOString(),
          durationMs: Date.now() - startedAt.getTime(),
          request: {
            method,
            url,
            authenticated: Boolean(request.admin),
            headers: visibleRequestHeaders,
            body: boundedDebugValue(visibleRequestBody)
          },
          response: { networkError: error.message || "Request failed" }
        });
      }
      throw error;
    }
  }

  function parseJsonOrText(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (_) {
      return String(value);
    }
  }

  function debugHeaders(headers) {
    const hidden = new Set(["authorization", "cookie", "set-cookie", "x-api-key"]);
    const result = {};
    headers.forEach((value, name) => {
      if (!hidden.has(name.toLowerCase())) result[name] = value;
    });
    return result;
  }

  function boundedDebugValue(value) {
    if (value === null || value === undefined) return null;
    try {
      const serialized = JSON.stringify(value);
      return serialized.length <= 200000
        ? value
        : { truncated: true, originalCharacters: serialized.length };
    } catch (_) {
      return "[unserializable value]";
    }
  }

  function recordApiExchange(exchange) {
    state.lastApiExchange = exchange;
    elements.apiDebugButton.classList.add("library-api-debug-trigger--ready");
  }

  function normalizedTopics(item) {
    return (item.topics || []).filter((topic) => !hiddenTopics.has(String(topic).toLowerCase()));
  }

  function moduleTitle(item) {
    return item.displayName || item.name || item.fullName || "Untitled module";
  }

  function authorName(item) {
    return item.author?.name || item.author?.githubAccount || item.owner || "Unknown author";
  }

  function authorUrl(item) {
    const account = authorLogin(item);
    if (!account || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(account)) return "";
    return safeUrl(`https://github.com/${account}`, true);
  }

  function authorLogin(item) {
    const account = item?.owner || item?.author?.githubAccount;
    return account && /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(account)
      ? account : "";
  }

  function selectAuthor(login) {
    if (!login) return;
    state.query = `author:${login}`;
    state.author = login.toLowerCase();
    state.page = 0;
    elements.search.value = state.query;
    syncCatalogUrl("push");
    loadModules();
  }

  function authorByline(item, className) {
    const byline = node("p", className);
    byline.append(document.createTextNode("by "));
    const login = authorLogin(item);
    if (login) {
      const author = button(authorName(item), "library-author-link", (event) => {
        event.stopPropagation();
        selectAuthor(login);
      }, "user");
      author.title = `Show only modules published by @${login}`;
      byline.append(author);
    } else {
      byline.append(document.createTextNode(authorName(item)));
    }
    return byline;
  }

  function scoreValue(item) {
    return Number.isFinite(item.score?.score) ? item.score.score : null;
  }

  function starValue(item) {
    return Number.isInteger(item.stars) && item.stars >= 0 ? item.stars : null;
  }

  function stateLabel(item) {
    if (item.processingStatus === "PENDING") return "PENDING";
    if (item.moderationState && item.moderationState !== "AUTO") {
      return item.moderationState.replaceAll("_", " ");
    }
    return (item.visibilityDecision || "UNSCORED").replaceAll("_", " ");
  }

  function isInactive(item) {
    return item.processingStatus === "PENDING" ||
      item.moderationState === "BANNED" ||
      item.visibilityDecision === "HIDDEN" ||
      item.visibilityDecision === "REJECTED" ||
      item.visibilityDecision === "NEEDS_REVIEW";
  }

  function visibilityWarning(item) {
    if (item.processingStatus === "PENDING") {
      return "Warning: this module version is still being verified and should not be used.";
    }
    if (item.visibilityDecision === "NEEDS_REVIEW") {
      return "Warning: this module needs review and should not be used without verification.";
    }
    if (item.visibilityDecision === "HIDDEN" || item.visibilityDecision === "REJECTED") {
      return "Warning: this module is hidden and should not be used without verification.";
    }
    return "";
  }

  function hardGateReason(value) {
    const gate = String(value || "");
    if (gate === "missing-root-coordinate" || gate === "missing-coordinate") {
      return "No verified Maven Central, GitHub Packages, or frozen JitPack artifact was found.";
    }
    if (gate === "scoring-retry-exhausted") {
      return "Automated verification could not be completed after all retry attempts.";
    }
    if (gate === "scoring-verification-pending") {
      return "Automated verification is temporarily unavailable and has been scheduled for another attempt.";
    }
    if (gate === "root-analysis-time-budget") {
      return "Artifact analysis exceeded the configured safety time limit.";
    }
    if (gate === "dependency-resolution-failed") {
      return "One or more required runtime dependencies could not be resolved from the configured registry.";
    }
    if (gate.startsWith("artifact-not-downloaded:")) {
      return "The published artifact could not be downloaded for verification.";
    }
    if (gate.startsWith("jar-analysis-failed:")) {
      return "The downloaded artifact could not be analyzed safely.";
    }
    if (gate.startsWith("virustotal-malicious:")) {
      const coordinate = gate.substring("virustotal-malicious:".length);
      return coordinate
        ? `VirusTotal reported malicious detections for ${coordinate}.`
        : "VirusTotal reported malicious detections in the artifact or one of its dependencies.";
    }
    if (gate.startsWith("virustotal-suspicious:")) {
      const coordinate = gate.substring("virustotal-suspicious:".length);
      return coordinate
        ? `VirusTotal reported suspicious detections for ${coordinate}.`
        : "VirusTotal reported suspicious detections that require verification.";
    }
    if (gate.startsWith("osv-advisory:")) {
      return "A vulnerability advisory exceeded the configured acceptance threshold.";
    }
    if (gate.startsWith("dangerous-invocation:")) {
      return "Bytecode analysis found a runtime operation blocked by the security policy.";
    }
    if (gate.startsWith("scm-url-mismatch:")) {
      return "The published package does not identify this GitHub repository as its source.";
    }
    if (gate.startsWith("optional-adapter-failed:")) {
      return "An additional security analyzer failed and the configured policy blocks publication.";
    }
    return gate ? `A publication safety gate failed: ${gate}.` : "";
  }

  function pendingCheckReason(check) {
    if (!check) return "Automated verification has not completed yet.";
    let reason = String(check.message || "Automated verification has not completed yet.").trim();
    if (check.coordinate) reason += ` Artifact: ${check.coordinate}.`;
    if (check.eligibleAt) {
      const eligibleAt = new Date(check.eligibleAt);
      const remainingHours = Math.max(0, Math.ceil((eligibleAt.getTime() - Date.now()) / 3600000));
      const remaining = remainingHours >= 48
        ? `about ${Math.ceil(remainingHours / 24)} days remaining`
        : remainingHours > 0 ? `about ${remainingHours} hours remaining` : "eligible now";
      reason += ` Earliest retry: ${snapshotDate(check.eligibleAt)} (${remaining}).`;
    }
    return reason;
  }

  function visibilityReasons(item, limit = 3) {
    if (item.processingStatus === "PENDING") {
      const pending = Array.isArray(item.pendingChecks) ? item.pendingChecks : [];
      const reasons = pending.map(pendingCheckReason).filter(Boolean);
      return reasons.length ? Array.from(new Set(reasons)).slice(0, limit)
        : ["Automated verification has not completed yet."];
    }
    if (item.moderationState === "HIDDEN") return ["Hidden by catalog moderation."];
    if (item.moderationState === "NEEDS_REVIEW") return ["Flagged by catalog moderation for manual review."];

    const score = item.score || {};
    const reasons = (item.analysisErrors || []).map((reason) => String(reason)).filter(Boolean);
    (score.hardGateFailures || []).forEach((gate) => {
      if (gate === "dependency-resolution-failed"
          && reasons.some((reason) => reason.startsWith("Dependency resolution failed"))) return;
      const reason = hardGateReason(gate);
      if (reason) reasons.push(reason);
    });
    if (!reasons.length) {
      const relevantWarnings = (score.warnings || []).filter((warning) =>
        /VirusTotal|OSV|vulnerab|malware|artifact|Jar analysis|SCM URL|Scoring failed/i.test(String(warning))
      );
      relevantWarnings.forEach((warning) => reasons.push(String(warning)));
    }
    if (!reasons.length && Number.isFinite(score.score)) {
      reasons.push(`The automated verification score (${score.score}) did not meet the publication threshold.`);
    }
    if (!reasons.length) reasons.push("Automated verification did not meet the publication requirements.");
    return Array.from(new Set(reasons)).slice(0, limit);
  }

  function encodedPath(value) {
    return String(value || "").split("/").map((part) => encodeURIComponent(part)).join("/");
  }

  function markdownDestination(value, item, image) {
    if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return "";
    let target = String(value).trim().replace(/^<|>$/g, "");
    if (!target) return "";
    if (!image && /^#[A-Za-z0-9_.:%~-]+$/.test(target)) {
      return `#library-readme-anchor-${target.slice(1)}`;
    }
    if (target.startsWith("//")) target = `https:${target}`;
    try {
      const absolute = new URL(target);
      if (absolute.username || absolute.password) return "";
      if (absolute.protocol === "http:" && absolute.hostname.toLowerCase() === "github.com") {
        absolute.protocol = "https:";
      }
      if (image && absolute.protocol === "http:"
          && absolute.hostname.toLowerCase() === "i.imgur.com") {
        absolute.protocol = "https:";
      }
      const safeLinkProtocol = absolute.protocol === "https:" || absolute.protocol === "http:"
        || (absolute.protocol === "mailto:" && !image);
      if (!safeLinkProtocol || (image && absolute.protocol !== "https:")) return "";
      if (image) {
        const allowed = new Set([
          "github.com", "raw.githubusercontent.com", "user-images.githubusercontent.com",
          "private-user-images.githubusercontent.com", "avatars.githubusercontent.com", "i.imgur.com"
        ]);
        if (!allowed.has(absolute.hostname.toLowerCase())) return "";
      }
      return absolute.href;
    } catch (_) {
      // Relative repository path; resolve it against the README location.
    }

    const repository = safeUrl(item.repositoryUrl, true);
    if (!repository || target.startsWith("/")) return "";
    try {
      const repositoryUrl = new URL(repository);
      const repositoryPath = repositoryUrl.pathname.replace(/\/$/, "");
      const branch = image && /^[a-f0-9]{40}$/i.test(String(item.revisionSha || ""))
        ? String(item.revisionSha).toLowerCase()
        : encodedPath(item.defaultBranch || "main");
      const base = image
        ? `https://raw.githubusercontent.com${repositoryPath}/${branch}/README.md`
        : `https://github.com${repositoryPath}/blob/${branch}/README.md`;
      const resolved = new URL(target, base);
      const expectedPrefix = image
        ? `${repositoryPath}/${branch}/`
        : `${repositoryPath}/`;
      if (image) {
        if (resolved.hostname !== "raw.githubusercontent.com" || !resolved.pathname.startsWith(expectedPrefix)) return "";
      } else if (resolved.hostname !== "github.com" || !resolved.pathname.startsWith(expectedPrefix)) {
        return "";
      }
      return resolved.href;
    } catch (_) {
      return "";
    }
  }

  function renderReadme(item) {
    if (!item.readmeMarkdown) return null;
    const section = node("section", "library-readme");
    const content = node("div", "library-readme-content");
    if (!window.marked || !window.DOMPurify) {
      const fallback = node("pre", "library-readme-fallback");
      fallback.append(node("code", "", String(item.readmeMarkdown)));
      content.append(fallback);
      section.append(content);
      return section;
    }

    const rendered = window.marked.parse(String(item.readmeMarkdown), {
      async: false,
      gfm: true,
      breaks: false
    });
    const fragment = window.DOMPurify.sanitize(rendered, {
      USE_PROFILES: { html: true },
      RETURN_DOM_FRAGMENT: true,
      ALLOW_DATA_ATTR: false,
      SANITIZE_NAMED_PROPS: true,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "button", "audio", "video", "svg", "math"],
      FORBID_ATTR: ["style", "srcset"]
    });
    content.append(fragment);

    const usedAnchors = new Set();
    content.querySelectorAll("a[name], a[id]").forEach((anchor) => {
      const raw = String(anchor.getAttribute("name") || anchor.id || "")
        .replace(/^user-content-/, "");
      if (!/^[A-Za-z0-9_.:%~-]+$/.test(raw)) {
        anchor.removeAttribute("name");
        anchor.removeAttribute("id");
        return;
      }
      const id = `library-readme-anchor-${raw}`;
      anchor.removeAttribute("name");
      anchor.id = id;
      usedAnchors.add(id);
    });
    content.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
      const slug = String(heading.textContent || "")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N} _-]/gu, "")
        .replace(/\s+/g, "-");
      if (!slug) return;
      let id = `library-readme-anchor-${slug}`;
      let suffix = 1;
      while (usedAnchors.has(id)) id = `library-readme-anchor-${slug}-${suffix++}`;
      if (!heading.id) heading.id = id;
      usedAnchors.add(heading.id);
    });
    content.querySelectorAll("a").forEach((link) => {
      if (!link.hasAttribute("href") && link.id) return;
      const href = markdownDestination(link.getAttribute("href"), item, false);
      if (!href) {
        link.replaceWith(document.createTextNode(link.textContent || ""));
        return;
      }
      link.href = href;
      if (href.startsWith("#")) {
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.removeAttribute("referrerpolicy");
        return;
      }
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.referrerPolicy = "no-referrer";
    });
    content.querySelectorAll("img").forEach((picture) => {
      const source = markdownDestination(picture.getAttribute("src"), item, true);
      if (!source) {
        picture.replaceWith(document.createTextNode(picture.alt || ""));
        return;
      }
      picture.src = source;
      picture.removeAttribute("srcset");
      picture.classList.add("library-readme-image");
      picture.loading = "lazy";
      picture.decoding = "async";
      picture.referrerPolicy = "no-referrer";
    });
    content.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
      input.removeAttribute("name");
    });
    section.append(content);
    return section;
  }

  function createVisibilityWarning(item, detail) {
    const warningText = visibilityWarning(item);
    if (!warningText) return null;
    const warning = node("aside", `library-card-warning${detail ? " library-detail-warning" : ""}`);
    const message = node("p", "library-card-warning-message");
    message.append(icon("triangle-exclamation"), document.createTextNode(` ${warningText}`));
    warning.append(message, node("strong", "library-card-warning-title", "Reason"));
    const reasons = node("ul", "library-card-warning-reasons");
    visibilityReasons(item, detail ? 16 : 3)
      .forEach((reason) => reasons.append(node("li", "", reason)));
    warning.append(reasons);
    return warning;
  }

  function compatibilityText(item) {
    const compatibility = item.compatibility || {};
    if (compatibility.recommended) return `Recommended ${compatibility.recommended}`;
    return "Version not specified";
  }

  function compatibilityTooltip(item) {
    const compatibility = item.compatibility || {};
    return [
      `Recommended: ${compatibility.recommended || "not specified"}`,
      `Minimum: ${compatibility.minimum || "not specified"}`,
      `Maximum: ${compatibility.maximum || "not specified"}`
    ].join("\n");
  }

  function renderCard(item) {
    const card = node("article", "library-card");
    if (isInactive(item)) card.classList.add("library-card--inactive");

    const imageWrap = node("div", "library-card-image");
    const imageUrl = safeImageUrl(item.images?.[0]);
    if (imageUrl) {
      const image = node("img");
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => image.remove());
      imageWrap.append(image);
    }
    imageWrap.append(node("span", "library-card-monogram", moduleTitle(item).slice(0, 1).toUpperCase()));
    if (state.adminKey || isInactive(item)) {
      imageWrap.append(node("span", "library-state-chip", stateLabel(item)));
    }

    const body = node("div", "library-card-body");
    const heading = node("h2", "library-card-title");
    const openButton = button(moduleTitle(item), "library-card-open", () => openDetail(item, true));
    heading.append(openButton);
    const byline = authorByline(item, "library-card-author");
    const description = node("p", "library-card-description", item.description || "A community module for jMonkeyEngine.");
    const tags = node("div", "library-tags");
    normalizedTopics(item).slice(0, 4).forEach((topic) => tags.append(tagButton(topic)));
    const warning = createVisibilityWarning(item, false);

    const facts = node("div", "library-card-facts");
    const stars = node("span", "library-card-fact");
    const knownStars = starValue(item);
    stars.append(icon("star"), document.createTextNode(knownStars === null ? " —" : ` ${knownStars}`));
    if (knownStars === null) stars.title = "GitHub star count is being refreshed";
    const compatibility = node("span", "library-card-fact library-card-version", compatibilityText(item));
    compatibility.title = compatibilityTooltip(item);
    compatibility.setAttribute("aria-label", compatibilityTooltip(item));
    facts.append(stars, compatibility);
    body.append(heading, byline, description, tags);
    if (warning) body.append(warning);
    body.append(facts);
    card.append(imageWrap, body);

    card.addEventListener("click", (event) => {
      if (!event.target.closest("a, button")) openDetail(item, true);
    });
    return card;
  }

  function scoreTone(value) {
    if (value === null) return "neutral";
    if (value < 0) return "danger";
    if (value < 40) return "warning";
    return "good";
  }

  function renderList() {
    elements.detail.hidden = true;
    elements.grid.hidden = false;
    elements.pagination.hidden = false;
    elements.authorProfile.hidden = !state.author;
    elements.grid.replaceChildren();
    const items = state.items;
    items.forEach((item) => elements.grid.append(renderCard(item)));
    if (!items.length) {
      elements.grid.append(node("div", "library-empty", "No modules matched your search and visibility filters."));
    }
    const selectedStates = selectedVisibilityStates();
    const scope = selectedStates.length === 1 && selectedStates[0] === "LISTED" ? "listed" : "catalog";
    elements.summary.textContent = `${state.totalItems} ${scope} module${state.totalItems === 1 ? "" : "s"}`;
    elements.pageLabel.textContent = state.totalPages ? `Page ${state.page + 1} of ${state.totalPages}` : "Page 1";
    elements.previous.disabled = state.page <= 0;
    elements.next.disabled = state.page + 1 >= state.totalPages;
  }

  async function loadModules() {
    const requestNumber = ++state.requestNumber;
    showStatus("Loading modules…", false);
    const params = new URLSearchParams({
      page: String(state.page), size: String(state.size), q: state.query,
      sort: state.sort, direction: state.direction
    });
    params.set("states", selectedVisibilityStates().join(","));
    if (state.selectedTag) params.set("tag", state.selectedTag);
    const path = state.adminKey ? `/admin/extensions?${params}` : `/api/extensions?${params}`;
    try {
      const result = await fetchJson(path, { admin: Boolean(state.adminKey) });
      if (requestNumber !== state.requestNumber) return;
      state.items = Array.isArray(result.items) ? result.items : [];
      state.page = Number(result.page) || 0;
      state.totalPages = Number(result.totalPages) || 0;
      state.totalItems = Number(result.totalItems) || 0;
      state.author = typeof result.author === "string" ? result.author : "";
      showStatus("", false);
      renderList();
      await loadAuthorProfile(requestNumber);
      await openRequestedModule(false);
    } catch (error) {
      if (requestNumber !== state.requestNumber) return;
      if (error.status === 401 || error.status === 403) endAdminSession(false);
      elements.grid.replaceChildren();
      showStatus(error.message || "Could not load the module catalog.", true);
      elements.summary.textContent = "The catalog is currently unavailable.";
    }
  }

  function formattedCount(value) {
    return Number.isInteger(value) && value >= 0 ? new Intl.NumberFormat().format(value) : "—";
  }

  function profileWebsite(value) {
    if (!value) return "";
    const candidate = /^https:\/\//i.test(value) ? value : `https://${value}`;
    return safeUrl(candidate);
  }

  function renderAuthorProfile(profile, login) {
    elements.authorProfile.replaceChildren();
    const githubUrl = safeUrl(`https://github.com/${login}`, true);
    const avatar = safeImageUrl(profile?.avatarUrl || `https://github.com/${login}.png`);
    const picture = node("div", "library-author-profile-avatar");
    if (avatar) {
      const image = node("img");
      image.src = avatar;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      picture.append(image);
    } else {
      picture.append(icon("user"));
    }
    const body = node("div", "library-author-profile-body");
    const heading = node("div", "library-author-profile-heading");
    const names = node("div");
    names.append(node("span", "library-dialog-kicker",
      String(profile?.type || "GitHub author").toLowerCase() === "organization"
        ? "GitHub organization" : "GitHub author"));
    names.append(node("h2", "", profile?.displayName || login));
    if (githubUrl) names.append(externalLink(`@${login}`, "library-author-profile-login", githubUrl, "github"));
    const clear = button("Clear author", "btn btn-outline library-pill-button library-author-profile-clear", () => {
      state.query = state.query.split(/\s+/).filter((token) => !/^author:/i.test(token)).join(" ");
      state.author = "";
      state.page = 0;
      elements.search.value = state.query;
      syncCatalogUrl("push");
      loadModules();
    }, "xmark");
    heading.append(names, clear);
    body.append(heading);
    if (profile?.bio) body.append(node("p", "library-author-profile-bio", profile.bio));
    const metadata = node("div", "library-author-profile-metadata");
    [
      ["users", `${formattedCount(profile?.followers)} followers`],
      ["user-plus", `${formattedCount(profile?.following)} following`],
      ["code-branch", `${formattedCount(profile?.publicRepositories)} public repositories`],
      ["location-dot", profile?.location],
      ["building", profile?.company]
    ].forEach(([iconName, text]) => {
      if (!text) return;
      const entry = node("span");
      entry.append(icon(iconName), document.createTextNode(` ${text}`));
      metadata.append(entry);
    });
    const website = profileWebsite(profile?.websiteUrl);
    if (website) metadata.append(externalLink("Website", "", website, "globe"));
    if (profile?.publicEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.publicEmail)) {
      const email = node("a");
      email.href = `mailto:${profile.publicEmail}`;
      email.append(icon("envelope"), document.createTextNode(` ${profile.publicEmail}`));
      metadata.append(email);
    }
    if (profile?.createdAt) {
      const created = new Date(profile.createdAt);
      if (!Number.isNaN(created.getTime())) {
        const entry = node("span");
        entry.append(icon("calendar"), document.createTextNode(` On GitHub since ${created.getFullYear()}`));
        metadata.append(entry);
      }
    }
    body.append(metadata);
    elements.authorProfile.append(picture, body);
    elements.authorProfile.hidden = false;
  }

  async function loadAuthorProfile(requestNumber) {
    if (!state.author) {
      elements.authorProfile.hidden = true;
      elements.authorProfile.replaceChildren();
      return;
    }
    const login = state.author;
    renderAuthorProfile(null, login);
    try {
      const profile = await fetchJson(`/api/extensions/authors/${encodeURIComponent(login)}`);
      if (requestNumber !== state.requestNumber || login !== state.author) return;
      renderAuthorProfile(profile, login);
    } catch (_) {
      // Keep the safe username/GitHub fallback when profile metadata is unavailable.
    }
  }

  function detailRow(label, value) {
    if (!value) return null;
    const row = node("div", "library-detail-row");
    row.append(node("dt", "", label), node("dd", "", value));
    return row;
  }

  function tagButton(topic) {
    const result = button(topic, "library-tag library-tag--button", () => {
      state.selectedTag = state.selectedTag.toLowerCase() === String(topic).toLowerCase() ? "" : topic;
      state.page = 0;
      syncCatalogUrl("push");
      renderCategories();
      loadModules();
    });
    if (state.selectedTag.toLowerCase() === String(topic).toLowerCase()) {
      result.classList.add("library-tag--active");
      result.setAttribute("aria-pressed", "true");
    } else {
      result.setAttribute("aria-pressed", "false");
    }
    return result;
  }

  function renderCategories() {
    elements.categories.replaceChildren();
    if (state.selectedTag) {
      const clear = button("All", "library-category library-category--clear", () => {
        state.selectedTag = "";
        state.page = 0;
        syncCatalogUrl("push");
        renderCategories();
        loadModules();
      });
      elements.categories.append(clear);
    }
    const visibleTags = visibleCategoryTags();
    const counts = visibleTags.map((tag) => Math.max(1, Number(tag.count) || 1));
    const minimumCount = counts.length ? Math.min(...counts) : 1;
    const maximumCount = counts.length ? Math.max(...counts) : 1;
    visibleTags
      .forEach((tag, index) => {
        const count = Math.max(0, Number(tag.count) || 0);
        const chip = button(String(tag.name), "library-category", () => {
          state.selectedTag = state.selectedTag.toLowerCase() === String(tag.name).toLowerCase()
            ? "" : String(tag.name);
          state.page = 0;
          syncCatalogUrl("push");
          renderCategories();
          loadModules();
        });
        const logarithmicRange = Math.log(maximumCount) - Math.log(minimumCount);
        const prominence = logarithmicRange > 0
          ? (Math.log(Math.max(1, count)) - Math.log(minimumCount)) / logarithmicRange
          : 1;
        const distance = visibleTags.length > 1 ? index / (visibleTags.length - 1) : 0;
        chip.style.setProperty("--category-prominence", prominence.toFixed(3));
        chip.style.setProperty("--category-distance", distance.toFixed(3));
        chip.title = `${count} module${count === 1 ? "" : "s"}`;
        chip.setAttribute("aria-label", `${tag.name}: ${count} module${count === 1 ? "" : "s"}`);
        if (state.selectedTag.toLowerCase() === String(tag.name).toLowerCase()) {
          chip.classList.add("library-category--active");
          chip.setAttribute("aria-pressed", "true");
        } else {
          chip.setAttribute("aria-pressed", "false");
        }
        elements.categories.append(chip);
      });
  }

  function visibleCategoryTags() {
    return state.availableTags
      .filter((tag) => tag?.name && !hiddenTopics.has(String(tag.name).toLowerCase()));
  }

  function updateHeroMetric(element, value) {
    if (!element || !Number.isInteger(value) || value < 0) return;
    element.textContent = new Intl.NumberFormat().format(value);
    element.setAttribute("aria-busy", "false");
  }

  async function loadCategories() {
    // Category navigation describes the reviewed public catalog. Review and
    // hidden entries can be inspected through visibility filters, but must not
    // influence the public category taxonomy or its usage counts.
    const params = new URLSearchParams({ states: "LISTED" });
    try {
      const result = await fetchJson(`/api/extensions/tags?${params}`);
      state.availableTags = Array.isArray(result.items) ? result.items : [];
      if (!result.truncated) {
        updateHeroMetric(elements.heroDevelopers, Number(result.uniqueDevelopers));
      }
      renderCategories();
    } catch (_) {
      state.availableTags = [];
      renderCategories();
    }
  }

  async function loadCatalogStats() {
    const params = new URLSearchParams({
      page: "0", size: "1", q: "", sort: "stars", direction: "desc", states: "LISTED"
    });
    try {
      const result = await fetchJson(`/api/extensions?${params}`);
      updateHeroMetric(elements.heroModules, Number(result.totalItems));
    } catch (_) {
      // The catalog itself reports the actionable error; keep the metric placeholder.
    }
  }

  function virusTotalIndicator(item) {
    const status = (item.virusTotalStatus || "NOT_SCANNED").toUpperCase();
    const tone = {
      CLEAN: "clean",
      MALICIOUS: "danger",
      SUSPICIOUS: "warning",
      PENDING: "warning",
      UNAVAILABLE: "danger",
      NOT_CONFIGURED: "neutral",
      NOT_SCANNED: "neutral"
    }[status] || "neutral";
    const label = `VirusTotal: ${status.replaceAll("_", " ").toLowerCase()}`;
    const indicator = node("button", `library-vt-indicator library-vt-indicator--${tone}`);
    indicator.type = "button";
    indicator.setAttribute("aria-label", label);
    indicator.title = label;
    indicator.append(icon("shield-halved"));
    indicator.addEventListener("click", () => {
      const explanations = {
        CLEAN: "VirusTotal found no malicious or suspicious detections for the exact artifact bytes analyzed by the catalog.",
        MALICIOUS: "VirusTotal reported one or more malicious detections. The module is rejected regardless of its other score signals.",
        SUSPICIOUS: "VirusTotal reported suspicious detections. The module requires careful manual verification.",
        PENDING: "The artifact was submitted to VirusTotal and its analysis is still in progress.",
        UNAVAILABLE: "VirusTotal could not be reached or did not return a trustworthy result. The backend will retry.",
        NOT_CONFIGURED: "VirusTotal scanning is not configured on this backend instance.",
        NOT_SCANNED: "No completed VirusTotal scan is available for this artifact."
      };
      const affectedArtifacts = (item.score?.breakdown || [])
        .filter((check) => String(check?.name || "").toLowerCase() === "virustotal")
        .filter((check) => ["REJECTED", "WARN", "NEEDS_REVIEW"].includes(
          String(check?.status || "").toUpperCase()))
        .map((check) => check?.coordinate)
        .filter(Boolean);
      const affected = Array.from(new Set(affectedArtifacts));
      elements.vtTitle.textContent = label;
      elements.vtDescription.textContent = `${explanations[status] || explanations.NOT_SCANNED}${
        affected.length ? ` Affected artifact${affected.length === 1 ? "" : "s"}: ${affected.join(", ")}.` : ""
      }`;
      elements.vtDialog.showModal();
    });
    return indicator;
  }

  function jitPackIndicator(item) {
    const artifacts = Array.isArray(item.artifacts) ? item.artifacts : [];
    if (!artifacts.some((artifact) => artifact?.registry === "JITPACK")) return null;
    const indicator = node("span", "library-registry-warning");
    indicator.setAttribute("role", "img");
    indicator.setAttribute("aria-label", "Generated by JitPack from an immutable Git commit");
    indicator.title = "Generated by JitPack from a release or tag pinned to a full Git commit. JitPack artifacts are accepted only after its seven-day freeze period.";
    indicator.append(icon("triangle-exclamation"));
    return indicator;
  }

  function createGallery(item) {
    const gallery = node("div", "library-gallery");
    const urls = (item.images || []).map((value) => safeImageUrl(value)).filter(Boolean);
    if (!urls.length) {
      gallery.append(node("div", "library-gallery-fallback", moduleTitle(item).slice(0, 1).toUpperCase()));
      return gallery;
    }
    let selected = 0;
    const image = node("img", "library-gallery-image");
    image.alt = `${moduleTitle(item)} preview`;
    image.referrerPolicy = "no-referrer";
    const count = node("span", "library-gallery-count");
    const thumbnails = node("div", "library-gallery-thumbnails");
    thumbnails.setAttribute("aria-label", "Preview images");
    const thumbnailButtons = urls.map((url, index) => {
      const thumbnail = button(`Show image ${index + 1}`, "library-gallery-thumbnail", () => {
        selected = index;
        update();
      });
      const preview = node("img");
      preview.src = url;
      preview.alt = "";
      preview.loading = "lazy";
      preview.referrerPolicy = "no-referrer";
      preview.addEventListener("error", () => thumbnail.remove());
      thumbnail.replaceChildren(preview, node("span", "sr-only", `Show image ${index + 1}`));
      thumbnails.append(thumbnail);
      return thumbnail;
    });
    const update = () => {
      image.src = urls[selected];
      count.textContent = `${selected + 1} / ${urls.length}`;
      thumbnailButtons.forEach((thumbnail, index) => {
        thumbnail.classList.toggle("library-gallery-thumbnail--active", index === selected);
        if (index === selected) thumbnail.setAttribute("aria-current", "true");
        else thumbnail.removeAttribute("aria-current");
      });
    };
    gallery.append(image, count);
    if (urls.length > 1) gallery.append(thumbnails);
    if (urls.length > 1) {
      gallery.append(
        button("Previous image", "library-gallery-control library-gallery-control--previous", () => {
          selected = (selected - 1 + urls.length) % urls.length; update();
        }, "chevron-left"),
        button("Next image", "library-gallery-control library-gallery-control--next", () => {
          selected = (selected + 1) % urls.length; update();
        }, "chevron-right")
      );
    }
    update();
    return gallery;
  }

  function renderPlatforms(item) {
    const platforms = Array.isArray(item.platforms) ? item.platforms : [];
    if (!platforms.length) return null;
    const section = node("section", "library-platforms");
    const heading = node("h3", "", "Supported platforms");
    const source = String(item.platformDetectionSource || "").replaceAll("_", " ").toLowerCase();
    if (source) heading.title = `Compatibility source: ${source}`;
    section.append(heading);
    const list = node("div", "library-platform-list");
    const metadata = {
      ANDROID: ["Android", "android"],
      WINDOWS: ["Windows", "windows"],
      LINUX: ["Linux", "linux"],
      MACOS: ["macOS", "apple"],
      IOS: ["iOS", "apple"]
    };
    platforms.forEach((platform) => {
      const os = String(platform?.operatingSystem || "").toUpperCase();
      if (!metadata[os]) return;
      const [label, iconName] = metadata[os];
      const card = node("div", "library-platform");
      const osIcon = node("i", `fab fa-${iconName}`);
      osIcon.setAttribute("aria-hidden", "true");
      card.append(osIcon, node("span", "library-platform-name", label));
      const badges = node("div", "library-platform-architectures");
      const architectures = new Set((platform.architectures || []).map((value) => String(value).toUpperCase()));
      const architectureMetadata = {
        X86_64: os === "IOS"
          ? ["X86_64", "64-bit Intel iOS Simulator"]
          : ["X86_64", "64-bit Intel/AMD"],
        ARM64: ["ARM64", os === "MACOS" ? "ARM64 Apple Silicon" : "64-bit ARM"]
      };
      ["X86_64", "ARM64"].forEach((architecture) => {
        if (!architectures.has(architecture)) return;
        const [architectureLabel, architectureTitle] = architectureMetadata[architecture];
        const badge = node("span", "library-platform-architecture", architectureLabel);
        badge.title = architectureTitle;
        badges.append(badge);
      });
      if (architectures.has("UNKNOWN") || !badges.children.length) {
        if (!architectures.has("UNKNOWN")) return;
        const badge = node("span", "library-platform-architecture library-platform-architecture--unknown", "?");
        badge.title = "Architecture not identified";
        badges.append(badge);
      }
      card.append(badges);
      list.append(card);
    });
    section.append(list);
    return section;
  }

  function registryLabel(artifact) {
    if (!artifact || !artifact.groupId || !artifact.artifactId || !artifact.version) return "Not available";
    const provider = artifact.registry === "GITHUB_PACKAGES"
      ? "GitHub Packages"
      : artifact.registry === "JITPACK" ? "JitPack" : "Maven Central";
    const packaging = String(artifact.packaging || "jar").toUpperCase();
    return packaging === "JAR" ? provider : `${provider} · ${packaging}`;
  }

  function renderPublishedModules(item) {
    const artifacts = Array.isArray(item.artifacts) ? item.artifacts : [];
    if (!artifacts.length) return null;
    const section = node("section", "library-published-modules");
    section.append(node("h3", "", artifacts.length === 1 ? "Published module" : "Published modules"));
    const list = node("ul", "library-published-modules-list");
    artifacts.forEach((artifact) => {
      if (!artifact?.groupId || !artifact?.artifactId || !artifact?.version) return;
      const entry = node("li", "");
      entry.append(
        node("code", "", `${artifact.groupId}:${artifact.artifactId}:${artifact.version}`),
        node("span", "", registryLabel(artifact))
      );
      list.append(entry);
    });
    section.append(list);
    return section;
  }

  function renderModeration(item) {
    const section = node("section", "library-moderation");
    section.append(node("h3", "", "Moderation"));
    section.append(node("p", "", `Current state: ${stateLabel(item)}.`));
    const actions = node("div", "library-moderation-actions");
    [
      ["AUTO", "Use automatic decision"],
      ["LISTED", "List"],
      ["NEEDS_REVIEW", "Needs review"],
      ["HIDDEN", "Hide"],
      ["BANNED", "Ban"]
    ].forEach(([value, label]) => {
      actions.append(button(label, value === "BANNED" ? "btn library-danger-button" : "btn btn-outline", async () => {
        if (value === "BANNED" && !window.confirm("Ban this module? It will not be rescanned or shown publicly.")) return;
        try {
          const updated = await fetchJson(`/admin/extensions/${encodeURIComponent(item.githubRepositoryId)}/moderation`, {
            method: "POST", admin: true, body: JSON.stringify({ state: value })
          });
          Object.assign(item, updated);
          await loadModules();
        } catch (error) {
          showStatus(error.message || "Moderation failed.", true);
        }
      }));
    });
    section.append(actions);
    return section;
  }

  function humanScoreCheck(value) {
    return String(value || "check")
      .replaceAll(/[:._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function scoreDelta(value) {
    const numeric = Number.isFinite(value) ? Math.max(-100, Math.min(100, value)) : 0;
    return numeric > 0 ? `+${numeric}` : String(numeric);
  }

  function openScoreDialog(item) {
    const score = item.score || {};
    const value = scoreValue(item);
    elements.scoreTitle.textContent = value === null
      ? `${moduleTitle(item)} has not been scored yet`
      : `${moduleTitle(item)} scored ${value}`;
    elements.scoreSummary.replaceChildren();
    elements.scoreBreakdown.replaceChildren();

    const summary = node("dl", "library-score-summary");
    [
      ["Final score", value === null ? "Not available" : String(value)],
      ["Confidence", Number.isFinite(score.confidence) ? `${score.confidence}%` : "Not available"],
      ["Decision", String(score.decision || item.visibilityDecision || "Pending").replaceAll("_", " ")]
    ].forEach(([label, result]) => summary.append(detailRow(label, result)));
    elements.scoreSummary.append(summary);

    const pendingChecks = Array.isArray(item.pendingChecks) ? item.pendingChecks : [];
    if (item.processingStatus === "PENDING" || pendingChecks.length) {
      const pendingSection = node("section", "library-score-section");
      pendingSection.append(node("h3", "", "Pending verification"));
      const list = node("ul", "library-score-gates");
      (pendingChecks.length ? pendingChecks : [{ message: "Automated verification has not completed yet." }])
        .forEach((check) => {
          list.append(node("li", "", pendingCheckReason({
            ...check,
            message: check.message || humanScoreCheck(check.type)
          })));
        });
      pendingSection.append(list);
      elements.scoreBreakdown.append(pendingSection);
    }

    const gates = Array.isArray(score.hardGateFailures) ? score.hardGateFailures : [];
    const gateSection = node("section", "library-score-section");
    gateSection.append(node("h3", "", gates.length ? "Blocking gates" : "Blocking gates passed"));
    if (gates.length) {
      const list = node("ul", "library-score-gates");
      gates.forEach((gate) => list.append(node("li", "", hardGateReason(gate))));
      gateSection.append(list);
    } else {
      gateSection.append(node("p", "library-score-passed", "No hard gate failure was reported."));
    }
    elements.scoreBreakdown.append(gateSection);

    const rawChecks = Array.isArray(score.breakdown) ? score.breakdown : [];
    // Older scorer versions incorrectly repeated the module author's trust on
    // every dependency. Never present those legacy rows as dependency evidence.
    const relevantChecks = rawChecks.filter((check) => !(
      String(check.scope || "").toLowerCase() === "dependency"
      && String(check.name || "").toLowerCase() === "github-author-trust"
    ));
    const checks = relevantChecks.slice(0, 256);
    const appendCheckList = (section, sectionChecks, includeCoordinate) => {
      const list = node("ol", "library-score-checks");
      sectionChecks.forEach((check) => {
        const row = node("li", "library-score-check");
        const heading = node("div", "library-score-check-heading");
        const title = node("strong", "", humanScoreCheck(check.name));
        const delta = node("span", `library-score-delta library-score-delta--${Number(check.scoreDelta) < 0 ? "negative" : Number(check.scoreDelta) > 0 ? "positive" : "neutral"}`,
          scoreDelta(check.scoreDelta));
        heading.append(title, delta);
        const metadata = [
          check.scope,
          check.status,
          check.excluded ? "excluded from aggregate" : "",
          includeCoordinate ? check.coordinate : ""
        ].filter(Boolean).join(" · ");
        row.append(heading, node("small", "", metadata));
        if (check.message) row.append(node("p", "", String(check.message)));
        list.append(row);
      });
      section.append(list);
    };

    if (!checks.length) {
      const checkSection = node("section", "library-score-section");
      checkSection.append(node("h3", "", "Score checks"));
      checkSection.append(node("p", "", "A per-check breakdown is not available for this older snapshot. It will appear after the next analysis."));
      elements.scoreBreakdown.append(checkSection);
    } else {
      const moduleChecks = checks.filter((check) => String(check.scope || "").toLowerCase() !== "dependency");
      const moduleSection = node("section", "library-score-section");
      moduleSection.append(node("h3", "", "Module assessment"));
      moduleSection.append(node("p", "library-score-explanation",
        "Author trust applies only to the submitted module. These signals determine the module's own score."));
      if (moduleChecks.length) appendCheckList(moduleSection, moduleChecks, true);
      elements.scoreBreakdown.append(moduleSection);

      const dependencyChecks = checks.filter((check) => String(check.scope || "").toLowerCase() === "dependency");
      const dependencySection = node("section", "library-score-section");
      dependencySection.append(node("h3", "", "Dependency risk"));
      dependencySection.append(node("p", "library-score-explanation",
        "A dependency can maintain or lower the final score, but it can never increase the module's score."));
      if (!dependencyChecks.length) {
        dependencySection.append(node("p", "library-score-passed", "No included dependency checks were reported."));
      } else {
        const byCoordinate = new Map();
        dependencyChecks.forEach((check) => {
          const coordinate = String(check.coordinate || "Unknown dependency");
          if (!byCoordinate.has(coordinate)) byCoordinate.set(coordinate, []);
          byCoordinate.get(coordinate).push(check);
        });
        byCoordinate.forEach((coordinateChecks, coordinate) => {
          const group = node("section", "library-score-dependency");
          group.append(node("h4", "", coordinate));
          appendCheckList(group, coordinateChecks, false);
          dependencySection.append(group);
        });
      }
      elements.scoreBreakdown.append(dependencySection);
      if (relevantChecks.length > checks.length) {
        dependencySection.append(node("p", "library-score-truncated", `Showing the first ${checks.length} of ${relevantChecks.length} relevant checks.`));
      }
    }
    elements.scoreDialog.showModal();
  }

  function snapshotStatus(snapshot) {
    if (String(snapshot?.processingStatus || "PENDING").toUpperCase() === "PENDING") {
      return "Pending";
    }
    const decision = String(snapshot?.decision || "").toUpperCase();
    return {
      LISTED: "Published",
      NEEDS_REVIEW: "Needs review",
      HIDDEN: "Hidden",
      REJECTED: "Rejected"
    }[decision] || "Completed";
  }

  function snapshotDate(value) {
    if (!value) return "unknown date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "unknown date";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "short", day: "numeric"
    }).format(parsed);
  }

  function createSnapshotSelector(item, historyItems) {
    if (!Array.isArray(historyItems) || !historyItems.length) return null;
    const section = node("section", "library-snapshot-selector");
    const label = node("label", "library-snapshot-label");
    label.append(icon("clock-rotate-left"), document.createTextNode(" Module version"));
    const selectControl = node("div", "library-snapshot-select-control");
    const select = node("select", "library-snapshot-select");
    select.setAttribute("aria-label", "Select an analyzed module version");
    historyItems.forEach((snapshot) => {
      const option = node("option");
      option.value = String(snapshot.snapshotId);
      const provider = snapshot.provider
        ? ` · ${String(snapshot.provider).replaceAll("_", " ").toLowerCase()}` : "";
      option.textContent = `${snapshot.version || "Unresolved"} — ${snapshotStatus(snapshot)}${provider} · ${snapshotDate(snapshot.createdAt)}`;
      option.selected = String(snapshot.snapshotId) === String(item.snapshotId);
      select.append(option);
    });
    const selectIcon = icon("chevron-down");
    selectIcon.setAttribute("aria-hidden", "true");
    selectControl.append(select, selectIcon);
    const selected = historyItems.find((snapshot) =>
      String(snapshot.snapshotId) === String(item.snapshotId));
    const selectedStatus = selected
      ? snapshotStatus(selected)
      : snapshotStatus({
        processingStatus: item.processingStatus,
        decision: item.score?.decision || item.visibilityDecision
      });
    const status = node("p", `library-snapshot-status library-snapshot-status--${String(selectedStatus).toLowerCase().replaceAll(" ", "-")}`,
      `${selectedStatus} snapshot`);
    select.addEventListener("change", async () => {
      select.disabled = true;
      try {
        const snapshot = await fetchJson(`/api/extensions/${encodeURIComponent(item.githubRepositoryId)}/snapshots/${encodeURIComponent(select.value)}`);
        const catalogUrl = validCatalogReturnUrl(history.state?.catalogUrl);
        history.pushState({
          module: item.githubRepositoryId,
          snapshot: Number(select.value),
          catalogUrl
        }, "", moduleDetailUrl(item.githubRepositoryId, select.value));
        await openDetail(snapshot, false, historyItems);
      } catch (error) {
        select.disabled = false;
        showStatus(error.message || "The selected module snapshot could not be loaded.", true);
      }
    });
    section.append(label, selectControl, status);
    return section;
  }

  async function openDetail(item, updateHistory, suppliedHistory) {
    if (!item.readmeIncluded && item.githubRepositoryId) {
      try {
        const requestedSnapshot = item.snapshotId
          ? `/snapshots/${encodeURIComponent(item.snapshotId)}` : "";
        const detailed = await fetchJson(`/api/extensions/${encodeURIComponent(item.githubRepositoryId)}${requestedSnapshot}`);
        Object.assign(item, detailed);
      } catch (error) {
        showStatus(error.message || "Module documentation could not be loaded.", true);
      }
    }
    let snapshotHistory = suppliedHistory;
    if (!Array.isArray(snapshotHistory) && item.githubRepositoryId) {
      try {
        const historyResult = await fetchJson(`/api/extensions/${encodeURIComponent(item.githubRepositoryId)}/snapshots`);
        snapshotHistory = Array.isArray(historyResult.items) ? historyResult.items : [];
      } catch (_) {
        snapshotHistory = [];
      }
    }
    elements.grid.hidden = true;
    elements.pagination.hidden = true;
    elements.authorProfile.hidden = true;
    elements.detail.hidden = false;
    elements.detail.replaceChildren();

    const back = button("Back to Library", "library-back", closeDetail, "arrow-left");
    const layout = node("div", "library-detail-layout");
    const main = node("div", "library-detail-main");
    main.append(createGallery(item));

    const header = node("header", "library-detail-header");
    header.append(node("span", "library-dialog-kicker", "Community module"));
    header.append(node("h1", "", moduleTitle(item)));
    header.append(authorByline(item, "library-detail-byline"));
    const badges = node("div", "library-detail-badges");
    const score = button(scoreValue(item) === null ? "Unscored" : `Score ${scoreValue(item)}`,
      `library-score library-score--button library-score--${scoreTone(scoreValue(item))}`,
      () => openScoreDialog(item), "circle-question");
    badges.append(score, virusTotalIndicator(item));
    const jitPackWarning = jitPackIndicator(item);
    if (jitPackWarning) badges.append(jitPackWarning);
    if (state.adminKey) badges.append(node("span", "library-state-chip library-state-chip--inline", stateLabel(item)));
    header.append(badges);
    main.append(header);
    const warning = createVisibilityWarning(item, true);
    if (warning) main.append(warning);
    main.append(node("p", "library-detail-description", item.description || "No description has been provided."));

    const tags = node("div", "library-tags library-tags--detail");
    normalizedTopics(item).forEach((topic) => tags.append(tagButton(topic)));
    main.append(tags);

    const rejectedSnapshot = item.processingStatus === "PENDING"
      || item.score?.decision === "REJECTED"
      || item.visibilityDecision === "REJECTED";
    if (item.gradleSnippet && !rejectedSnapshot) {
      const install = node("section", "library-install");
      install.append(node("h2", "", "Add to your project"));
      const code = node("code", "", item.gradleSnippet);
      const pre = node("pre", "library-code");
      pre.append(code);
      const copy = button("Copy Gradle snippet", "library-copy-button", async () => copyText(item.gradleSnippet, copy), "copy");
      install.append(pre, copy);
      main.append(install);
    }

    const readme = renderReadme(item);
    if (readme) main.append(readme);

    const aside = node("aside", "library-detail-aside");
    const snapshotSelector = createSnapshotSelector(item, snapshotHistory);
    if (snapshotSelector) aside.append(snapshotSelector);
    const facts = node("dl", "library-detail-facts");
    [
      detailRow("Registry", registryLabel(item.rootArtifact)),
      detailRow("Minimum jME", item.compatibility?.minimum),
      detailRow("Recommended jME", item.compatibility?.recommended),
      detailRow("Maximum jME", item.compatibility?.maximum),
      detailRow("GitHub stars", starValue(item) === null ? "Refreshing" : String(starValue(item)))
    ].filter(Boolean).forEach((row) => facts.append(row));
    aside.append(facts);
    const platforms = renderPlatforms(item);
    if (platforms) aside.append(platforms);
    const publishedModules = renderPublishedModules(item);
    if (publishedModules) aside.append(publishedModules);

    const links = node("div", "library-detail-links");
    const repository = safeUrl(item.repositoryUrl, true);
    const homepage = safeUrl(item.homepageUrl);
    if (repository) {
      const star = externalLink("Star on GitHub", "btn btn-primary library-pill-button", repository, "star");
      const source = externalLink("View source", "btn btn-outline library-pill-button", repository, "code-branch");
      links.append(star, source);
    }
    if (homepage && homepage !== repository) {
      const website = externalLink("Project website", "btn btn-outline library-pill-button", homepage, "arrow-up-right-from-square");
      links.append(website);
    }
    aside.append(links);
    if (state.adminKey) aside.append(renderModeration(item));
    layout.append(main, aside);
    elements.detail.append(back, layout);
    window.scrollTo({ top: elements.detail.offsetTop - 90, behavior: "smooth" });

    if (updateHistory) {
      const current = new URL(window.location.href);
      const catalogUrl = current.searchParams.has("module")
        ? validCatalogReturnUrl(history.state?.catalogUrl)
        : current.href;
      history.pushState({
        module: item.githubRepositoryId,
        snapshot: item.snapshotId,
        catalogUrl
      }, "", moduleDetailUrl(item.githubRepositoryId, item.snapshotId));
    }
  }

  function closeDetail() {
    const url = validCatalogReturnUrl(history.state?.catalogUrl)
      || new URL(window.location.pathname, window.location.origin).href;
    history.pushState({}, "", url);
    restoreCatalogStateFromUrl();
    renderList();
  }

  async function openRequestedModule(updateHistory) {
    const id = new URL(window.location.href).searchParams.get("module");
    if (!id || !/^\d+$/.test(id)) return;
    const snapshotId = new URL(window.location.href).searchParams.get("snapshot");
    let item = state.items.find((candidate) => String(candidate.githubRepositoryId) === id);
    if (snapshotId && /^\d+$/.test(snapshotId)) {
      try {
        item = await fetchJson(`/api/extensions/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(snapshotId)}`);
      } catch (_) {
        showStatus("This module snapshot is not publicly available.", true);
        return;
      }
    }
    if (!item) {
      try {
        item = await fetchJson(`/api/extensions/${encodeURIComponent(id)}`);
      } catch (_) {
        showStatus("This module is not publicly available.", true);
        return;
      }
    }
    if (item) openDetail(item, updateHistory);
  }

  async function copyText(value, source) {
    const originalContent = Array.from(source.childNodes).map((child) => child.cloneNode(true));
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch (_) {
        copied = false;
      }
    }
    if (!copied) copied = copyTextFromUserGesture(value);
    if (copied) {
      source.replaceChildren(icon("check"), document.createTextNode("Copied"));
      window.setTimeout(() => source.replaceChildren(...originalContent), 1400);
    } else {
      showStatus("Copy failed. Select the text and copy it manually.", true);
    }
  }

  function copyTextFromUserGesture(value) {
    const textarea = node("textarea", "library-clipboard-fallback");
    textarea.value = String(value || "");
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    document.body.append(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (_) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  function visibilityInputs() {
    return [elements.filterListed, elements.filterReview, elements.filterHidden];
  }

  function selectedVisibilityStates() {
    return visibilityInputs().filter((input) => input.checked).map((input) => input.value);
  }

  function syncCatalogUrl(mode) {
    const url = new URL(window.location.href);
    url.searchParams.delete("module");
    url.searchParams.delete("snapshot");
    url.searchParams.set("page", String(state.page + 1));
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (state.selectedTag) url.searchParams.set("tag", state.selectedTag);
    else url.searchParams.delete("tag");
    url.searchParams.set("sort", state.sort);
    url.searchParams.set("direction", state.direction);
    url.searchParams.set("states", selectedVisibilityStates().join(","));
    if (mode === "push") history.pushState({}, "", url);
    else history.replaceState(history.state, "", url);
  }

  function moduleDetailUrl(repositoryId, snapshotId) {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("module", String(repositoryId));
    if (snapshotId) url.searchParams.set("snapshot", String(snapshotId));
    return url.href;
  }

  function validCatalogReturnUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname
          || url.searchParams.has("module") || url.searchParams.has("snapshot")) return "";
      return url.href;
    } catch (_) {
      return "";
    }
  }

  function restoreCatalogStateFromUrl() {
    const url = new URL(window.location.href);
    const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
    state.page = Number.isInteger(page) && page > 0 && page <= 100001 ? page - 1 : 0;
    state.query = String(url.searchParams.get("q") || "").slice(0, 100);
    state.selectedTag = url.searchParams.get("tag") || "";
    const sort = url.searchParams.get("sort") || "stars";
    const direction = url.searchParams.get("direction") || "desc";
    state.sort = ["stars", "score", "updated", "name"].includes(sort) ? sort : "stars";
    state.direction = ["asc", "desc"].includes(direction) ? direction : "desc";
    const requestedStates = (url.searchParams.get("states") || "LISTED")
      .split(",").map((value) => value.trim().toUpperCase()).filter((value) => allowedStates.has(value));
    state.selectedStates = requestedStates.length ? Array.from(new Set(requestedStates)) : ["LISTED"];
    elements.search.value = state.query;
    visibilityInputs().forEach((input) => {
      input.checked = state.selectedStates.includes(input.value);
    });
    elements.sortOptions.forEach((option) => {
      option.checked = option.value === `${state.sort}:${state.direction}`;
    });
    updateFilterCount();
  }

  function updateFilterCount() {
    elements.filterCount.textContent = String(selectedVisibilityStates().length);
  }

  function resetVisibilityFilters() {
    elements.filterListed.checked = true;
    elements.filterReview.checked = false;
    elements.filterHidden.checked = false;
    updateFilterCount();
  }

  function updateAdminUi() {
    const active = Boolean(state.adminKey);
    elements.logoutButton.hidden = !active;
    visibilityInputs().forEach((input) => { input.disabled = false; });
    elements.filterHint.hidden = false;
    updateFilterCount();
    elements.adminButton.classList.toggle("library-admin-trigger--active", active);
    elements.adminButton.setAttribute("aria-label", active ? "Moderation is active" : "Open administrator access");
    elements.adminButton.title = active ? "Moderation active" : "Administrator access";
    elements.adminButton.replaceChildren();
    elements.adminButton.append(icon(active ? "shield" : "shield-halved"));
    elements.adminButton.append(node("span", "sr-only", active ? "Moderation is active" : "Administrator access"));
  }

  function showApiDebug() {
    const exchange = state.lastApiExchange;
    elements.apiDebugJson.textContent = exchange
      ? JSON.stringify(exchange, null, 2)
      : "No API exchange has been recorded yet.";
    elements.apiDebugSummary.textContent = exchange
      ? `${exchange.request.method} ${exchange.request.url} — ${exchange.response.status || "network error"} in ${exchange.durationMs} ms. Authentication secrets are never recorded.`
      : "Load or open a module first. Authentication secrets are never recorded.";
    elements.apiDebugCopy.disabled = !exchange;
    elements.apiDebugDialog.showModal();
  }

  function endAdminSession(reload) {
    sessionStorage.removeItem("jme-library-admin-key");
    state.adminKey = "";
    resetVisibilityFilters();
    updateAdminUi();
    if (reload !== false) {
      state.page = 0;
      syncCatalogUrl("replace");
      loadModules();
    }
  }

  elements.search.addEventListener("input", debounce(() => {
    state.query = elements.search.value.trim();
    state.page = 0;
    syncCatalogUrl("replace");
    loadModules();
  }, 300));
  elements.sortOptions.forEach((option) => option.addEventListener("change", () => {
    if (!option.checked) return;
    [state.sort, state.direction] = option.value.split(":");
    elements.sortMenu.open = false;
    state.page = 0;
    syncCatalogUrl("push");
    loadModules();
  }));
  [elements.filterListed, elements.filterReview, elements.filterHidden].forEach((option) => {
    option.addEventListener("change", () => {
      if (!selectedVisibilityStates().length) option.checked = true;
      updateFilterCount();
      state.page = 0;
      syncCatalogUrl("push");
      loadCategories();
      loadModules();
    });
  });
  elements.sortMenu.addEventListener("toggle", () => {
    if (elements.sortMenu.open) elements.filterMenu.open = false;
  });
  elements.filterMenu.addEventListener("toggle", () => {
    if (elements.filterMenu.open) elements.sortMenu.open = false;
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".library-control-menu")) {
      elements.sortMenu.open = false;
      elements.filterMenu.open = false;
    }
  });
  elements.previous.addEventListener("click", () => {
    if (state.page > 0) {
      state.page -= 1;
      syncCatalogUrl("push");
      loadModules();
    }
  });
  elements.next.addEventListener("click", () => {
    if (state.page + 1 < state.totalPages) {
      state.page += 1;
      syncCatalogUrl("push");
      loadModules();
    }
  });
  elements.addButton.addEventListener("click", () => {
    elements.submitStatus.textContent = "";
    elements.addDialog.showModal();
  });
  elements.adminButton.addEventListener("click", () => {
    if (state.adminKey) return;
    elements.adminStatus.textContent = "";
    elements.adminDialog.showModal();
    elements.adminKey.focus();
  });
  elements.apiDebugButton.addEventListener("click", showApiDebug);
  elements.apiDebugCopy.addEventListener("click", async () => {
    if (state.lastApiExchange) {
      await copyText(JSON.stringify(state.lastApiExchange, null, 2), elements.apiDebugCopy);
    }
  });
  elements.logoutButton.addEventListener("click", () => endAdminSession(true));

  elements.addForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.addForm.reportValidity()) return;
    elements.submitStatus.textContent = "Requesting discovery…";
    try {
      const result = await fetchJson("/api/extensions/submissions", {
        method: "POST", body: JSON.stringify({ repository: elements.repository.value.trim() })
      });
      elements.submitStatus.textContent = result.message || "Discovery started. Check the Library again soon.";
      elements.repository.value = "";
    } catch (error) {
      elements.submitStatus.textContent = error.message || "Discovery could not be started.";
    }
  });

  elements.adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.adminForm.reportValidity()) return;
    const candidate = elements.adminKey.value;
    elements.adminStatus.textContent = "Checking key…";
    state.adminKey = candidate;
    try {
      await fetchJson("/admin/session", { admin: true });
      sessionStorage.setItem("jme-library-admin-key", candidate);
      elements.adminKey.value = "";
      elements.adminDialog.close();
      updateAdminUi();
      state.page = 0;
      syncCatalogUrl("replace");
      loadModules();
    } catch (error) {
      state.adminKey = "";
      elements.adminStatus.textContent = error.status === 401 || error.status === 403
        ? "The administrator key is not valid." : (error.message || "Could not start the admin session.");
    }
  });

  document.querySelectorAll("[data-copy-target]").forEach((source) => {
    source.addEventListener("click", () => {
      const target = document.getElementById(source.dataset.copyTarget);
      if (target) copyText(target.textContent, source);
    });
  });
  document.querySelectorAll(".library-dialog-close").forEach((source) => {
    source.addEventListener("click", () => {
      const dialog = source.closest("dialog");
      if (dialog) dialog.close();
    });
  });
  window.addEventListener("popstate", () => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("module");
    if (id) {
      openRequestedModule(false);
      return;
    }
    restoreCatalogStateFromUrl();
    renderCategories();
    loadModules();
  });

  function debounce(callback, wait) {
    let timeout;
    return function () {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(callback, wait);
    };
  }

  restoreCatalogStateFromUrl();
  updateAdminUi();
  const requestedModule = initialUrl.searchParams.get("module");
  const requestedSnapshot = initialUrl.searchParams.get("snapshot");
  if (requestedModule && /^\d+$/.test(requestedModule)
      && (!requestedSnapshot || /^\d+$/.test(requestedSnapshot))) {
    history.replaceState({
      module: Number(requestedModule),
      snapshot: requestedSnapshot ? Number(requestedSnapshot) : null,
      catalogUrl: validCatalogReturnUrl(history.state?.catalogUrl)
    }, "", moduleDetailUrl(requestedModule, requestedSnapshot));
  } else {
    syncCatalogUrl("replace");
  }
  loadCatalogStats();
  loadCategories();
  loadModules();
}());
