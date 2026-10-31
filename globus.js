/* globus.js
   Aus Webflow Body Code ausgelagert.
   Wichtig: Cesium muss im Head vor dieser Datei geladen werden.
   Ersetze PASTE_YOUR_CESIUM_ION_TOKEN_HERE durch deinen Cesium-Ion-Token
   oder setze den Token alternativ vorher über window.CESIUM_ION_TOKEN.
*/

(async () => {
  // =========================================================
  // GUARDS
  // =========================================================
  if (!window.Cesium) {
    console.warn("Cesium not loaded");
    return;
  }

  // =========================================================
  // CONFIG
  // =========================================================
  Cesium.Ion.defaultAccessToken =
    window.CESIUM_ION_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODA4ZDBiOS05M2JlLTQ4NjctYmQ0OS0zM2JjYWVjMzk4NWMiLCJpZCI6MzgyNTE0LCJpYXQiOjE3NjkxNTYzNzR9.ZkLvFesgBl7prhnS8FyQOIQzl0KS8gS_GXjufzsvpRk";

  const CONFIG = {
    DATA_URL:
      "https://raw.githubusercontent.com/lehmannphilippe-dotcom/webflow-data/refs/heads/main/extinct_birds_with_ranges.json",
    GENUS_URL:
      "https://raw.githubusercontent.com/lehmannphilippe-dotcom/webflow-data/refs/heads/main/genus.json",
    FAMILY_URL:
      "https://raw.githubusercontent.com/lehmannphilippe-dotcom/webflow-data/refs/heads/main/family.json",

    LAND_MASK_URL:
      "https://cdn.prod.website-files.com/6a2856622c4f26c0e72a657b/6ad388d22b6b727fa6c79c29_world.watermask.4096x2048.png",

    // Geographic framing matched to the supplied desktop / portrait references.
    HAWAII_VIEW: {
      desktop: { west: -174.5, south: 14.8, east: -150.7, north: 29.5 },
      compact: { west: -160.3, south: 18.6, east: -154.4, north: 22.5 },
      duration: 3
    },

    POINT_COLOR: "#FF5100",
    POINT_SIZE: 8,

    DEFAULT_TOOLTIP_IMG:
      "https://cdn.prod.website-files.com/6950eb029163bef776e18cfd/697f46331fa0e662b4d2de3f_default.jpg",
    DEFAULT_PANEL_IMG:
      "https://cdn.prod.website-files.com/6950eb029163bef776e18cfd/697f462bee65d768b7df0ad8_default.jpg",

    STYLE: {
      brightness: 0.54,
      contrast: 0.99,
      saturation: 0.55,
      gamma: 1.12,
      hue: -0.009
    },

    LAND_GRADE: {
      contrast: 1.18,
      saturation: 1.22,
      blueBoost: 0.18,
      lift: 0.015,
      rgCut: 0.05,
      strength: 1.0
    },

    ZOOM_IN_STOP_HEIGHT_M: 81_000,
    ZOOM_OUT_STOP_HEIGHT_M: 50_000_000,

    RANGES_STYLE: {
      range_native: {
        fill: Cesium.Color.fromCssColorString("#FD521F"),
        alpha: 0.25,
        outline: Cesium.Color.fromCssColorString("#FD521F"),
        outlineAlpha: 1.0,
        fadeMs: 220
      },
      breeding_native: {
        fill: Cesium.Color.fromCssColorString("#FB00FF"),
        alpha: 0.25,
        outline: Cesium.Color.fromCssColorString("#FB00FF"),
        outlineAlpha: 1.0,
        fadeMs: 220
      },
      range_hypothetical: {
        fill: Cesium.Color.fromCssColorString("#FD521F"),
        alpha: 0.20,
        outline: null,
        fadeMs: 220
      },
      passage: {
        fill: Cesium.Color.fromCssColorString("#7E70EB"),
        alpha: 0.3,
        outline: null,
        fadeMs: 220
      }
    },

    RANGE_POINTS: {
      breeding_spots: { color: "#FB00FF", size: 8 },
      find_spots: { color: "#01FF67", size: 8 },
      last_observation: { color: "#FF0000", size: 8 }
    },

    PANEL_SHIFT_MAX_HEIGHT_M: 8_000_000,

    VIEW_MARGIN_PX: 18,
    VIEW_MAX_ITERS: 14,
    VIEW_PAN_ITERS_BEFORE_ZOOM: 6,
    VIEW_MIN_COVERAGE: 0.06,
    VIEW_MAX_COVERAGE: 0.78,
    VIEW_PAN_MAX_ANGLE: 0.22,
    VIEW_PAN_MIN_ANGLE: 0.002,
    VIEW_ZOOM_STEP_FRAC: 0.18,
    RANGE_SAMPLE_STEP: 10
  };

  // =========================================================
  // DOM
  // =========================================================
  const DOM = {
    globeHost: document.getElementById("globe"),

    tip: document.getElementById("species-tooltip"),
    tipImg: document.getElementById("tooltip-avatar"),
    tipNameDe: document.getElementById("tooltip-name-de"),
    tipNameLat: document.getElementById("tooltip-name-lat"),
    tipLast: document.getElementById("tooltip-lastseen"),

    panelEl: document.getElementById("species-panel"),
    panelOverlay: document.querySelector(".info-overlay"),
    panelCloseBtn:
      document.getElementById("panel-close") ||
      document.querySelector(".panel-close"),

    panelImg: document.getElementById("panel-image"),
    aiImageInfoButton: document.getElementById("ai-image-info-button"),
    aiImageModal: document.getElementById("ai-image-modal"),
    aiImageModalClose: document.getElementById("ai-image-modal-close"),
    panelFamilyLink: document.getElementById("panel-family-link"),
    panelGenusLink: document.getElementById("panel-genus-link"),
    panelNameLat: document.getElementById("panel-name-lat"),
    panelNameDe: document.getElementById("panel-name-de"),
    panelExtDate: document.getElementById("panel-extinction-date"),
    panelDesc: document.getElementById("panel-description"),
    panelHabitat: document.getElementById("panel-habitat"),
    panelExtinction: document.getElementById("panel-extinction"),

    speciesReferencesToggle: document.getElementById("species-references-toggle"),
    speciesReferencesContent: document.getElementById("species-references-content"),
    speciesReferencesList: document.getElementById("species-references-list"),
    speciesReferencesIcon: document.getElementById("species-references-icon"),

    genusPanel: document.getElementById("genus-panel"),
    familyPanel: document.getElementById("family-panel"),

    genusCards: document.getElementById("genus-cards"),
    familyCards: document.getElementById("family-cards"),
    speciesCardTemplate: document.getElementById("species-card-template"),

    familyCloseBtn: document.getElementById("family-close"),
    familyNameLat: document.getElementById("family-name-lat"),
    familyNameDe: document.getElementById("family-name-de"),
    familyExCard: document.getElementById("family-ex-card"),
    familyExtDate: document.getElementById("family-extinction-date"),
    familyDesc: document.getElementById("family-description"),
    familyCount: document.getElementById("family-count"),
    familyStickyGenusLink: document.getElementById("family-sticky-genus-link"),
    familyStickyGenusText: document.querySelector("#family-sticky-genus-link .link-genus"),
    familyReferencesToggle: document.getElementById("family-references-toggle"),
    familyReferencesContent: document.getElementById("family-references-content"),
    familyReferencesList: document.getElementById("family-references-list"),
    familyReferencesIcon: document.getElementById("family-references-icon"),

    genusCloseBtn: document.getElementById("genus-close"),
    genusFamily: document.getElementById("genus-family"),
    genusNameLat: document.getElementById("genus-name-lat"),
    genusNameDe: document.getElementById("genus-name-de"),
    genusExCard: document.getElementById("genus-ex-card"),
    genusExtDate: document.getElementById("genus-extinction-date"),
    genusDesc: document.getElementById("genus-description"),
    genusCount: document.getElementById("genus-count"),
    genusReferencesToggle: document.getElementById("genus-references-toggle"),
    genusReferencesContent: document.getElementById("genus-references-content"),
    genusReferencesList: document.getElementById("genus-references-list"),
    genusReferencesIcon: document.getElementById("genus-references-icon")
  };

  if (!DOM.globeHost) return;

  // Full-bleed mobile canvas; retain every existing viewport setting.
  const viewportMeta = document.querySelector('meta[name="viewport"]') || document.head.appendChild(document.createElement('meta'));
  viewportMeta.name = 'viewport';
  const viewportParts = (viewportMeta.content || 'width=device-width, initial-scale=1').split(',')
    .map(value => value.trim()).filter(value => value && !/^viewport-fit\s*=/i.test(value));
  viewportMeta.content = [...viewportParts, 'viewport-fit=cover'].join(', ');
  const themeMeta = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(document.createElement('meta'));
  themeMeta.name = 'theme-color';
  themeMeta.content = '#04052a';

  function germanDisplayName(value) {
    // Safari's German dictionary handles ordinary words; mark this mixed bird name explicitly.
    return String(value || '').replace(/Akepakleidervogel/g, 'Akepa\u00adkleider\u00advogel');
  }

  function preparePanelTypography() {
    for (const element of [DOM.panelNameDe, DOM.genusNameDe, DOM.genusNameLat, DOM.familyNameDe, DOM.familyNameLat]) {
      element?.classList.add('globe-panel-title');
      element?.setAttribute('lang', 'de');
    }
    for (const panel of [DOM.panelEl, DOM.genusPanel, DOM.familyPanel]) {
      if (!panel) continue;
      for (const element of panel.querySelectorAll('h1, h2, h3, h4, div, p')) {
        if (element.childElementCount === 0 && /^(Verbreitung\s*&\s*Lebensraum|Aussterben)$/.test(element.textContent.trim())) {
          element.classList.add('globe-panel-subheading');
        }
      }
    }
  }

  function prepareSpeciesBreadcrumb() {
    const fields = [DOM.panelFamilyLink, DOM.panelGenusLink, DOM.panelNameLat].filter(Boolean);
    if (fields.length < 2) return;
    let row = fields[0].parentElement;
    while (row && !fields.every(field => row.contains(field))) row = row.parentElement;
    // Never rebuild a broader content container that also holds the panel title or image.
    if (!row || row === DOM.panelEl || row.contains(DOM.panelNameDe) || row.contains(DOM.panelImg)) return;
    row.classList.add('globe-breadcrumb');
    fields.forEach(field => field.classList.add('globe-breadcrumb-item'));
    row.replaceChildren(...fields); // Keep the original links and their event listeners.
  }

  // Classify the existing Webflow nodes once; preserve their structure and listeners.
  function preparePanelLayout() {
    const excluded = '#panel-image, .panel-image-wrap, #genus-cards, #family-cards, #family-ex-card, #genus-ex-card, #family-sticky-genus-link, .globe-mobile-close';
    const fieldSelector = '.globe-panel-title, .globe-panel-subheading, .globe-breadcrumb, ' +
      '#panel-description, #panel-habitat, #panel-extinction, #genus-description, #family-description, ' +
      '#genus-family, #family-count, #genus-count, ' +
      '#panel-extinction-date, #genus-extinction-date, #family-extinction-date, ' +
      '[id$="references-toggle"], [id$="references-content"], [id$="references-list"]';
    for (const panel of [DOM.panelEl, DOM.genusPanel, DOM.familyPanel]) {
      if (!panel) continue;
      const scroller = panel.querySelector('.panel-content') || panel;
      const branches = new Set();
      for (const field of panel.querySelectorAll(fieldSelector)) {
        if (!scroller.contains(field) || field.closest(excluded)) continue;
        field.classList.add('globe-panel-field');
        let branch = field;
        while (branch.parentElement && branch.parentElement !== scroller &&
          !branch.parentElement.matches(excluded) && !branch.parentElement.querySelector(excluded)) {
          branch = branch.parentElement;
        }
        branches.add(branch);
        for (let node = field; node && node !== scroller; node = node.parentElement) {
          node.classList.add('globe-panel-layout-path');
        }
      }
      for (const branch of branches) {
        if (![...branches].some(other => other !== branch && other.contains(branch))) {
          branch.classList.add('globe-panel-inset');
        }
      }
      for (const prose of panel.querySelectorAll(
        '#panel-description, #panel-habitat, #panel-extinction, #genus-description, #family-description, [id$="references-list"]'
      )) prose.classList.add('globe-panel-prose');
    }
    // The image follows the full panel width, independently of the text branches.
    for (let node = DOM.panelImg?.parentElement; node && node !== DOM.panelEl &&
      !node.classList.contains('panel-content'); node = node.parentElement) {
      node.classList.add('globe-panel-media-path');
    }
  }

  const mobilePanelLayout = matchMedia('(max-width: 860px)');
  const mobileCloseOrigins = new Map();
  function prepareMobilePanelCloseButtons() {
    const buttons = document.querySelectorAll('#panel-close, .panel-close, #family-close, #genus-close, #ai-image-modal-close');
    for (const button of buttons) {
      if (!mobileCloseOrigins.has(button)) {
        const marker = document.createComment('original close button position');
        button.before(marker);
        mobileCloseOrigins.set(button, marker);
        button.classList.add('globe-mobile-close');
      }
      if (mobilePanelLayout.matches) {
        const host = button.closest('.info-panel, .ai-image-modal');
        if (host && button.parentElement !== host) host.appendChild(button);
      } else {
        const marker = mobileCloseOrigins.get(button);
        if (marker.parentNode && button.previousSibling !== marker) marker.after(button);
      }
    }
  }
  mobilePanelLayout.addEventListener('change', prepareMobilePanelCloseButtons);

  preparePanelTypography();
  prepareSpeciesBreadcrumb();
  prepareMobilePanelCloseButtons();
  preparePanelLayout();


  // =========================================================
  // INTRO — shown on every page load, never stored in the browser.
  // =========================================================
  let activeView = "globe";
  let overviewCameraSnapshot = null;
  let introActive = true;
  let introPointsReady = false;
  let introViewerReady = false;
  let introFrame = 0;
  let introMaskReady = false;
  let introLandStage = null;
  let introGlobeVisible = false;
  let hawaiiFlightPending = false;
  let hawaiiFlightActive = false;
  let hawaiiOverviewLocked = false;
  let hawaiiFlightToken = 0;
  let hawaiiResizeTimer = 0;
  let revealIntroPoints = () => {};
  const INTRO_START = 1400;
  const INTRO_TARGET = 1470;
  const INTRO_DURATION = 5000;
  const INTRO_GLOBE_DELAY = 800;
  const introStartedAt = performance.now();
  const introReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('globe-intro-active');
  DOM.globeHost.classList.add('gi-globe-stage');
  const intro = document.createElement('div');
  intro.id = 'globe-intro';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-modal', 'true');
  intro.setAttribute('aria-label', 'The Silent Globe – Einführung. Zum Überspringen ausserhalb des Hawaii-Buttons klicken oder Escape drücken.');
  intro.tabIndex = -1;
  intro.innerHTML = `
    <div class="gi-content">
      <div class="gi-heading">
        <span class="gi-logo" role="img" aria-label="The Silent Globe"></span>
        <div class="gi-count" aria-hidden="true">${INTRO_START}</div>
      </div>
      <span class="gi-sr">1470 Vogelarten hat der Mensch bis heute ausgerottet.</span>
      <p class="gi-description" aria-hidden="true">Vogelarten hat der Mensch<br>bis heute ausgerottet.</p>
      <div class="gi-details">
        <p class="gi-regions">Verfügbare Regionen erforschen</p>
        <button type="button" class="gi-hawaii"><span class="gi-hawaii-label">Hawaii</span></button>
      </div>
    </div>`;
  document.body.appendChild(intro);
  const introCount = intro.querySelector('.gi-count');
  const introHawaii = intro.querySelector('.gi-hawaii');
  const introDetails = intro.querySelector('.gi-details');
  intro.focus({ preventScroll: true });

  function introProgress(now = performance.now()) {
    return introReducedMotion ? 1 : Math.min(1, Math.max(0, (now - introStartedAt) / INTRO_DURATION));
  }

  function dismissIntro() {
    if (!introActive) return;
    introActive = false;
    cancelAnimationFrame(introFrame);
    introCount.textContent = String(INTRO_TARGET);
    if (introPointsReady) setAllPointsVisible(true);
    if (introViewerReady) viewer.scene.screenSpaceCameraController.enableInputs = true;
    document.documentElement.classList.remove('globe-intro-active');
    document.documentElement.classList.add('globe-intro-dismissed');
    intro.classList.add('is-closing');
    intro.setAttribute('aria-hidden', 'true');
    intro.removeAttribute('aria-modal');
    if (intro.contains(document.activeElement)) document.activeElement.blur();
    setTimeout(() => intro.remove(), introReducedMotion ? 0 : 400);
  }

  // Only the numeric counter uses JavaScript. CSS schedules all intro text reveals.
  // Runs before any awaited texture/data request: the counter never waits for Cesium.
  function tickIntro(now) {
    if (!introActive) return;
    const progress = introProgress(now);
    introCount.textContent = String(Math.floor(INTRO_START + progress * (INTRO_TARGET - INTRO_START)));
    revealIntroPoints(progress);
    if (progress < 1) introFrame = requestAnimationFrame(tickIntro);
  }
  introFrame = requestAnimationFrame(tickIntro);

  // Data arriving late catches up to the existing timeline without restarting it.
  function beginIntro() {
    introPointsReady = true;
    if (!introActive) { setAllPointsVisible(true); return; }
    const orderedPoints = Array.from({ length: points.length }, (_, i) => points.get(i));
    for (let i = orderedPoints.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedPoints[i], orderedPoints[j]] = [orderedPoints[j], orderedPoints[i]];
    }
    let revealed = 0;
    revealIntroPoints = (fraction) => {
      const target = Math.floor(fraction * orderedPoints.length);
      while (revealed < target) orderedPoints[revealed++].show = true;
      viewer.scene.requestRender?.();
    };
    revealIntroPoints(introProgress());
  }

  function watchIntroGlobe() {
    let readyFrames = 0;
    let lastFrame = performance.now();
    const removeListener = viewer.scene.postRender.addEventListener(() => {
      const now = performance.now();
      const elapsed = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
      lastFrame = now;
      if (!introGlobeVisible) {
        const ready = introMaskReady && (!introLandStage || introLandStage.ready) && viewer.scene.globe.tilesLoaded;
        readyFrames = ready ? readyFrames + 1 : 0;
        if (now - introStartedAt >= INTRO_GLOBE_DELAY && readyFrames >= 2) {
          introGlobeVisible = true;
          DOM.globeHost.classList.add('gi-globe-visible');
          intro.classList.add('is-globe-visible');
          if (hawaiiFlightPending) flyToHawaii();
          setTimeout(() => DOM.globeHost.classList.remove('gi-globe-stage', 'gi-globe-visible'), introReducedMotion ? 0 : 1250);
        }
      }
      if (introGlobeVisible && introActive && !introReducedMotion) {
        // 0.8 degrees per second; independent of the display's frame rate.
        viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(.8) * elapsed);
        viewer.scene.requestRender?.();
      }
      if (introGlobeVisible && !introActive) removeListener();
    });
  }

  function hawaiiViewRectangle() {
    const canvas = viewer.scene.canvas;
    const width = canvas.clientWidth || innerWidth || 1;
    const height = canvas.clientHeight || innerHeight || 1;
    const wide = width > 860 && width / height >= 1.2;
    const bounds = wide ? CONFIG.HAWAII_VIEW.desktop : CONFIG.HAWAII_VIEW.compact;
    return Cesium.Rectangle.fromDegrees(bounds.west, bounds.south, bounds.east, bounds.north);
  }

  function flyToHawaii(duration = CONFIG.HAWAII_VIEW.duration) {
    if (!introViewerReady || !introGlobeVisible) {
      hawaiiFlightPending = true;
      return;
    }
    hawaiiFlightPending = false;
    // Invalidate old callbacks before cancelling an interrupted / resized flight.
    const token = ++hawaiiFlightToken;
    viewer.camera.cancelFlight();
    const controls = viewer.scene.screenSpaceCameraController;
    const finish = (complete) => {
      if (token !== hawaiiFlightToken) return;
      hawaiiFlightActive = false;
      hawaiiOverviewLocked = complete;
      controls.enableInputs = !introActive && !document.body.classList.contains('panel-open');
    };
    try {
      viewer.resize();
      const destination = viewer.camera.getRectangleCameraCoordinates(hawaiiViewRectangle());
      if (!destination) throw new Error('Hawaii camera framing is unavailable');
      hawaiiFlightActive = true;
      hawaiiOverviewLocked = true;
      controls.enableInputs = false;
      // Cesium follows the ellipsoid from the current side of Earth while zooming.
      viewer.camera.flyTo({
        destination,
        orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
        duration: introReducedMotion ? 0 : duration,
        easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        complete: () => finish(true),
        cancel: () => finish(false)
      });
      viewer.scene.requestRender?.();
    } catch (error) {
      finish(false);
      console.warn('Hawaii camera flight failed:', error);
    }
  }

  function requestHawaiiFlight() {
    if (!introActive) return;
    hawaiiFlightPending = true;
    dismissIntro();
    if (introViewerReady) viewer.scene.screenSpaceCameraController.enableInputs = false;
    flyToHawaii();
  }

  function scheduleHawaiiReframe() {
    clearTimeout(hawaiiResizeTimer);
    if (!hawaiiOverviewLocked && !hawaiiFlightPending) return;
    hawaiiResizeTimer = setTimeout(() => {
      if (hawaiiOverviewLocked || hawaiiFlightPending) flyToHawaii(.8);
    }, 200);
  }

  introHawaii.setAttribute('aria-label', 'Hawaii auf der Karte erkunden');
  introHawaii.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestHawaiiFlight();
  });

  intro.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!event.target.closest('.gi-hawaii')) dismissIntro();
  });
  document.addEventListener('keydown', (event) => {
    if (!introActive) return;
    if (event.key === 'Escape' || (event.key === 'Enter' && event.target !== introHawaii)) {
      event.preventDefault(); event.stopImmediatePropagation(); dismissIntro();
    } else if (event.key === 'Tab') {
      event.preventDefault(); event.stopImmediatePropagation();
      (getComputedStyle(introDetails).visibility === 'visible' ? introHawaii : intro).focus();
    }
  }, true);


  // Give the logo and initial count a first paint before constructing the WebGL viewer.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const cs = getComputedStyle(DOM.globeHost);
  if (!cs.height || cs.height === "0px") DOM.globeHost.style.height = "100vh";
  DOM.globeHost.style.width = "100%";

  if (DOM.speciesCardTemplate) {
    DOM.speciesCardTemplate.style.display = "none";
    DOM.speciesCardTemplate.setAttribute("aria-hidden", "true");
  }

  // =========================================================
  // HELPERS
  // =========================================================
  const U = {
    setText(el, val) {
      if (el) el.textContent = (val ?? "").toString();
    },
    setHTML(el, html) {
      if (el) el.innerHTML = html || "";
    },
    setWFImage(el, url) {
      if (!el) return;
      const src = url || "";
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "img") {
        el.removeAttribute("srcset");
        el.removeAttribute("sizes");
        el.src = src;
      } else {
        el.style.backgroundImage = `url("${src}")`;
      }
    },
    clamp(v, min, max) {
      return Math.min(Math.max(v, min), max);
    }
  };

  const doubleRAF = (fn) =>
    requestAnimationFrame(() => requestAnimationFrame(fn));

     const imagePreloadCache = new Map();
  let panelImageRequestId = 0;

  function preloadImage(url) {
    const src = (url || "").toString().trim();
    if (!src) return Promise.resolve("");

    const cached = imagePreloadCache.get(src);
    if (cached) return cached.promise;

    const record = {
      loaded: false,
      failed: false,
      promise: null
    };

    record.promise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        record.loaded = true;
        resolve(src);
      };

      img.onerror = (err) => {
        record.failed = true;
        reject(err);
      };

      img.src = src;
    });

    imagePreloadCache.set(src, record);
    return record.promise;
  }

  function isImageLoaded(url) {
    const src = (url || "").toString().trim();
    return !!imagePreloadCache.get(src)?.loaded;
  }

  function preloadPanelImageForItem(item) {
    const url = item?.images?.panel;
    if (!url) return Promise.resolve("");
    return preloadImage(url).catch(() => "");
  }

  function setPanelImageForItem(item) {
    if (!DOM.panelImg || !item) return;

    const panelUrl = item?.images?.panel || CONFIG.DEFAULT_PANEL_IMG;
    const blurUrl =
      item?.images?.tooltip ||
      item?.images?.panel ||
      CONFIG.DEFAULT_PANEL_IMG;

    const requestId = ++panelImageRequestId;

    if (isImageLoaded(panelUrl)) {
      DOM.panelImg.classList.remove("is-loading");
      U.setWFImage(DOM.panelImg, panelUrl);
      return;
    }

    DOM.panelImg.classList.add("is-loading");
    U.setWFImage(DOM.panelImg, blurUrl);

    preloadImage(panelUrl)
      .then(() => {
        if (requestId !== panelImageRequestId) return;
        if (activeSpeciesItem !== item) return;

        U.setWFImage(DOM.panelImg, panelUrl);
        DOM.panelImg.classList.remove("is-loading");
      })
      .catch(() => {
        if (requestId !== panelImageRequestId) return;
        if (activeSpeciesItem !== item) return;

        DOM.panelImg.classList.remove("is-loading");
      });
  }

  function compareText(a, b) {
    return (a || "").toString().trim().localeCompare(
      (b || "").toString().trim(),
      "de",
      { sensitivity: "base" }
    );
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function isSpForm(item) {
    const lat = (item?.name?.lat || "").toString().trim().toLowerCase();
    return /\bsp\.\s*$/.test(lat);
  }

  function getAIReferenceType(item) {
    const type = (
      item?.ai_reference_type ??
      item?.ai?.reference_type ??
      item?.image_ai_reference_type ??
      ""
    )
      .toString()
      .trim();

    if (!type || type === "null") return "";

    if (!["fossil", "illustration", "photo_video"].includes(type)) {
      return "";
    }

    return type;
  }

  function getAIReferenceClass(type) {
    if (type === "fossil") return "ai-type-fossil";
    if (type === "illustration") return "ai-type-illustration";
    if (type === "photo_video") return "ai-type-photo-video";
    return "";
  }

  function isDefaultPanelImage(item) {
    const panelImage = (item?.images?.panel || "").toString().trim();
    if (!panelImage) return true;

    const defaultImage = (CONFIG.DEFAULT_PANEL_IMG || "").toString().trim();
    if (panelImage === defaultImage) return true;

    const filename = panelImage.split("/").pop().toLowerCase();
    return filename.includes("default");
  }

  function shouldShowAIIcon(item) {
    if (!item) return false;
    if (isSpForm(item)) return false;
    if (isDefaultPanelImage(item)) return false;

    return !!getAIReferenceType(item);
  }

  function ensureAIImageInfoUI() {
    let btn =
      DOM.aiImageInfoButton ||
      document.getElementById("ai-image-info-button");

    if (!btn && DOM.panelImg?.parentElement) {
      btn = document.createElement("button");
      btn.id = "ai-image-info-button";
      btn.type = "button";
      DOM.panelImg.parentElement.appendChild(btn);
    }

    if (DOM.panelImg && btn) {
      const imageRoot = DOM.panelImg.closest('picture') || DOM.panelImg;
      let wrap = imageRoot.closest('.panel-image-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'panel-image-wrap';
        imageRoot.parentElement.insertBefore(wrap, imageRoot);
        wrap.appendChild(imageRoot);
      }
      if (btn.parentElement !== wrap) wrap.appendChild(btn);
    }

    DOM.aiImageInfoButton = btn || null;

    if (btn && btn.dataset.aiBaseStyleApplied !== "true") {
      btn.dataset.aiBaseStyleApplied = "true";
      btn.style.position = "absolute";
      btn.style.right = "18px";
      btn.style.bottom = "18px";
      btn.style.zIndex = "12";
      btn.style.width = "28px";
      btn.style.height = "28px";
      btn.style.minWidth = "0";
      btn.style.minHeight = "0";
      btn.style.padding = "0";
      btn.style.margin = "0";
      btn.style.background = "transparent";
      btn.style.backgroundColor = "transparent";
      btn.style.border = "0";
      btn.style.boxShadow = "none";
      btn.style.fontSize = "0";
      btn.style.lineHeight = "0";
      btn.style.display = "none";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.overflow = "visible";
    }

    if (btn && btn.dataset.aiSvgInjected !== "true") {
      btn.dataset.aiSvgInjected = "true";
      btn.type = "button";
      btn.setAttribute("aria-label", "Informationen zu KI-generiertem Bild");
      // Icon wird nicht mehr als Inline-SVG erzeugt.
      // Die Sternform kommt zentral aus globus.css als CSS mask.
      btn.innerHTML = "";
    }

    if (!document.getElementById("ai-image-modal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div id="ai-image-modal" class="ai-image-modal" aria-hidden="true">
          <div class="ai-image-modal__backdrop"></div>

          <div class="ai-image-modal__card" role="dialog" aria-modal="true" aria-labelledby="ai-image-modal-title">
            <button id="ai-image-modal-close" class="ai-image-modal__close" type="button" aria-label="Modal schliessen">
              <svg class="ai-image-modal__close-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>

            <h2 id="ai-image-modal-title">KI-generierte Bilder</h2>

            <p>
              Die Bilder der Vogelarten wurden mithilfe von Künstlicher Intelligenz (KI) erstellt.
              Sie orientieren sich so genau wie möglich an verfügbaren wissenschaftlichen Vorlagen
              und Referenzmaterialien. Dennoch bleiben die Rekonstruktionen mit Unsicherheiten verbunden.
            </p>

            <div class="ai-image-modal__legend">
              <div class="ai-image-modal__legend-item">
                <span class="ai-image-modal__legend-icon ai-type-fossil"></span>
                <div>
                  <h3>Fossiles Referenzmaterial</h3>
                  <p>Die Rekonstruktion basiert ausschliesslich auf fossilem oder subfossilem Material. Schnabelform und Körperbau können daraus teilweise abgeleitet werden, während insbesondere Färbung, Gefieder und andere äussere Merkmale mit grossen Unsicherheiten verbunden sind.</p>
                </div>
              </div>

              <div class="ai-image-modal__legend-item">
                <span class="ai-image-modal__legend-icon ai-type-illustration"></span>
                <div>
                  <h3>Wissenschaftliche Illustrationen und Museumspräparate</h3>
                  <p>Als visuelle Referenzen stehen auch wissenschaftliche/historische Illustrationen und/oder erhaltene Museumspräparate und Bälge zur Verfügung. Sie ermöglichen eine fundiertere Rekonstruktion, können jedoch bei Farben, Haltung und Erscheinungsbild von einem lebenden Tier abweichen.</p>
                </div>
              </div>

              <div class="ai-image-modal__legend-item">
                <span class="ai-image-modal__legend-icon ai-type-photo-video"></span>
                <div>
                  <h3>Foto- und Videomaterial</h3>
                  <p>Das Aussehen der Art ist auch durch historische Fotografien und/oder Filmaufnahmen dokumentiert. Diese bieten die direkteste visuelle Referenz, wobei je nach Qualität, Alter und Umfang des Materials dennoch einzelne Details unsicher bleiben können.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        `
      );
    }

    DOM.aiImageModal = document.getElementById("ai-image-modal");
    DOM.aiImageModalClose = document.getElementById("ai-image-modal-close");
    prepareMobilePanelCloseButtons();
  }

  function updateAIImageInfoButton(item) {
    ensureAIImageInfoUI();

    const btn = DOM.aiImageInfoButton;
    if (!btn) return;

    btn.classList.remove(
      "is-visible",
      "ai-type-fossil",
      "ai-type-illustration",
      "ai-type-photo-video"
    );

    btn.dataset.aiReferenceType = "";
    btn.style.display = "none";
    btn.style.color = "";

    if (!shouldShowAIIcon(item)) {
      btn.setAttribute("aria-hidden", "true");
      btn.tabIndex = -1;
      return;
    }

    const type = getAIReferenceType(item);
    const className = getAIReferenceClass(type);
    const colorByType = {
      fossil: "#FF8F5B",
      illustration: "#FCEB35",
      photo_video: "#4FB9FF"
    };

    btn.classList.add("is-visible", className);
    btn.dataset.aiReferenceType = type;
    btn.style.display = "flex";
    btn.style.color = colorByType[type] || "";
    btn.setAttribute("aria-hidden", "false");
    btn.tabIndex = 0;
  }

  function openAIImageModal() {
    ensureAIImageInfoUI();

    if (!DOM.aiImageModal) return;

    DOM.aiImageModal.classList.add("is-open");
    DOM.aiImageModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("ai-modal-open");
  }

  function closeAIImageModal() {
    if (!DOM.aiImageModal) return;

    DOM.aiImageModal.classList.remove("is-open");
    DOM.aiImageModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ai-modal-open");
  }

  function bindAIImageInfoEvents() {
    ensureAIImageInfoUI();

    if (DOM.aiImageInfoButton && DOM.aiImageInfoButton.dataset.aiBound !== "true") {
      DOM.aiImageInfoButton.dataset.aiBound = "true";

      DOM.aiImageInfoButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAIImageModal();
      });
    }

    if (DOM.aiImageModalClose && DOM.aiImageModalClose.dataset.aiBound !== "true") {
      DOM.aiImageModalClose.dataset.aiBound = "true";

      DOM.aiImageModalClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAIImageModal();
      });
    }

    if (DOM.aiImageModal && DOM.aiImageModal.dataset.aiBound !== "true") {
      DOM.aiImageModal.dataset.aiBound = "true";

      DOM.aiImageModal.addEventListener("click", (e) => {
        if (e.target.classList.contains("ai-image-modal__backdrop")) {
          closeAIImageModal();
        }
      });
    }
  }

  function getExtinctSpeciesFormsLabel(speciesList = []) {
    const total = speciesList.length;
    const spCount = speciesList.filter(isSpForm).length;

    if (spCount === 0) {
      return `${total} ${pluralize(total, "ausgestorbene Art", "ausgestorbene Arten")}`;
    }

    if (spCount === total) {
      return `${total} ${pluralize(total, "ausgestorbene Form", "ausgestorbene Formen")}`;
    }

    return `${total} ausgestorbene Arten/Formen`;
  }

  function compareSpeciesAlpha(a, b) {
    const aIsSp = isSpForm(a);
    const bIsSp = isSpForm(b);

    if (aIsSp !== bIsSp) return aIsSp ? 1 : -1;

    return (
      compareText(a?.name?.de || a?.name?.lat, b?.name?.de || b?.name?.lat) ||
      compareText(a?.name?.lat, b?.name?.lat)
    );
  }

  function getReferencesArray(item) {
    return Array.isArray(item?.references) ? item.references : [];
  }

  function clearReferencesList(container) {
    if (container) container.innerHTML = "";
  }

  function createReferenceListItem(ref) {
    const li = document.createElement("li");
    const label = (ref?.label || "").toString().trim();
    const url = (ref?.url || "").toString().trim();

    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.textContent = label || url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.appendChild(a);
    } else {
      li.textContent = label;
    }

    return li;
  }

  function renderReferencesList(container, item) {
    if (!container) return;
    clearReferencesList(container);

    const ul = document.createElement("ul");
    for (const ref of getReferencesArray(item)) {
      ul.appendChild(createReferenceListItem(ref));
    }
    container.appendChild(ul);
  }

  function setReferencesAccordionState(contentEl, iconEl, isOpen) {
    if (contentEl) {
      contentEl.dataset.open = isOpen ? "true" : "false";
      contentEl.style.overflow = "hidden";
      contentEl.style.opacity = isOpen ? "1" : "0";
      contentEl.style.maxHeight = isOpen
        ? `${contentEl.scrollHeight + 32}px`
        : "0px";
      contentEl.style.pointerEvents = isOpen ? "auto" : "none";
    }

    if (iconEl) {
      iconEl.style.transition = "transform 260ms ease";
      iconEl.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    }
  }

  function bindReferencesAccordion(toggleEl, contentEl, iconEl) {
    if (!toggleEl || !contentEl) return;
    if (toggleEl.dataset.accordionBound === "true") return;

    toggleEl.dataset.accordionBound = "true";
    toggleEl.style.cursor = "pointer";
    setReferencesAccordionState(contentEl, iconEl, false);

    toggleEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = contentEl.dataset.open === "true";
      setReferencesAccordionState(contentEl, iconEl, !isOpen);
    });
  }

  function closeAllReferencesAccordions() {
    setReferencesAccordionState(
      DOM.speciesReferencesContent,
      DOM.speciesReferencesIcon,
      false
    );
    setReferencesAccordionState(
      DOM.genusReferencesContent,
      DOM.genusReferencesIcon,
      false
    );
    setReferencesAccordionState(
      DOM.familyReferencesContent,
      DOM.familyReferencesIcon,
      false
    );
  }

  function enableHorizontalMouseDragScroll(container) {
    if (!container || container.dataset.dragScrollBound === "true") return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let didDrag = false;

    container.dataset.dragScrollBound = "true";
    container.style.cursor = "grab";

    container.addEventListener("dragstart", (e) => e.preventDefault());

    container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      didDrag = false;
      startX = e.pageX;
      startScrollLeft = container.scrollLeft;
      container.style.cursor = "grabbing";
    });

    container.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) didDrag = true;
      container.scrollLeft = startScrollLeft - dx;
    });

    const stopDrag = () => {
      isDown = false;
      container.style.cursor = "grab";
    };

    container.addEventListener("mouseleave", stopDrag);
    container.addEventListener("mouseup", stopDrag);

    container.addEventListener(
      "click",
      (e) => {
        if (!didDrag) return;
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      },
      true
    );

    container.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          container.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  function normalizeItem(raw) {
    const tooltipImg =
      raw?.images?.tooltip || raw?.image || CONFIG.DEFAULT_TOOLTIP_IMG;
    const panelImg =
      raw?.images?.panel || raw?.panel?.image || CONFIG.DEFAULT_PANEL_IMG;

    const defaultRanges = {
      range_native: null,
      breeding_native: null,
      range_hypothetical: null,
      passage: null,
      breeding_spots: null,
      find_spots: null,
      last_observation: null
    };

    return {
      ...raw,
      name: {
        de: raw?.name?.de || "",
        lat: raw?.name?.lat || ""
      },
      taxonomy: {
        family: raw?.taxonomy?.family || "",
        genus: raw?.taxonomy?.genus || "",
        family_key: raw?.taxonomy?.family_key || "",
        genus_key: raw?.taxonomy?.genus_key || ""
      },
      last_seen: raw?.last_seen || "",
      extinction_date: raw?.extinction_date || "",
      images: {
        tooltip: tooltipImg,
        panel: panelImg
      },
      panel: {
        description: raw?.panel?.description || "",
        habitat_text: raw?.panel?.habitat_text || "",
        extinction_text: raw?.panel?.extinction_text || "",
        image: raw?.panel?.image || ""
      },
      location: {
        lat: raw?.location?.lat ?? null,
        lng: raw?.location?.lng ?? null
      },
      ranges:
        raw?.ranges && typeof raw.ranges === "object"
          ? { ...defaultRanges, ...raw.ranges }
          : defaultRanges
    };
  }

  function getGenusHeadingLabel(item) {
    return (
      GENUS_BY_KEY.get(item?.taxonomy?.genus_key || "")?.name?.lat ||
      item?.taxonomy?.genus ||
      ""
    );
  }

  function railHasWrappedTitles(container) {
    if (!container) return false;

    const titles = Array.from(container.querySelectorAll(".card-name-de")).filter(
      (el) => el.offsetParent !== null
    );

    return titles.some((el) => {
      const cs = getComputedStyle(el);
      let lineHeight = parseFloat(cs.lineHeight);
      if (!isFinite(lineHeight)) {
        const fontSize = parseFloat(cs.fontSize) || 16;
        lineHeight = fontSize * 1.2;
      }
      return el.getBoundingClientRect().height > lineHeight * 1.35;
    });
  }

  function updateCardRailTitleLayout(container) {
    if (!container) return;

    doubleRAF(() => {
      container.classList.toggle(
        "has-two-line-titles",
        railHasWrappedTitles(container)
      );

      equalizeCardRailLayout(container);
    });
  }

  function equalizeCardRailLayout(container) {
    if (!container) return;

    const cards = Array.from(container.querySelectorAll(".species-card")).filter(
      (el) => el.offsetParent !== null
    );

    if (!cards.length) return;

    cards.forEach((card) => {
      card.style.height = "";

      const nameEl = card.querySelector(".card-name-de");
      if (nameEl) {
        nameEl.style.minHeight = "";
      }
    });

    let maxNameHeight = 0;

    cards.forEach((card) => {
      const nameEl = card.querySelector(".card-name-de");
      if (!nameEl) return;

      maxNameHeight = Math.max(
        maxNameHeight,
        Math.ceil(nameEl.getBoundingClientRect().height)
      );
    });

    cards.forEach((card) => {
      const nameEl = card.querySelector(".card-name-de");
      if (!nameEl) return;

      nameEl.style.minHeight = `${maxNameHeight}px`;
    });

    let maxCardHeight = 0;

    cards.forEach((card) => {
      maxCardHeight = Math.max(
        maxCardHeight,
        Math.ceil(card.getBoundingClientRect().height)
      );
    });

    cards.forEach((card) => {
      card.style.height = `${maxCardHeight}px`;
    });
  }

  function clearGeneratedCards(container) {
    if (!container) return;
    Array.from(container.children).forEach((child) => {
      if (child !== DOM.speciesCardTemplate) child.remove();
    });
  }

  function createFamilyGenusLabel(text, genusKey = "") {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "family-genus-label";
    el.textContent = text || "";
    el.dataset.genusKey = genusKey;

    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const key = el.dataset.genusKey || "";
      if (!key) return;

      openGenusPanelByKey(key);
    });

    return el;
  }

    function getFamilyGenusGroups() {
    const container = DOM.familyCards;
    if (!container) return [];

    return Array.from(container.querySelectorAll(".family-genus-group"))
      .filter((groupEl) => groupEl.offsetParent !== null)
      .map((groupEl) => {
        const labelEl = groupEl.querySelector(".family-genus-label");
        const cards = Array.from(groupEl.querySelectorAll(".species-card"));
        const firstCard = cards[0] || groupEl;
        const lastCard = cards[cards.length - 1] || groupEl;

        return {
          key: groupEl.dataset.genusKey || "",
          label: groupEl.dataset.genusLabel || "",
          groupEl,
          labelEl,
          cards,
          firstCard,
          lastCard
        };
      });
  }

    function updateStickyFamilyGenusLink() {
    const container = DOM.familyCards;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const stickyLeft = containerRect.left + 24;
    const groups = getFamilyGenusGroups();

    for (const group of groups) {
      const { groupEl, labelEl, cards, lastCard } = group;
      if (!groupEl || !labelEl) continue;

      const groupRect = groupEl.getBoundingClientRect();
      const lastCardRect = lastCard.getBoundingClientRect();

      /*
        Eine einzelne Card:
        Der Gattungsname bleibt normal über der Card und scrollt mit.
      */
      if (cards.length <= 1) {
        labelEl.style.transform = "translate3d(0, 0, 0)";
        continue;
      }

      /*
        Mehrere Cards:
        1. Vor dem Sticky-Punkt: Label bewegt sich normal mit der Gruppe.
        2. Zwischen erster und letzter Card: Label bleibt bei 24px stehen.
        3. Sobald die letzte Card den Sticky-Punkt erreicht: Label bewegt sich mit der letzten Card raus.
      */
      let targetLeft = groupRect.left;

      if (groupRect.left < stickyLeft) {
        targetLeft = stickyLeft;
      }

      if (lastCardRect.left <= stickyLeft) {
        targetLeft = lastCardRect.left;
      }

      const deltaX = Math.round(targetLeft - groupRect.left);
      labelEl.style.transform = `translate3d(${deltaX}px, 0, 0)`;
    }
  }

   function bindStickyFamilyGenusScroll() {
    const container = DOM.familyCards;
    if (!container) return;
    if (container.dataset.stickyGenusBound === "true") return;

    container.dataset.stickyGenusBound = "true";

    let stickyRAF = 0;

    container.addEventListener(
      "scroll",
      () => {
        if (stickyRAF) return;

        stickyRAF = requestAnimationFrame(() => {
          stickyRAF = 0;
          updateStickyFamilyGenusLink();
        });
      },
      { passive: true }
    );
  }

  function getPanelScrollContent(panelEl) {
    return panelEl?.querySelector(".panel-content") || panelEl || null;
  }

  function resetPanelScroll(panelEl) {
    const scroller = getPanelScrollContent(panelEl);
    if (!scroller) return;
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }

  function resetCardRailScroll() {
    if (DOM.genusCards) DOM.genusCards.scrollLeft = 0;
    if (DOM.familyCards) DOM.familyCards.scrollLeft = 0;
  }

  function resetAllPanelScrollPositions() {
    resetPanelScroll(DOM.panelEl);
    resetPanelScroll(DOM.genusPanel);
    resetPanelScroll(DOM.familyPanel);
    resetCardRailScroll();
  }

  bindReferencesAccordion(
    DOM.speciesReferencesToggle,
    DOM.speciesReferencesContent,
    DOM.speciesReferencesIcon
  );
  bindReferencesAccordion(
    DOM.genusReferencesToggle,
    DOM.genusReferencesContent,
    DOM.genusReferencesIcon
  );
  bindReferencesAccordion(
    DOM.familyReferencesToggle,
    DOM.familyReferencesContent,
    DOM.familyReferencesIcon
  );

  enableHorizontalMouseDragScroll(DOM.genusCards);
  enableHorizontalMouseDragScroll(DOM.familyCards);
  bindStickyFamilyGenusScroll();

  ensureAIImageInfoUI();
  bindAIImageInfoEvents();

  // =========================================================
  // CESIUM VIEWER
  // =========================================================
  const viewer = new Cesium.Viewer(DOM.globeHost, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    skyBox: false,
    skyAtmosphere: false,
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false
  });

  viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
  viewer.scene.fog.enabled = false;
  viewer.scene.highDynamicRange = false;
  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.postProcessStages.bloom.enabled = false;
  if (viewer.scene.postProcessStages.fxaa) {
    viewer.scene.postProcessStages.fxaa.enabled = false;
  }

  const scc = viewer.scene.screenSpaceCameraController;
  introViewerReady = true;
  scc.enableInputs = !introActive && !hawaiiFlightPending;
  scc.minimumZoomDistance = Math.max(5, CONFIG.ZOOM_IN_STOP_HEIGHT_M);
  scc.maximumZoomDistance = CONFIG.ZOOM_OUT_STOP_HEIGHT_M;
  scc.enableTilt = false;
  scc.enableLook = false;

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(20, 15, 15_000_000)
  });

  watchIntroGlobe();
  // Reframe on resize only until the user starts exploring the arrived overview.
  const releaseHawaiiOverview = () => {
    if (!hawaiiFlightActive && !hawaiiFlightPending) hawaiiOverviewLocked = false;
  };
  viewer.scene.canvas.addEventListener('pointerdown', releaseHawaiiOverview, { passive: true });
  viewer.scene.canvas.addEventListener('wheel', releaseHawaiiOverview, { passive: true });

  const baseLayer = viewer.imageryLayers.get(0);
  if (baseLayer) Object.assign(baseLayer, CONFIG.STYLE);

  // =========================================================
  // RESIZE
  // =========================================================
  let resizeRAF = 0;

  function requestViewerResize() {
    if (resizeRAF) return;
    resizeRAF = requestAnimationFrame(() => {
      resizeRAF = 0;
      try {
        viewer.resize();
      } catch (e) {}
      try {
        viewer.scene.requestRender?.();
      } catch (e) {}
    });
  }

  const ro = new ResizeObserver(requestViewerResize);
  ro.observe(DOM.globeHost);

  addEventListener(
    "resize",
    () => {
      requestViewerResize();
      scheduleHawaiiReframe();
      scheduleSpeciesReframe();
      updateCardRailTitleLayout(DOM.genusCards);
      updateCardRailTitleLayout(DOM.familyCards);
      updateFamilyGenusStickyTracks(DOM.familyCards);
      updateStickyFamilyGenusLink();
      if (document.body.classList.contains("panel-open")) {
        // Desktop panel framing is recalculated by scheduleSpeciesReframe().
      }
    },
    { passive: true }
  );

  // =========================================================
  // PANEL VIEWPORT: keep the canvas fixed; only the camera projection moves.
  // =========================================================
  function updatePanelShiftVar() {
    document.body.style.setProperty('--panel-shift', '0px');
  }

  function setPanelOpen(open) {
    document.getElementById('species-browser')?.toggleAttribute('inert', open || activeView !== 'cards');
    if (open) {
      updatePanelShiftVar();
      document.body.classList.add("panel-open");
      if (viewer?.scene?.screenSpaceCameraController) {
        viewer.scene.screenSpaceCameraController.enableInputs = false;
      }
    } else {
      document.body.classList.remove("panel-open");
      document.body.style.setProperty("--panel-shift", "0px");
      if (viewer?.scene?.screenSpaceCameraController) {
        viewer.scene.screenSpaceCameraController.enableInputs = activeView === "globe" && !introActive && !hawaiiFlightActive && !hawaiiFlightPending;
      }
    }
    requestViewerResize();
  }


  // =========================================================
  // RANGES
  // =========================================================
  let activeRangeDS = [];
  let currentPrimaryPolygonDS = null;
  const rangeCache = new Map();
  let rangeLoadToken = 0;
  let activeGenusItems = null;

  const rangePoints = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection()
  );

  // Range popup: separate from the existing Webflow species tooltip/card.
  let rangeHoverTargets = new WeakMap();
  let hoveredRange = null;
  let rangeHoverHideTimer = 0;
  const rangeSpotAnimations = new Map();
  const rangePopup = document.createElement('aside');
  rangePopup.id = 'range-hover-popup';
  rangePopup.hidden = true;
  rangePopup.setAttribute('role', 'tooltip');
  rangePopup.innerHTML = '<p class="rh-title"></p><p class="rh-text"></p>';
  const rangePopupTitle = rangePopup.querySelector('.rh-title');
  const rangePopupText = rangePopup.querySelector('.rh-text');
  document.body.appendChild(rangePopup);

  function rangePopupContent(title, text) {
    // Placeholder text is intentional content; only null/missing fields are absent.
    const clean = value => value == null ? null : String(value);
    title = clean(title); text = clean(text);
    return title === null && text === null ? null : { title, text };
  }

  function registerRangeAreas(ds, key, item) {
    const content = item.range_popups?.[key];
    const color = CONFIG.RANGES_STYLE[key]?.fill?.toCssColorString();
    for (const entity of ds.entities.values) if (entity.polygon || entity.polyline) {
      rangeHoverTargets.set(entity, {
        kind: 'area', color,
        content: rangePopupContent(content?.title, content?.text)
      });
    }
  }

  function registerRangeSpot(point, entity, key) {
    const time = Cesium.JulianDate.now();
    const properties = entity.properties?.getValue(time) || {};
    rangeHoverTargets.set(point, {
      kind: 'spot', point, baseSize: point.pixelSize,
      color: CONFIG.RANGE_POINTS[key].color,
      content: rangePopupContent(properties.title, properties.description)
    });
  }

  function animateRangeSpot(target, grow, immediate = false) {
    if (target?.kind !== 'spot') return;
    const point = target.point;
    cancelAnimationFrame(rangeSpotAnimations.get(point));
    rangeSpotAnimations.delete(point);
    const size = target.baseSize * (grow ? 1.5 : 1);
    if (immediate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      point.pixelSize = size;
      viewer.scene.requestRender?.();
      return;
    }
    const from = point.pixelSize;
    const started = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - started) / 150);
      point.pixelSize = from + (size - from) * (1 - (1 - p) ** 3);
      viewer.scene.requestRender?.();
      if (p < 1) rangeSpotAnimations.set(point, requestAnimationFrame(tick));
      else rangeSpotAnimations.delete(point);
    };
    tick();
  }

  function hideRangeHover(immediate = false) {
    clearTimeout(rangeHoverHideTimer);
    rangeHoverHideTimer = 0;
    animateRangeSpot(hoveredRange, false, immediate);
    hoveredRange = null;
    rangePopup.hidden = true;
    if (immediate) {
      // A shrinking point can belong to a collection about to be cleared.
      for (const [point, raf] of rangeSpotAnimations) {
        cancelAnimationFrame(raf);
        const info = rangeHoverTargets.get(point);
        if (info) point.pixelSize = info.baseSize;
      }
      rangeSpotAnimations.clear();
    }
  }

  function scheduleRangeHoverHide() {
    if (rangeHoverHideTimer) return;
    rangeHoverHideTimer = setTimeout(() => hideRangeHover(), 120);
  }

  function canHoverRanges() {
    return activeView === 'globe' && speciesDesktop() && inDetailMode
      && activeGenusItems === null && !!activeSpeciesItem
      && document.body.classList.contains('panel-open');
  }

  function resolveRangeHover(picked) {
    return picked && (rangeHoverTargets.get(picked.id) || rangeHoverTargets.get(picked.primitive));
  }

  function positionRangePopup(position) {
    const canvas = viewer.scene.canvas.getBoundingClientRect();
    const margin = 12;
    const left = Math.max(margin, canvas.left + margin);
    const right = Math.min(innerWidth - margin, canvas.right - (DOM.panelEl?.offsetWidth || 0) - margin);
    const top = Math.max(64, canvas.top + margin);
    const bottom = Math.min(innerHeight - margin, canvas.bottom - margin);
    rangePopup.style.maxWidth = `${Math.max(1, right - left)}px`;
    rangePopup.style.maxHeight = `${Math.max(1, bottom - top)}px`;
    const box = rangePopup.getBoundingClientRect();
    const x = canvas.left + position.x, y = canvas.top + position.y;
    const preferredX = x + 14 + box.width <= right ? x + 14 : x - box.width - 14;
    const preferredY = y + 14 + box.height <= bottom ? y + 14 : y - box.height - 14;
    rangePopup.style.left = `${Math.max(left, Math.min(preferredX, right - box.width))}px`;
    rangePopup.style.top = `${Math.max(top, Math.min(preferredY, bottom - box.height))}px`;
  }

  function updateRangeHover(position) {
    if (!canHoverRanges()) { hideRangeHover(true); return; }
    // Spots take priority when they overlap a polygon.
    const targets = viewer.scene.drillPick(position, 12).map(resolveRangeHover).filter(Boolean);
    const target = targets.find(t => t.kind === 'spot') || targets[0];
    if (!target) { scheduleRangeHoverHide(); return; }
    clearTimeout(rangeHoverHideTimer); rangeHoverHideTimer = 0;
    if (hoveredRange !== target) {
      animateRangeSpot(hoveredRange, false);
      hoveredRange = target;
      animateRangeSpot(target, true);
    }
    if (!target.content) { rangePopup.hidden = true; return; }
    rangePopupTitle.textContent = target.content.title ?? '';
    rangePopupTitle.hidden = target.content.title === null;
    rangePopupText.textContent = target.content.text ?? '';
    rangePopupText.hidden = target.content.text === null;
    rangePopup.style.setProperty('--rh-color', target.color);
    rangePopup.hidden = false;
    positionRangePopup(position);
  }

  rangePopup.addEventListener('pointerenter', () => {
    clearTimeout(rangeHoverHideTimer); rangeHoverHideTimer = 0;
    if (!canHoverRanges()) hideRangeHover(true);
  });
  rangePopup.addEventListener('pointerleave', () => hideRangeHover());
  rangePopup.addEventListener('click', event => event.stopPropagation());
  DOM.globeHost.addEventListener('pointerleave', event => {
    if (!rangePopup.contains(event.relatedTarget)) scheduleRangeHoverHide();
  });
  addEventListener('blur', () => hideRangeHover(true));
  addEventListener('resize', () => hideRangeHover(true), { passive: true });


  function clearRangePoints() {
    try {
      rangePoints.removeAll();
    } catch {}
  }

  // Backwards compatible: one URL, or { fill: URL|null, outline: URL|null }.
  function rangeSourceParts(value) {
    if (typeof value === 'string' && value.trim()) return [{ url: value, role: 'combined' }];
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    return ['fill', 'outline'].flatMap(role => {
      const url = value[role];
      return typeof url === 'string' && url.trim() ? [{ url, role }] : [];
    });
  }

  async function loadRangeDataSource(url) {
    let ds = rangeCache.get(url);
    if (ds) return ds;
    try {
      ds = await Cesium.GeoJsonDataSource.load(url, { clampToGround: true });
      rangeCache.set(url, ds);
      return ds;
    } catch (error) {
      console.warn('Verbreitungsgeometrie konnte nicht geladen werden', url, error);
      return null;
    }
  }

  function stylePolygonDataSource(ds, key, role = 'combined', startedAt = performance.now()) {
    const st = CONFIG.RANGES_STYLE[key];
    if (!st) return;
    const fade = { progress: 0 };
    const fillMaterial = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty(() => st.fill.withAlpha(fade.progress * (st.alpha ?? 0.45)), false)
    );
    const lineColor = st.outline || st.fill;
    const lineMaterial = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty(() => lineColor.withAlpha(fade.progress * (st.outlineAlpha ?? 1)), false)
    );
    for (const entity of ds.entities.values) {
      if (entity.polygon) {
        entity.polygon.show = role !== 'outline';
        entity.polygon.material = fillMaterial;
        // Split fill pieces must never draw their internal partition edges.
        entity.polygon.outline = role === 'combined' && !!st.outline;
        if (st.outline) entity.polygon.outlineColor = st.outline.withAlpha(st.outlineAlpha ?? 1);
        entity.polygon.height = 0;
        entity.polygon.extrudedHeight = 0;
      }
      if (entity.polyline) {
        entity.polyline.show = role !== 'fill';
        entity.polyline.material = lineMaterial;
        entity.polyline.width = 1;
        entity.polyline.clampToGround = true;
      }
    }
    const stylingToken = rangeLoadToken;
    const tick = () => {
      if (stylingToken !== rangeLoadToken) return;
      fade.progress = Math.min((performance.now() - startedAt) / (st.fadeMs || 220), 1);
      if (fade.progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function hideRanges() {
    hideGenusCardMapImage(null, true);
    resetGenusMarkerHover(true);
    viewer.scene.canvas.style.cursor = '';
    document.body.classList.remove('genus-marker-interaction');
    hideRangeHover(true);
    rangeHoverTargets = new WeakMap();
    document.body.classList.remove('range-hover-enabled');
    ++rangeLoadToken;
    try {
      for (const ds of activeRangeDS) {
        if (viewer.dataSources.contains(ds)) {
          viewer.dataSources.remove(ds, false);
        }
      }
    } catch {}

    activeRangeDS = [];
    currentPrimaryPolygonDS = null;
    clearRangePoints();
  }

  async function showRangesForItem(item) {
    const ranges = item?.ranges;
    if (!ranges) {
      await hideRanges();
      return;
    }

    const cleared = hideRanges();
    const loadToken = rangeLoadToken;
    await cleared;
    if (loadToken !== rangeLoadToken) return;
    document.body.classList.toggle('range-hover-enabled', activeView === 'globe' && speciesDesktop());

    const primaryKey = ['range_native', 'breeding_native', 'range_hypothetical', 'passage']
      .find(key => rangeSourceParts(ranges[key]).length) || null;

    for (const key of [
      "range_native",
      "breeding_native",
      "range_hypothetical",
      "passage"
    ]) {
      const parts = rangeSourceParts(ranges[key]);
      // Prepare both parts before showing either one, using one shared fade clock.
      const loaded = await Promise.all(parts.map(async part => ({ ...part, ds: await loadRangeDataSource(part.url) })));
      if (loadToken !== rangeLoadToken) return;
      const startedAt = performance.now();
      for (const { ds, role } of loaded) {
        if (!ds) continue;
        if (!viewer.dataSources.contains(ds)) await viewer.dataSources.add(ds);
        if (loadToken !== rangeLoadToken) {
          if (!activeRangeDS.includes(ds) && viewer.dataSources.contains(ds)) viewer.dataSources.remove(ds, false);
          return;
        }
        stylePolygonDataSource(ds, key, role, startedAt);
        registerRangeAreas(ds, key, item);
        speciesRangeKeys.set(ds, key);
        if (!activeRangeDS.includes(ds)) activeRangeDS.push(ds);
        if (primaryKey && key === primaryKey && role !== 'outline') currentPrimaryPolygonDS = ds;
      }
    }

    for (const pointKey of ["breeding_spots", "find_spots", "last_observation"]) {
      const pointUrl = ranges[pointKey];
      if (!pointUrl) continue;

      let dsPts;
      try { dsPts = await Cesium.GeoJsonDataSource.load(pointUrl, { clampToGround: true }); }
      catch (error) { console.warn("Fundpunkte konnten nicht geladen werden", pointUrl, error); continue; }
      if (loadToken !== rangeLoadToken) return;

      const t = Cesium.JulianDate.now();
      const st = CONFIG.RANGE_POINTS[pointKey];
      if (!st) continue;

      for (const e of dsPts.entities.values) {
        const pos = e.position?.getValue(t);
        if (!pos) continue;

        const point = rangePoints.add({
          position: pos,
          pixelSize: st.size ?? 8,
          color: Cesium.Color.fromCssColorString(st.color),
          show: true
        });
        registerRangeSpot(point, e, pointKey);
        speciesRangeKeys.set(point, pointKey);
      }
    }
  }

  // Genus panels show ordinary species markers plus only these two area layers.
  async function showGenusMap(items) {
    const flightToken = ++speciesFlightToken;
    rememberSpeciesView();
    viewer.camera.cancelFlight();
    activeGenusItems = items;
    inDetailMode = true;
    hideTooltip();
    const selected = new Set(items);
    for (let i = 0; i < points.length; i++) {
      const point = points.get(i);
      point.show = items.length > 1 && selected.has(point.id);
    }
    const cleared = hideRanges();
    const loadToken = rangeLoadToken;
    await cleared;
    if (loadToken !== rangeLoadToken || activeView !== 'globe' || !speciesDesktop()) return;
    document.body.classList.toggle('genus-marker-interaction', items.length > 1);
    const sources = new Map();
    for (const item of items) for (const key of ['range_native', 'range_hypothetical']) {
      for (const part of rangeSourceParts(item.ranges?.[key])) {
        if (!sources.has(part.url)) sources.set(part.url, { ...part, key });
      }
    }
    const loaded = await Promise.all([...sources.values()].map(async part => ({ ...part, ds: await loadRangeDataSource(part.url) })));
    if (loadToken !== rangeLoadToken) return;
    const startedAt = performance.now();
    for (const { ds, key, role } of loaded) {
      if (!ds) continue;
      if (!viewer.dataSources.contains(ds)) await viewer.dataSources.add(ds);
      if (loadToken !== rangeLoadToken) {
        if (!activeRangeDS.includes(ds) && viewer.dataSources.contains(ds)) viewer.dataSources.remove(ds, false);
        return;
      }
      stylePolygonDataSource(ds, key, role, startedAt);
      if (!activeRangeDS.includes(ds)) activeRangeDS.push(ds);
    }
    if (loadToken === rangeLoadToken && flightToken === speciesFlightToken && activeGenusItems === items) {
      frameGenusMap();
    }
  }

  function genusMapPositions() {
    const positions = speciesRangePositions();
    // Regular species markers are separate from range/fossil spot primitives.
    for (let i = 0; i < points.length; i++) {
      const point = points.get(i);
      if (point.show && point.position) positions.push(point.position);
    }
    // A one-species genus has no visible marker. If it also has no areas,
    // still use its location to frame the map without drawing a point.
    if (!positions.length && activeGenusItems?.length === 1) {
      const location = activeGenusItems[0].location;
      if (location?.lng != null && location?.lat != null) {
        const lng = Number(location.lng), lat = Number(location.lat);
        if (Number.isFinite(lng) && Number.isFinite(lat)) positions.push(Cesium.Cartesian3.fromDegrees(lng, lat));
      }
    }
    return positions;
  }

  function frameGenusMap() {
    if (activeGenusItems === null || activeView !== 'globe' || !speciesDesktop()) return;
    const positions = genusMapPositions();
    if (!positions.length) return;
    const canvas = viewer.scene.canvas;
    const target = speciesDestination(positions, canvas.clientWidth, canvas.clientHeight,
      DOM.genusPanel?.offsetWidth || DOM.panelEl?.offsetWidth || 0, viewer.camera.frustum, 1.2);
    viewer.camera.cancelFlight();
    viewer.camera.flyTo({ ...target,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPECIES_FLIGHT_SECONDS,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
    });
  }

  // One return view for the whole detail-panel session, including species changes.
  const speciesRangeKeys = new WeakMap();
  let speciesReturnView = null;
  let speciesFlightToken = 0;
  let speciesResizeTimer = 0;
  const SPECIES_FLIGHT_SECONDS = 1.5;

  const speciesDesktop = () => innerWidth > 860;

  function rememberSpeciesView() {
    if (activeView !== 'globe' || !speciesDesktop()) return;
    viewer.camera.cancelFlight();
    if (!speciesReturnView) speciesReturnView = {
      destination: Cesium.Cartesian3.clone(viewer.camera.positionWC),
      orientation: {
        direction: Cesium.Cartesian3.clone(viewer.camera.directionWC),
        up: Cesium.Cartesian3.clone(viewer.camera.upWC)
      }
    };
    hawaiiOverviewLocked = false;

  }

  function speciesRangePositions() {
    const result = [];
    const time = Cesium.JulianDate.now();
    const visit = (hierarchy) => {
      if (!hierarchy) return;
      for (const position of hierarchy.positions || []) result.push(position);
      for (const hole of hierarchy.holes || []) visit(hole);
    };
    for (const ds of activeRangeDS) for (const entity of ds.entities.values) {
      if (entity.polygon?.hierarchy) visit(entity.polygon.hierarchy.getValue(time));
      if (entity.polyline?.positions) result.push(...(entity.polyline.positions.getValue(time) || []));
    }
    // All three spot layers share this collection. Include them alongside every
    // polygon layer, including species with spots but no polygon geometry.
    for (let i = 0; i < rangePoints.length; i++) {
      const point = rangePoints.get(i);
      if (point.show && point.position) result.push(point.position);
    }
    return result;
  }

  // Group complete logical layers, never individual polygon pieces or holes.
  function speciesRangeGroups() {
    const groups = new Map();
    const time = Cesium.JulianDate.now();
    const add = (key, positions) => {
      if (!groups.has(key)) groups.set(key, []);
      const group = groups.get(key);
      for (const position of positions || []) group.push(position);
    };
    const visit = (key, hierarchy) => {
      if (!hierarchy) return;
      add(key, hierarchy.positions);
      for (const hole of hierarchy.holes || []) visit(key, hole);
    };
    for (const ds of activeRangeDS) {
      const key = speciesRangeKeys.get(ds) || 'areas';
      for (const entity of ds.entities.values) {
        if (entity.polygon?.hierarchy) visit(key, entity.polygon.hierarchy.getValue(time));
        if (entity.polyline?.positions) add(key, entity.polyline.positions.getValue(time));
      }
    }
    for (let i = 0; i < rangePoints.length; i++) {
      const point = rangePoints.get(i);
      if (point.show && point.position) add(speciesRangeKeys.get(point) || 'spots', [point.position]);
    }
    return [...groups.values()].filter(group => group.length);
  }

  function speciesRangeExtent(positions) {
    return positions.length > 1 ? Cesium.BoundingSphere.fromPoints(positions).radius * 2 : 0;
  }

  function speciesFocusPositions(groups, positions) {
    const extent = speciesRangeExtent(positions);
    // Only select a secondary layer when it is materially smaller than the union.
    const smaller = groups.filter(group => speciesRangeExtent(group) < extent * 0.75);
    return smaller.sort((a, b) => speciesRangeExtent(a) - speciesRangeExtent(b))[0] || positions;
  }

  // Continuous power curves reduce excess context already at archipelago scale.
  // Anchors: small island (80 km / 4), archipelago (600 km / 1.12), ocean (5000 km / 0.65).
  function speciesContextScale(extent) {
    if (extent <= 80000) return 4;
    if (extent < 600000) {
      return 4 * Math.pow(extent / 80000, Math.log(1.12 / 4) / Math.log(600000 / 80000));
    }
    if (extent < 5000000) {
      return 1.12 * Math.pow(extent / 600000, Math.log(0.65 / 1.12) / Math.log(5000000 / 600000));
    }
    return 0.65;
  }

  // Symmetric projection avoids black strips in Cesium's ground render passes.
  // An explicit contextScale retains the established genus framing.
  function speciesDestination(positions, width, height, panelWidth, frustum, contextScale = null, focusPositions = positions) {
    const extent = speciesRangeExtent(positions);
    const adaptive = contextScale == null;
    const progress = adaptive ? Cesium.Math.clamp((extent - 800000) / 4200000, 0, 1) : 0;
    const blend = progress * progress * (3 - 2 * progress);
    const scale = adaptive ? speciesContextScale(extent) : contextScale;
    const centre = Cesium.Rectangle.center(Cesium.Rectangle.fromCartesianArray(positions));
    if (adaptive && blend > 0 && focusPositions !== positions) {
      const focus = Cesium.Rectangle.center(Cesium.Rectangle.fromCartesianArray(focusPositions));
      centre.longitude += Cesium.Math.negativePiToPi(focus.longitude - centre.longitude) * blend;
      centre.latitude += (focus.latitude - centre.latitude) * blend;
    }
    const frame = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromRadians(centre.longitude, centre.latitude)
    );
    const inverse = Cesium.Matrix4.inverseTransformation(frame, new Cesium.Matrix4());
    const margin = Math.max(CONFIG.VIEW_MARGIN_PX, 32);
    const usableW = Math.max(20, width - panelWidth - 2 * margin);
    const usableH = Math.max(20, height - 128);
    const tanY = Math.tan(frustum.fovy / 2);
    const tanX = tanY * frustum.aspectRatio;
    let altitude = CONFIG.ZOOM_IN_STOP_HEIGHT_M;
    const fit = (vertices, factor, horizon) => {
      for (const position of vertices) {
        const local = Cesium.Matrix4.multiplyByPoint(inverse, position, new Cesium.Cartesian3());
        altitude = Math.max(altitude,
          local.z + Math.abs(local.x) / (tanX * usableW / width) * factor,
          local.z + Math.abs(local.y) / (tanY * usableH / height) * factor);
        if (horizon) {
          const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(position, new Cesium.Cartesian3());
          const up = Cesium.Matrix4.getColumn(frame, 2, new Cesium.Cartesian4());
          const cosine = Cesium.Cartesian3.dot(normal, up);
          if (cosine > .01) altitude = Math.max(altitude, 6378137 * (1 / cosine - 1) * 1.02);
        }
      }
    };
    // Large outer ranges may be cropped; the smaller focus layer must stay visible.
    fit(positions, scale, !adaptive || blend === 0);
    if (adaptive && blend > 0 && focusPositions !== positions) fit(focusPositions, 1.15, true);
    const eastOffset = altitude * tanX * panelWidth / Math.max(1, width);
    const destination = Cesium.Matrix4.multiplyByPoint(frame,
      new Cesium.Cartesian3(eastOffset, 0, altitude), new Cesium.Cartesian3());
    const up = Cesium.Matrix4.multiplyByPointAsVector(frame, Cesium.Cartesian3.UNIT_Y, new Cesium.Cartesian3());
    const direction = Cesium.Matrix4.multiplyByPointAsVector(frame,
      new Cesium.Cartesian3(0, 0, -1), new Cesium.Cartesian3());
    return { destination, orientation: { direction, up } };
  }

  async function focusSpecies(item, openPanel = false) {
    const token = ++speciesFlightToken;
    viewer.camera.cancelFlight();
    if (activeView !== 'globe' || !speciesDesktop()) {
      await hideRanges();
      if (openPanel && token === speciesFlightToken) setPanelOpen(true);
      return;
    }
    await showRangesForItem(item);
    if (token !== speciesFlightToken || (!openPanel && !document.body.classList.contains('panel-open'))) return;
    let positions = speciesRangePositions();
    if (!positions.length && item.location?.lng != null && item.location?.lat != null) {
      const lng = Number(item.location.lng), lat = Number(item.location.lat);
      if (Number.isFinite(lng) && Number.isFinite(lat)) positions = [Cesium.Cartesian3.fromDegrees(lng, lat)];
    }
    if (!positions.length) { if (openPanel) setPanelOpen(true); return; }
    const canvas = viewer.scene.canvas;
    const target = speciesDestination(positions, canvas.clientWidth, canvas.clientHeight,
      DOM.panelEl?.offsetWidth || 0, viewer.camera.frustum, null,
      speciesFocusPositions(speciesRangeGroups(), positions));
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPECIES_FLIGHT_SECONDS;
    if (openPanel) setPanelOpen(true);
    viewer.camera.flyTo({ ...target,
      duration,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
    });
  }

  function restoreSpeciesView(immediate = false) {
    ++speciesFlightToken;
    clearTimeout(speciesResizeTimer);
    const saved = speciesReturnView;
    speciesReturnView = null;
    if (!saved || activeView !== 'globe') return;
    viewer.camera.cancelFlight();
    const duration = immediate || matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPECIES_FLIGHT_SECONDS;
    viewer.camera.flyTo({ destination: saved.destination, orientation: saved.orientation,
      duration,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
    });

  }

  function scheduleSpeciesReframe() {
    clearTimeout(speciesResizeTimer);
    if (!speciesReturnView || !document.body.classList.contains('panel-open')) return;
    speciesResizeTimer = setTimeout(() => {
      if (activeGenusItems !== null) frameGenusMap();
      else if (activeSpeciesItem) focusSpecies(activeSpeciesItem);
    }, 200);
  }

  // =========================================================
  // LAND MASK
  // =========================================================
  async function loadAndDownscaleMaskToTexture(url) {
    const img = await Cesium.Resource.fetchImage({ url });
    const gl = viewer.scene.context?._gl;
    if (!gl) throw new Error("WebGL context not available");

    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    let dstW = srcW;
    let dstH = srcH;

    if (dstW > maxTex || dstH > maxTex) {
      const scale = Math.min(maxTex / dstW, maxTex / dstH);
      dstW = Math.floor(dstW * scale);
      dstH = Math.floor(dstH * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, dstW, dstH);

    return new Cesium.Texture({
      context: viewer.scene.context,
      source: canvas
    });
  }

  // Prepare the mask independently so the header and data do not wait for it.
  async function prepareIntroMask() {
    try {
      const maskTex = await loadAndDownscaleMaskToTexture(CONFIG.LAND_MASK_URL);
  
      const landStage = new Cesium.PostProcessStage({
        name: "land-grade",
        uniforms: {
          maskTex,
          landContrast: CONFIG.LAND_GRADE.contrast,
          landSaturation: CONFIG.LAND_GRADE.saturation,
          landBlueBoost: CONFIG.LAND_GRADE.blueBoost,
          landLift: CONFIG.LAND_GRADE.lift,
          landRgCut: CONFIG.LAND_GRADE.rgCut,
          strength: CONFIG.LAND_GRADE.strength
        },
        fragmentShader: `
          uniform sampler2D colorTexture;
          uniform sampler2D maskTex;
  
          uniform float landContrast;
          uniform float landSaturation;
          uniform float landBlueBoost;
          uniform float landLift;
          uniform float landRgCut;
          uniform float strength;
  
          #if __VERSION__ == 300
            in vec2 v_textureCoordinates;
            out vec4 fragColor;
            #define TEX(S,U) texture(S,U)
            #define OUT fragColor
          #else
            varying vec2 v_textureCoordinates;
            #define TEX(S,U) texture2D(S,U)
            #define OUT gl_FragColor
          #endif
  
          vec3 applyContrast(vec3 c, float k){ return (c - 0.5) * k + 0.5; }
          vec3 applySaturation(vec3 c, float s){
            float l = dot(c, vec3(0.2126,0.7152,0.0722));
            return mix(vec3(l), c, s);
          }
  
          void main(){
            vec2 uv = v_textureCoordinates;
  
            vec4 col = TEX(colorTexture, uv);
            vec3 c = col.rgb;
  
            float water = TEX(maskTex, uv).r;
            float landMask = 1.0 - water;
  
            float w = smoothstep(0.35, 0.65, landMask) * strength;
  
            vec3 land = c;
            land = applyContrast(land, landContrast);
            land = applySaturation(land, landSaturation);
  
            land.r = max(0.0, land.r - landRgCut);
            land.g = max(0.0, land.g - landRgCut);
            land.b = min(1.0, land.b + landBlueBoost);
  
            land = clamp(land + landLift, 0.0, 1.0);
  
            OUT = vec4(mix(c, land, w), col.a);
          }
        `
      });
  
      viewer.scene.postProcessStages.add(landStage);
      introLandStage = landStage;
    } catch (e) {
      console.warn("Land-grade stage failed, continuing without it:", e);
    }
    introMaskReady = true;
    viewer.scene.requestRender?.();
  }
  prepareIntroMask();


  // =========================================================
  // TOOLTIP
  // =========================================================
  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };

  addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    },
    { passive: true }
  );

  // Reuse each Webflow date row, replacing only its extinction icon.
  function normalizeExtinctionDate(date) {
    if (!date) return;
    let row = date.closest('.last-seen-content, .card-date, .card-last-seen');
    if (!row) row = date.parentElement;
    if (!row) return;
    if (row.classList.contains('card-body') || row === DOM.tip) {
      const wrapper = document.createElement('div');
      row.insertBefore(wrapper, date);
      wrapper.appendChild(date);
      row = wrapper;
    }
    row.classList.add('globe-extinction-row');
    date.classList.add('globe-extinction-value');
    let icon = row.querySelector('.cross, .globe-extinction-cross, img, svg');
    if (!icon || icon.tagName !== 'IMG') {
      const image = document.createElement('img');
      if (icon) icon.replaceWith(image);
      else row.insertBefore(image, date);
      icon = image;
    }
    icon.classList.add('globe-extinction-cross');
    icon.removeAttribute('srcset');
    icon.removeAttribute('sizes');
    icon.src = 'data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEzLjYzNjciIHZpZXdCb3g9IjAgMCAxMCAxMy42MzY3IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVW5pb24iIGQ9Ik01LjYyMTA5IDBDNS45MzIzMiAwLjAwMDIzNTY0MSA2LjE4NDU3IDAuMjQzNzU1IDYuMTg0NTcgMC41NDM5NDVWMy40MTY5OUg5LjQzNTU1QzkuNzQ2OTQgMy40MTY5OSA5Ljk5OTk0IDMuNjU5NjcgMTAgMy45NTk5NlY1LjExNDI2QzkuOTk5ODMgNS40MTQ0NSA5Ljc0Nzg0IDUuNjU3MjEgOS40MzY1MiA1LjY1NzIzSDYuMTg0NTdWMTMuMDkyOEM2LjE4NDU3IDEzLjM5MyA1LjkzMTc2IDEzLjYzNjUgNS42MjEwOSAxMy42MzY3SDQuNDIzODNDNC4xMTI1MyAxMy42MzY2IDMuODYwMzUgMTMuMzkzIDMuODYwMzUgMTMuMDkyOFY1LjY1NzIzSDAuNTYzNDc3QzAuMjUyMzA3IDUuNjU3MDUgMC4wMDAxNjg3NDkgNS40MTQzNSAwIDUuMTE0MjZWMy45NTk5NkM1Ljc2Mjc3ZS0wNSAzLjY1OTc4IDAuMjUyMjM4IDMuNDE3MTcgMC41NjM0NzcgMy40MTY5OUgzLjg2MDM1VjAuNTQzOTQ1QzMuODYwMzUgMC4yNDM3MDUgNC4xMTI1MyAwLjAwMDE1MzI3IDQuNDIzODMgMEg1LjYyMTA5WiIgZmlsbD0iI0ZGNTEwMCIvPgo8L3N2Zz4K';
    icon.width = 10;
    icon.height = 13.6367;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
  }

  function hideTooltip() {
    if (!DOM.tip) return;
    DOM.tip.style.opacity = "0";
    DOM.tip.style.transform = "translateY(6px)";
  }

  function showTooltip(item, rightEdge = innerWidth) {
    if (!DOM.tip || !item) return;

   preloadPanelImageForItem(item);

    U.setWFImage(DOM.tipImg, item.images.tooltip);
    U.setText(DOM.tipNameDe, item.name.de);
    U.setText(DOM.tipNameLat, item.name.lat);
    U.setText(DOM.tipLast, item.last_seen);
    if (DOM.tipLast) DOM.tipLast.closest(".globe-extinction-row").hidden = !item.last_seen;

    const w = DOM.tip.offsetWidth || 320;
    const h = DOM.tip.offsetHeight || 180;

    const x = rightEdge < innerWidth && pointer.x + 14 + w > rightEdge - 12
      ? pointer.x - w - 14 : pointer.x + 14;
    DOM.tip.style.left = U.clamp(x, 12, Math.max(12, rightEdge - w - 12)) + 'px';
    DOM.tip.style.top =
      U.clamp(pointer.y + 14, 12, innerHeight - h - 12) + "px";
    DOM.tip.style.opacity = "1";
    DOM.tip.style.transform = "translateY(0)";

  }

  normalizeExtinctionDate(DOM.tipLast);
  hideTooltip();

  document.addEventListener(
    "click",
    (e) => {
      if (DOM.tip && DOM.tip.contains(e.target)) return;
      hideTooltip();
    },
    true
  );

  // =========================================================
  // DATA STATE
  // =========================================================
  let ALL = [];
  let inDetailMode = false;
  let GENUS_BY_KEY = new Map();
  let FAMILY_BY_KEY = new Map();
  let activeSpeciesItem = null;

  // =========================================================
  // PANEL FILL
  // =========================================================
  function fillPanel(item) {
    if (!item) return;
    activeSpeciesItem = item;

    updateAIImageInfoButton(item);

     setPanelImageForItem(item);

    U.setText(DOM.panelFamilyLink, item.taxonomy.family);
    U.setText(DOM.panelGenusLink, item.taxonomy.genus);
    U.setText(DOM.panelNameDe, germanDisplayName(item.name.de));
    U.setText(DOM.panelNameLat, item.name.lat);
    U.setText(DOM.panelExtDate, item.extinction_date || item.last_seen || "");

    U.setHTML(DOM.panelDesc, item.panel.description);
    U.setHTML(DOM.panelHabitat, item.panel.habitat_text);
    U.setHTML(DOM.panelExtinction, item.panel.extinction_text);

    renderReferencesList(DOM.speciesReferencesList, item);
    setReferencesAccordionState(
      DOM.speciesReferencesContent,
      DOM.speciesReferencesIcon,
      false
    );
  }

  function fillFamilyPanel(familyItem, speciesList = []) {
    if (!familyItem) return;

    const speciesCount = speciesList.length;
    const genusCount = new Set(
      speciesList.map((x) => x?.taxonomy?.genus_key).filter(Boolean)
    ).size;
    const familyDate = familyItem?.extinction_date || "";

    U.setText(DOM.familyNameLat, familyItem?.name?.lat || "");
    U.setText(DOM.familyNameDe, familyItem?.name?.de || "");
    U.setText(DOM.familyExtDate, familyDate);
    U.setHTML(DOM.familyDesc, familyItem?.panel?.description || "");

    const extinctLabel = getExtinctSpeciesFormsLabel(speciesList);
    const genusLabel = pluralize(genusCount, "Gattung", "Gattungen");

    U.setText(
      DOM.familyCount,
      `${extinctLabel} in ${genusCount} ${genusLabel}`
    );

    renderReferencesList(DOM.familyReferencesList, familyItem);
    setReferencesAccordionState(
      DOM.familyReferencesContent,
      DOM.familyReferencesIcon,
      false
    );

    if (DOM.familyExCard) {
      DOM.familyExCard.style.display = familyDate ? "" : "none";
    }
  }

  function fillGenusPanel(genusItem, speciesList = []) {
    if (!genusItem) return;

    const speciesCount = speciesList.length;
    const genusDate = genusItem?.extinction_date || "";

    U.setText(DOM.genusFamily, genusItem?.family || "");
    if (DOM.genusFamily) DOM.genusFamily.dataset.familyKey = genusItem?.family_key || "";
    U.setText(DOM.genusNameLat, genusItem?.name?.lat || "");
    U.setText(DOM.genusNameDe, genusItem?.name?.de || "");
    U.setText(DOM.genusExtDate, genusDate);
    U.setHTML(DOM.genusDesc, genusItem?.panel?.description || "");

    U.setText(DOM.genusCount, getExtinctSpeciesFormsLabel(speciesList));

    renderReferencesList(DOM.genusReferencesList, genusItem);
    setReferencesAccordionState(
      DOM.genusReferencesContent,
      DOM.genusReferencesIcon,
      false
    );

    if (DOM.genusExCard) {
      DOM.genusExCard.style.display = genusDate ? "" : "none";
    }
  }

  function buildSpeciesCard(item, options = {}) {
    const template = DOM.speciesCardTemplate;
    if (!template || !item) return null;

    const card = template.cloneNode(true);
    card.classList.add("globe-species-card");
    card.removeAttribute("id");
    card.style.display = "";
    card.removeAttribute("aria-hidden");

    const imgEl = card.querySelector(".card-image");
    const nameDeEl = card.querySelector(".card-name-de");
    const nameLatEl = card.querySelector(".card-name-lat");
    const extDateEl = card.querySelector(
      ".card-extinction-date, .genus-extinction-date"
    );
    const habitatEl = card.querySelector(".card-habitat");
    const body = card.querySelector('.card-body');
    if (body && nameDeEl) {
      let copy = nameDeEl.parentElement;
      while (copy && copy !== body && (!copy.contains(nameLatEl) || !copy.contains(extDateEl))) copy = copy.parentElement;
      if (copy && copy !== body) copy.classList.add('globe-card-copy');
      else body.classList.add('has-flat-card-copy');
      for (const field of [nameDeEl, nameLatEl, extDateEl].filter(Boolean)) {
        let path = field.parentElement;
        while (path && path !== copy && path !== body) {
          path.classList.add('globe-card-text-path');
          path = path.parentElement;
        }
      }

      for (const child of body.children) {
        if (child !== habitatEl && child.childElementCount === 0 && !child.textContent.trim()) child.classList.add('globe-card-divider');
      }
    }


    if (!options.deferImage) U.setWFImage(imgEl, item?.images?.panel || CONFIG.DEFAULT_PANEL_IMG);
    U.setText(nameDeEl, item?.name?.de || "");
    U.setText(nameLatEl, item?.name?.lat || "");

    const date = item?.extinction_date || item?.last_seen || "";
    U.setText(extDateEl, date);
    normalizeExtinctionDate(extDateEl);
    if (extDateEl) {
      extDateEl.style.display = date ? "" : "none";
      extDateEl.closest(".globe-extinction-row").hidden = !date;
    }

    U.setText(habitatEl, item?.habitat || "");
    if (habitatEl) habitatEl.style.display = item?.habitat ? "" : "none";

   card.addEventListener("pointerenter", () => {
      preloadPanelImageForItem(item);
    });

    card.addEventListener("focusin", () => {
      preloadPanelImageForItem(item);
    });
     
     card.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await openSpeciesFromCard(item);
    });

    return card;
  }

  function renderGenusCards(speciesList = []) {
    const container = DOM.genusCards;
    if (!container) return;

    clearGeneratedCards(container);

    for (const item of [...speciesList].sort(compareSpeciesAlpha)) {
      const card = buildSpeciesCard(item);
      if (card) {
        bindGenusCardMapHover(card, item);
        container.appendChild(card);
      }
    }
  }
   function updateFamilyGenusStickyTracks(container = DOM.familyCards) {
  if (!container) return;

  const groups = Array.from(container.querySelectorAll(".family-genus-group"));

  for (const group of groups) {
    const track = group.querySelector(".family-genus-label-track");
    const row = group.querySelector(".family-genus-card-row");
    const cards = Array.from(row?.querySelectorAll(".species-card") || []);

    if (!track || !row || !cards.length) continue;

    const rowWidth = Math.ceil(
      row.scrollWidth || row.getBoundingClientRect().width
    );

    let trackWidth = rowWidth;

    if (cards.length > 1) {
      const rowRect = row.getBoundingClientRect();
      const lastCardRect = cards[cards.length - 1].getBoundingClientRect();

      /* Sticky endet beim Anfang der letzten Card */
      trackWidth = Math.max(0, Math.round(lastCardRect.left - rowRect.left));
    }

    track.style.setProperty("--genus-label-track-width", `${trackWidth}px`);
  }
}
function renderFamilyCards(speciesList = []) {
  const container = DOM.familyCards;
  if (!container) return;

  container.innerHTML = "";

  const sorted = [...speciesList].sort((a, b) => {
    return (
      compareText(getGenusHeadingLabel(a), getGenusHeadingLabel(b)) ||
      compareSpeciesAlpha(a, b)
    );
  });

  const groups = [];
  const groupByKey = new Map();

  for (const item of sorted) {
    const genusLabel = getGenusHeadingLabel(item);
    const genusKey = item?.taxonomy?.genus_key || genusLabel || "";

    let group = groupByKey.get(genusKey);

    if (!group) {
      group = {
        key: genusKey,
        label: genusLabel,
        items: []
      };
      groupByKey.set(genusKey, group);
      groups.push(group);
    }

    group.items.push(item);
  }

  for (const group of groups) {
    const groupEl = document.createElement("div");
   groupEl.className = "family-genus-group";
   groupEl.classList.add(
   group.items.length > 1 ? "is-multi-genus" : "is-single-genus"
);
   groupEl.dataset.genusLabel = group.label || "";
   groupEl.dataset.genusKey = group.key || "";
   groupEl.dataset.cardCount = String(group.items.length);

    const labelTrack = document.createElement("div");
    labelTrack.className = "family-genus-label-track";

    const labelEl = createFamilyGenusLabel(group.label, group.key);
    labelTrack.appendChild(labelEl);
    groupEl.appendChild(labelTrack);

    const cardsRow = document.createElement("div");
    cardsRow.className = "family-genus-card-row";

    for (const item of group.items) {
      const card = buildSpeciesCard(item);
      if (card) cardsRow.appendChild(card);
    }

    groupEl.appendChild(cardsRow);
    container.appendChild(groupEl);
  }

  doubleRAF(() => {
    updateFamilyGenusStickyTracks(container);
    updateCardRailTitleLayout(container);
    updateStickyFamilyGenusLink();
  });
}
  function closeSecondaryPanels() {
    DOM.familyPanel?.classList.remove("is-open");
    DOM.genusPanel?.classList.remove("is-open");
  }

  function finalizeSecondaryPanel(panelEl, cardsEl, genusItems = []) {
    closeSecondaryPanels();
    resetPanelScroll(panelEl);
    if (cardsEl) cardsEl.scrollLeft = 0;
    panelEl?.classList.add("is-open");
    setPanelOpen(true);
    updateCardRailTitleLayout(cardsEl);
    if (panelEl === DOM.genusPanel) {
      void showGenusMap(genusItems).catch(error => console.warn('Gattungsansicht konnte nicht geladen werden', error));
    } else {
      activeGenusItems = null;
      ++speciesFlightToken;
      viewer.camera.cancelFlight();
      void hideRanges();
      inDetailMode = false;
      setAllPointsVisible(true);
    }
  }

  async function openSpeciesFromCard(item) {
    if (!item) return;

    hideGenusCardMapImage(null, true);
    resetGenusMarkerHover(true);
    viewer.scene.canvas.style.cursor = '';
    activeGenusItems = null;
    rememberSpeciesView();
    closeSecondaryPanels();
    hideTooltip();

    activeSpeciesItem = item;
    inDetailMode = true;

    fillPanel(item);
    resetPanelScroll(DOM.panelEl);
    resetPanelScroll(DOM.genusPanel);
    resetPanelScroll(DOM.familyPanel);
    resetCardRailScroll();
    if (activeView === 'cards') {
      overviewReturnFocus = document.activeElement && overview.contains(document.activeElement) ? document.activeElement : null;
      setPanelOpen(true);
      return;
    }
    setAllPointsVisible(false);

    await focusSpecies(item, true);
  }

  function openGenusPanelByKey(genusKey) {
    if (!genusKey) return;

    const genusItem = GENUS_BY_KEY.get(genusKey);
    if (!genusItem) return;

    const speciesInGenus = ALL.filter(
      (x) => x?.taxonomy?.genus_key === genusKey
    );

    fillGenusPanel(genusItem, speciesInGenus);
    renderGenusCards(speciesInGenus);
    finalizeSecondaryPanel(DOM.genusPanel, DOM.genusCards, speciesInGenus);
  }

  function openGenusPanelFromSpecies(speciesItem) {
    openGenusPanelByKey(speciesItem?.taxonomy?.genus_key || "");
  }

  function openFamilyPanelFromSpecies(speciesItem) {
    openFamilyPanelByKey(speciesItem?.taxonomy?.family_key || "");
  }

  function openFamilyPanelByKey(familyKey) {
    if (!familyKey) return;

    const familyItem = FAMILY_BY_KEY.get(familyKey);
    if (!familyItem) return;

    const speciesInFamily = ALL.filter(
      (x) => x?.taxonomy?.family_key === familyKey
    );
    fillFamilyPanel(familyItem, speciesInFamily);
    renderFamilyCards(speciesInFamily);
    finalizeSecondaryPanel(DOM.familyPanel, DOM.familyCards);

    doubleRAF(() => {
      updateStickyFamilyGenusLink();
    });
  }

  async function closeAllPanels(immediateCameraReturn = false) {
    ++speciesFlightToken;
    viewer.camera.cancelFlight();
    closeSecondaryPanels();
    closeAIImageModal();
    updateAIImageInfoButton(null);
    closeAllReferencesAccordions();
    resetAllPanelScrollPositions();
    await restoreDefaultState();
    setPanelOpen(false);
    restoreSpeciesView(immediateCameraReturn === true);
    if (activeView === 'cards' && overviewReturnFocus?.isConnected) {
      overviewReturnFocus.focus({ preventScroll: true });
      overviewReturnFocus = null;
    }
  }

  DOM.panelFamilyLink?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeSpeciesItem) openFamilyPanelFromSpecies(activeSpeciesItem);
  });

  DOM.panelGenusLink?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeSpeciesItem) openGenusPanelFromSpecies(activeSpeciesItem);
  });

  DOM.genusFamily?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openFamilyPanelByKey(DOM.genusFamily?.dataset.familyKey || activeSpeciesItem?.taxonomy?.family_key || "");
  });

  DOM.familyStickyGenusLink?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const genusKey = DOM.familyStickyGenusLink?.dataset.genusKey || "";
    if (!genusKey) return;

    openGenusPanelByKey(genusKey);
  });

  [DOM.panelEl, DOM.familyPanel, DOM.genusPanel].forEach((panel) => {
    panel?.addEventListener("click", (e) => e.stopPropagation());
  });

  DOM.panelOverlay?.addEventListener("click", async (e) => {
    const clickedInsidePanel = [DOM.panelEl, DOM.familyPanel, DOM.genusPanel].some(
      (panel) => panel && panel.contains(e.target)
    );
    if (!clickedInsidePanel) await closeAllPanels();
  });

  DOM.panelCloseBtn?.addEventListener("click", closeAllPanels);
  DOM.familyCloseBtn?.addEventListener("click", closeAllPanels);
  DOM.genusCloseBtn?.addEventListener("click", closeAllPanels);

  document.addEventListener("keydown", async (e) => {
    if (e.key !== "Escape") return;

    if (DOM.aiImageModal?.classList.contains("is-open")) {
      closeAIImageModal();
      return;
    }

    await closeAllPanels();
  });

  // =========================================================
  // DATA LOADERS
  // =========================================================
  async function loadSpecies() {
    const r = await fetch(CONFIG.DATA_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("Failed to load species JSON");
    const data = await r.json();
    return Array.isArray(data) ? data.map(normalizeItem) : [];
  }

  async function loadJsonArray(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to load JSON: ${url}`);
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  }

  // =========================================================
  // POINTS + EVENTS
  // =========================================================
  const points = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection()
  );
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  // Genus markers reuse the original Webflow species tooltip and species action.
  let hoveredGenusMarker = null;
  const genusMarkerSizes = new WeakMap();
  const genusMarkerAnimations = new Map();

  function animateGenusMarker(point, grow, immediate = false) {
    if (!point) return;
    if (!genusMarkerSizes.has(point)) genusMarkerSizes.set(point, point.pixelSize);
    const base = genusMarkerSizes.get(point);
    cancelAnimationFrame(genusMarkerAnimations.get(point));
    genusMarkerAnimations.delete(point);
    const target = base * (grow ? 1.5 : 1);
    if (immediate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      point.pixelSize = target;
      viewer.scene.requestRender?.();
      return;
    }
    const from = point.pixelSize, started = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - started) / 150);
      point.pixelSize = from + (target - from) * (1 - (1 - p) ** 3);
      viewer.scene.requestRender?.();
      if (p < 1) genusMarkerAnimations.set(point, requestAnimationFrame(tick));
      else genusMarkerAnimations.delete(point);
    };
    tick();
  }

  function resetGenusMarkerHover(immediate = false) {
    animateGenusMarker(hoveredGenusMarker, false, immediate);
    hoveredGenusMarker = null;
    if (immediate) {
      for (const [point, raf] of genusMarkerAnimations) {
        cancelAnimationFrame(raf);
        point.pixelSize = genusMarkerSizes.get(point);
      }
      genusMarkerAnimations.clear();
    }
  }

  function canUseGenusMarkers() {
    return activeView === 'globe' && speciesDesktop() && activeGenusItems !== null
      && activeGenusItems.length > 1 && document.body.classList.contains('panel-open')
      && !introActive && !hawaiiFlightActive && !hawaiiFlightPending;
  }

  function pickGenusMarker(position) {
    if (!canUseGenusMarkers()) return null;
    // A polygon can be above the point in the pick stack: search all visible hits.
    for (const picked of viewer.scene.drillPick(position, 12)) {
      const point = picked.primitive;
      if (point?.show && point.id && activeGenusItems.includes(point.id)) return point;
    }
    return null;
  }

  function updateGenusMarkerHover(position) {
    hideGenusCardMapImage();
    const point = pickGenusMarker(position);
    if (!point) {
      resetGenusMarkerHover();
      hideTooltip();
      viewer.scene.canvas.style.cursor = '';
      return;
    }
    if (hoveredGenusMarker !== point) {
      animateGenusMarker(hoveredGenusMarker, false);
      hoveredGenusMarker = point;
      animateGenusMarker(point, true);
    }
    const canvas = viewer.scene.canvas.getBoundingClientRect();
    pointer.x = canvas.left + position.x;
    pointer.y = canvas.top + position.y;
    showTooltip(point.id, Math.min(innerWidth, canvas.right - (DOM.genusPanel?.offsetWidth || 0)));
    viewer.scene.canvas.style.cursor = 'pointer';
  }

  DOM.globeHost.addEventListener('pointerleave', () => {
    resetGenusMarkerHover();
    hideTooltip();
    viewer.scene.canvas.style.cursor = '';
  });

  // Hovering a genus card highlights its marker with only the original tooltip avatar.
  let hoveredGenusCard = null;
  let genusCardMapImage = null;
  let genusCardMapAvatar = null;
  let genusCardImageRequest = 0;
  const genusCardOccluder = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84);

  function hideGenusCardMapImage(card = null, immediate = false) {
    if (!hoveredGenusCard || (card && hoveredGenusCard.card !== card)) return;
    hoveredGenusCard = null;
    ++genusCardImageRequest;
    if (genusCardMapImage) genusCardMapImage.hidden = true;
    resetGenusMarkerHover(immediate);
  }

  function updateGenusCardMapImage() {
    if (!hoveredGenusCard || !genusCardMapImage) return;
    const { card, point } = hoveredGenusCard;
    if (!canUseGenusMarkers() || !card.isConnected || !point.show) {
      hideGenusCardMapImage(null, true);
      return;
    }
    genusCardOccluder.cameraPosition = viewer.camera.positionWC;
    const screen = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, point.position);
    const canvas = viewer.scene.canvas.getBoundingClientRect();
    const right = Math.min(innerWidth, canvas.right - (DOM.genusPanel?.offsetWidth || 0)) - 12;
    const left = Math.max(12, canvas.left + 12), top = Math.max(64, canvas.top + 12);
    const bottom = Math.min(innerHeight - 12, canvas.bottom - 12);
    const x = canvas.left + (screen?.x ?? -Infinity), y = canvas.top + (screen?.y ?? -Infinity);
    if (!screen || !genusCardOccluder.isPointVisible(point.position) || x < left || x > right || y < top || y > bottom) {
      genusCardMapImage.hidden = true;
      return;
    }
    const width = genusCardMapImage.offsetWidth || 100;
    const height = genusCardMapImage.offsetHeight || width;
    const px = x + 14 + width <= right ? x + 14 : x - width - 14;
    genusCardMapImage.style.left = `${Math.max(left, Math.min(px, right - width))}px`;
    genusCardMapImage.style.top = `${Math.max(top, Math.min(y - height + 20, bottom - height))}px`;
    genusCardMapImage.hidden = false;
  }

  function showGenusCardMapImage(card, item) {
    if (!canUseGenusMarkers() || !DOM.genusCards?.contains(card) || !DOM.tipImg) return;
    let point = null;
    for (let i = 0; i < points.length; i++) {
      const candidate = points.get(i);
      if (candidate.show && candidate.id === item) { point = candidate; break; }
    }
    if (!point) return;
    if (!genusCardMapImage) {
      genusCardMapImage = document.createElement('div');
      genusCardMapImage.id = 'genus-card-map-image';
      genusCardMapImage.hidden = true;
      genusCardMapImage.setAttribute('aria-hidden', 'true');
      genusCardMapAvatar = DOM.tipImg.cloneNode(true);
      for (const element of [genusCardMapAvatar, ...genusCardMapAvatar.querySelectorAll('[id]')]) element.removeAttribute('id');
      genusCardMapImage.appendChild(genusCardMapAvatar);
      document.body.appendChild(genusCardMapImage);
    }
    const size = DOM.tipImg.offsetWidth || 100;
    genusCardMapImage.style.width = `${size}px`;
    genusCardMapImage.style.height = `${size}px`;
    hideTooltip();
    if (hoveredGenusMarker !== point) {
      animateGenusMarker(hoveredGenusMarker, false);
      hoveredGenusMarker = point;
      animateGenusMarker(point, true);
    }
    hoveredGenusCard = { card, item, point };
    const request = ++genusCardImageRequest;
    genusCardMapImage.classList.remove('is-entering');
    genusCardMapAvatar.style.visibility = 'hidden';
    updateGenusCardMapImage();
    const src = item.images?.tooltip || CONFIG.DEFAULT_TOOLTIP_IMG;
    const setImage = url => {
      if (request !== genusCardImageRequest || hoveredGenusCard?.card !== card) return;
      U.setWFImage(genusCardMapAvatar, url);
      genusCardMapAvatar.style.visibility = '';
      // Restart only when this card's image is ready, never on camera updates.
      genusCardMapImage.classList.remove('is-entering');
      void genusCardMapImage.offsetWidth;
      genusCardMapImage.classList.add('is-entering');
    };
    preloadImage(src).then(() => setImage(src)).catch(() => setImage(CONFIG.DEFAULT_TOOLTIP_IMG));
  }

  function bindGenusCardMapHover(card, item) {
    card.addEventListener('pointerenter', () => showGenusCardMapImage(card, item));
    card.addEventListener('pointerleave', () => hideGenusCardMapImage(card));
    card.addEventListener('focusin', () => showGenusCardMapImage(card, item));
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) hideGenusCardMapImage(card);
    });
  }

  // Keep the avatar attached to its geographic marker during camera flights.
  viewer.scene.postRender.addEventListener(updateGenusCardMapImage);

  function setAllPointsVisible(visible) {
    for (let i = 0; i < points.length; i++) {
      const pt = points.get(i);
      if (pt) pt.show = !!visible;
    }
  }

  function speciesMarkerStyle(item) {
    const isForm = /\bsp\./i.test(item?.name?.lat || '');
    return {
      // Centre a 2 px outline on the normal marker's circle: 6 px fill + 4 px stroke.
      pixelSize: isForm ? Math.max(1, CONFIG.POINT_SIZE - 2) : CONFIG.POINT_SIZE,
      color: Cesium.Color.fromCssColorString(isForm ? '#1F2552' : CONFIG.POINT_COLOR),
      outlineColor: Cesium.Color.fromCssColorString(CONFIG.POINT_COLOR),
      outlineWidth: isForm ? 2 : 0
    };
  }

  function addAllPoints() {
    for (const d of ALL) {
      if (d.location.lat == null || d.location.lng == null) continue;
      const p = points.add({
        position: Cesium.Cartesian3.fromDegrees(d.location.lng, d.location.lat),
        ...speciesMarkerStyle(d),
        show: !introActive
      });
      p.id = d;
    }
  }

  async function restoreDefaultState() {
    activeGenusItems = null;
    await hideRanges();
    inDetailMode = false;
    setAllPointsVisible(true);
    hideTooltip();
  }

  handler.setInputAction(
    (m) => {
      if (activeView !== 'globe') { hideRangeHover(true); return; }
      if (document.body.classList.contains('panel-open')) {
        if (activeGenusItems !== null) {
          hideRangeHover(true);
          updateGenusMarkerHover(m.endPosition);
          return;
        }
        resetGenusMarkerHover(true);
        hideTooltip();
        updateRangeHover(m.endPosition);
        return;
      }
      hideRangeHover(true);
      if (introActive || hawaiiFlightActive || hawaiiFlightPending) return;
      if (inDetailMode) {
        hideTooltip();
        return;
      }

      const picked = viewer.scene.pick(m.endPosition);
      picked?.primitive?.id ? showTooltip(picked.primitive.id) : hideTooltip();
    },
    Cesium.ScreenSpaceEventType.MOUSE_MOVE
  );

  handler.setInputAction(
    async (c) => {
      if (introActive || hawaiiFlightActive || hawaiiFlightPending) return;
      if (activeGenusItems !== null) {
        const point = pickGenusMarker(c.position);
        if (point) { await openSpeciesFromCard(point.id); return; }
      }
      const picked = viewer.scene.pick(c.position);
      // Hover targets are not species selections and do not close the art panel.
      if (resolveRangeHover(picked)) return;
      const item = picked?.primitive?.id;

      if (item) {
        await openSpeciesFromCard(item);
        return;
      }

      if (document.body.classList.contains("panel-open")) {
        await closeAllPanels();
      }
    },
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );

  // =========================================================
  // SEARCH — Figma desktop dropdown / mobile full-screen
  // Reuses the existing Webflow species tooltip as the result template.
  // =========================================================
  let searchEntries = [];
  let searchReady = false;
  let searchOpeningResult = false;
  // Original Figma logo and information component; panel action follows later.
  if (!document.getElementById('globe-brand')) {
    const brand = document.createElement('div');
    brand.id = 'globe-brand';
    brand.innerHTML = `
      <span class="gb-logo" role="img" aria-label="The Silent Globe Hawaii"></span>
      <button type="button" class="gb-info" aria-label="Informationen zu The Silent Globe">
        <span class="gb-info-default" aria-hidden="true"></span>
        <span class="gb-info-hover" aria-hidden="true"></span>
      </button>`;
    brand.addEventListener('click', (event) => event.stopPropagation());
    document.body.appendChild(brand);
  }

  // Switch between the existing globe and the species-card overview.
  if (!document.getElementById('globe-view-switch')) {
    const viewSwitch = document.createElement('div');
    viewSwitch.id = 'globe-view-switch';
    viewSwitch.setAttribute('role', 'group');
    viewSwitch.setAttribute('aria-label', 'Ansicht');
    viewSwitch.innerHTML = `
      <button type="button" class="gv-tab gv-grid" aria-label="Kartenübersicht" aria-pressed="false"><span aria-hidden="true"></span></button>
      <button type="button" class="gv-tab gv-globe is-active" aria-label="Globus" aria-pressed="true"><span aria-hidden="true"></span></button>`;
    viewSwitch.addEventListener('click', (event) => event.stopPropagation());
    document.body.appendChild(viewSwitch);
  }

  // =========================================================
  // SPECIES OVERVIEW — original Webflow cards, grouped locally.
  // =========================================================
  const overviewCollator = new Intl.Collator('de', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
  const overviewSorts = [
    ['year', 'Aussterbejahr'], ['de', 'Name (DE)'], ['lat', 'Name (Lat)'], ['region', 'Region']
  ];
  const overviewNormalize = (value) => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036fʻ’']/g, '').replace(/ß/g, 'ss').toLowerCase().trim();
  const overviewName = (item, language = 'de') => item.name?.[language] || item.name?.de || item.name?.lat || item.id || 'Ohne Namen';

  function overviewDateRange(item) {
    const text = String(item.extinction_date || item.last_seen || '').trim();
    if (/wiederentdeckt/i.test(text)) return { special: 'rediscovered', text };
    if (!text || !/\d/.test(text)) return { special: 'unknown', text };
    if (/oder\s+später/i.test(text)) return { special: 'uncertain', text };
    const centuries = text.match(/(\d{1,2})\s*\.\s*(?:oder\s+(\d{1,2})\s*\.|\/\s*(\d{1,2})\s*\.)?\s*Jh(?:r)?(?:dt|d)?\.?/i);
    if (centuries) {
      const first = Number(centuries[1]);
      const last = Number(centuries[2] || centuries[3] || centuries[1]);
      return { from: (first - 1) * 100, to: last * 100 - 1, text };
    }
    const years = (text.match(/\d{3,4}/g) || []).map(Number);
    if (!years.length) return { special: 'unknown', text };
    const from = Math.min(...years);
    const to = Math.max(...years) + (/\d{3,4}er[\s-]*Jahre/i.test(text) ? 9 : 0);
    return { from, to, text };
  }

  function overviewYearBucket(item) {
    const range = overviewDateRange(item);
    const specialLabels = { unknown: 'Ohne Datierung', uncertain: 'Zeitraum unklar', rediscovered: 'Wiederentdeckt' };
    const special = (key) => ({ key, label: specialLabels[key], order: { uncertain: 9000, unknown: 9001, rediscovered: 9002 }[key], year: Infinity });
    if (range.special) return special(range.special);
    // Before 1400 is one group; exact 1400 starts the following century group.
    const bucket = (year) => year < 1400 ? 0 : Math.floor(year / 100) * 100;
    const start = bucket(range.from);
    if (start !== bucket(range.to)) return special('uncertain');
    return { key: String(start), label: start === 0 ? '1000–1400' : String(start), order: start, year: range.from };
  }

  function overviewRegions(item) {
    const habitat = overviewNormalize(item.habitat);
    const islands = habitat.replace(/\([^)]*\)/g, '').split(/[,;/]|\s+und\s+/).map((part) => part.trim());
    const labels = { hawaii: 'Hawaii (Big Island)', kauai: 'Kauai', lanai: 'Lanai', laysan: 'Laysan', maui: 'Maui', molokai: 'Molokai', oahu: 'Oahu', niihau: 'Niihau', kahoolawe: 'Kahoolawe' };
    // A bare "Hawaii" describes the archipelago, not necessarily Big Island.
    if (habitat === 'hawaii') return ['Hawaii (ohne Inselangabe)'];
    const names = [...new Set(islands.map((name) => labels[name]).filter(Boolean))];
    return names.length ? names : /\bhawaii\b/.test(habitat) ? ['Hawaii (ohne Inselangabe)'] : [];
  }

  function overviewGroups(items, mode) {
    // Scope only the card overview; globe and global search keep the full data.
    items = items.filter((item) => overviewRegions(item).length > 0);
    const groups = new Map();
    const add = (key, label, order, item) => {
      if (!groups.has(key)) groups.set(key, { key, label, order, items: [] });
      if (item) groups.get(key).items.push(item);
    };
    if (mode === 'year') [0, 1400, 1500, 1600, 1700, 1800, 1900, 2000].forEach((year) => add(String(year), year ? String(year) : '1000–1400', year));
    for (const item of items) {
      if (mode === 'year') {
        const bucket = overviewYearBucket(item);
        add(bucket.key, bucket.label, bucket.order, item);
      } else if (mode === 'region') {
        overviewRegions(item).forEach((name) => add(name, name, name, item));
      } else {
        const initial = overviewNormalize(overviewName(item, mode)).replace(/^[^a-z]+/, '').charAt(0).toUpperCase();
        const letter = /^[A-Z]$/.test(initial) ? initial : '#';
        add(letter, letter, letter === '#' ? 'ZZZ' : letter, item);
      }
    }
    const result = [...groups.values()].sort((a, b) => typeof a.order === 'number' ? a.order - b.order : overviewCollator.compare(a.order, b.order));
    for (const group of result) group.items.sort((a, b) => {
      const spDifference = Number(/\bsp\./i.test(a.name?.lat || '')) - Number(/\bsp\./i.test(b.name?.lat || ''));
      if (spDifference) return spDifference;
      if (mode === 'year') {
        const difference = overviewYearBucket(a).year - overviewYearBucket(b).year;
        if (Number.isFinite(difference) && difference !== 0) return difference;
      }
      return overviewCollator.compare(overviewName(a, mode === 'lat' ? 'lat' : 'de'), overviewName(b, mode === 'lat' ? 'lat' : 'de'));
    });
    return result;
  }

  const overview = document.createElement('section');
  overview.id = 'species-browser';
  overview.setAttribute('aria-label', 'Kartenübersicht der Arten aus Hawaii');
  overview.setAttribute('aria-hidden', 'true');
  overview.setAttribute('inert', '');
  overview.innerHTML = `
    <div class="gbv-toolbar">
      <span id="gbv-sort-caption" class="gbv-caption">Sortieren nach:</span>
      <div class="gbv-select">
        <button type="button" id="gbv-sort" class="gbv-sort" aria-haspopup="listbox" aria-expanded="false" aria-controls="gbv-options" aria-labelledby="gbv-sort-caption gbv-sort-value"><span id="gbv-sort-value">Aussterbejahr</span><span class="gbv-chevron" aria-hidden="true"></span></button>
        <div id="gbv-options" class="gbv-options" role="listbox" aria-label="Sortierung" inert>
          ${overviewSorts.map(([value, label]) => `<button type="button" role="option" data-sort="${value}" aria-selected="${value === 'year'}" tabindex="-1">${label}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="gbv-content" aria-busy="false"></div>
    <nav class="gbv-alphabet" aria-label="Alphabetische Schnellnavigation" hidden></nav>
    <p class="gbv-status" role="status" aria-live="polite">Arten werden geladen …</p>`;
  document.body.appendChild(overview);
  const overviewContent = overview.querySelector('.gbv-content');
  const overviewStatus = overview.querySelector('.gbv-status');
  const overviewAlphabet = overview.querySelector('.gbv-alphabet');
  const overviewSortButton = overview.querySelector('.gbv-sort');
  const overviewOptions = overview.querySelector('.gbv-options');
  // Keep the menu above cards without lifting the opaque header over group titles.
  overview.appendChild(overviewOptions);
  const overviewOptionButtons = [...overviewOptions.querySelectorAll('[data-sort]')];
  let overviewSort = 'year';
  let overviewDataReady = false;
  let overviewRenderedSort = null;
  let overviewRenderToken = 0;
  let overviewSwitchToken = 0;
  let overviewGroupsOnScreen = [];
  let overviewReturnFocus = null;
  let overviewScrollFrame = 0;
  let overviewMenuOpen = false;
  let overviewHeaderLastScroll = 0;
  let overviewHeaderTravel = 0;
  let overviewAlphabetActive = null;

  function setOverviewHeaderHidden(hidden) {
    hidden = hidden && innerWidth <= 860 && activeView === 'cards';
    document.body.classList.toggle('globe-overview-header-hidden', hidden);
    overview.querySelector('.gbv-toolbar').toggleAttribute('inert', hidden);
  }

  function updateOverviewScrollHeader() {
    const top = Math.max(0, overview.scrollTop);
    const delta = top - overviewHeaderLastScroll;
    overviewHeaderLastScroll = top;
    if (innerWidth > 860 || top < 32 || overviewMenuOpen ||
        document.body.classList.contains('globe-search-open') || document.body.classList.contains('panel-open')) {
      overviewHeaderTravel = 0;
      setOverviewHeaderHidden(false);
      return;
    }
    if (Math.sign(delta) !== Math.sign(overviewHeaderTravel)) overviewHeaderTravel = 0;
    overviewHeaderTravel += delta;
    if (overviewHeaderTravel > 12) setOverviewHeaderHidden(true);
    else if (overviewHeaderTravel < -8) setOverviewHeaderHidden(false);
  }

  function positionOverviewAlphabet() {
    if (overviewAlphabet.hidden) return;
    const rect = overview.getBoundingClientRect();
    const viewport = window.visualViewport;
    const visibleTop = Math.max(rect.top, viewport?.offsetTop || 0);
    const visibleBottom = Math.min(rect.bottom, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight));
    const heading = overviewContent.querySelector('.gbv-heading');
    const top = visibleTop + overviewHeadingOffset() + (heading?.offsetHeight || 30) + 8;
    const bottom = visibleBottom - Math.max(12, parseFloat(getComputedStyle(overview).paddingBottom) || 0);
    overviewAlphabet.style.top = `${(top + bottom) / 2}px`;
    overviewAlphabet.style.maxHeight = `${Math.max(56, bottom - top - 16)}px`;
  }

  let overviewImageObserver = null;
  const overviewImageSources = new WeakMap();
  const overviewReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overviewWait = (ms) => new Promise((resolve) => setTimeout(resolve, overviewReducedMotion() ? 0 : ms));
  if ('IntersectionObserver' in window) {
    overviewImageObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        const url = overviewImageSources.get(entry.target);
        if (url) U.setWFImage(entry.target, url);
        overviewImageSources.delete(entry.target);
        overviewImageObserver.unobserve(entry.target);
      }
    }, { root: overview, rootMargin: '500px 0px' });
  }

  // Codrops Hapi: scale from the centre + linear opacity, staggered per viewport batch.
  let overviewRevealObserver = null;
  let overviewRevealFrame = 0;
  const overviewRevealQueue = new Set();

  function stopOverviewCardReveal() {
    overviewRevealObserver?.disconnect();
    overviewRevealObserver = null;
    cancelAnimationFrame(overviewRevealFrame);
    overviewRevealFrame = 0;
    overviewRevealQueue.clear();
  }

  function revealOverviewCards() {
    overviewRevealFrame = 0;
    if (activeView !== 'cards') { overviewRevealQueue.clear(); return; }
    const cards = [...overviewContent.querySelectorAll('.gbv-card')]
      .filter((card) => overviewRevealQueue.has(card));
    overviewRevealQueue.clear();
    cards.forEach((card, index) => {
      card.style.setProperty('--gbv-reveal-delay', `${index * 50}ms`);
      card.style.setProperty('--gbv-reveal-duration', `${600 + index * 75}ms`);
      card.classList.remove('is-reveal-pending');
      card.classList.add('is-revealed');
    });
  }

  function startOverviewCardReveal() {
    stopOverviewCardReveal();
    const cards = overviewContent.querySelectorAll('.gbv-card');
    const immediate = overviewReducedMotion() || !('IntersectionObserver' in window);
    if (!immediate) {
      overviewRevealObserver = new IntersectionObserver((entries) => {
        if (activeView !== 'cards') return;
        for (const entry of entries) if (entry.isIntersecting) {
          overviewRevealObserver.unobserve(entry.target);
          overviewRevealQueue.add(entry.target);
        }
        if (overviewRevealQueue.size && !overviewRevealFrame) {
          overviewRevealFrame = requestAnimationFrame(revealOverviewCards);
        }
      }, { root: overview, threshold: 0.01 });
    }
    cards.forEach((card) => {
      card.classList.remove('is-revealed');
      card.classList.toggle('is-reveal-pending', !immediate);
      if (!immediate) overviewRevealObserver.observe(card);
    });
  }

  function positionOverviewMenu() {
    const rect = overviewSortButton.getBoundingClientRect();
    overviewOptions.style.left = `${rect.left}px`;
    overviewOptions.style.top = `${rect.bottom + 2}px`;
    overviewOptions.style.width = `${rect.width}px`;
  }
  function isWithinOverviewSort(target) {
    return overview.querySelector('.gbv-select').contains(target) || overviewOptions.contains(target);
  }

  function setOverviewMenu(open, focusOption = false) {
    overviewMenuOpen = open;
    if (open) positionOverviewMenu();
    overview.classList.toggle("is-sort-open", open);
    overviewOptions.toggleAttribute('inert', !open);
    overviewOptions.classList.toggle('is-open', open);
    overviewSortButton.setAttribute('aria-expanded', String(open));
    if (open && focusOption) overviewOptionButtons.find((button) => button.dataset.sort === overviewSort)?.focus();
  }

  function makeOverviewCard(item, styles) {
    const card = buildSpeciesCard(item, { deferImage: true });
    if (!card) return null;
    const elements = [card, ...card.querySelectorAll('*')];
    elements.forEach((element, index) => {
      (styles[index] || []).forEach(([property, value]) => {
        if (index === 0 && property === 'display') return;
        element.style.setProperty(property, value);
      });
      element.removeAttribute('id');
      element.removeAttribute('data-w-id');
      element.removeAttribute('aria-labelledby');
      element.removeAttribute('aria-describedby');
    });
    card.classList.add('gbv-card');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${overviewName(item, overviewSort === 'lat' ? 'lat' : 'de')} – Art öffnen`);
    card.tabIndex = 0;
    card.addEventListener('keydown', (event) => {
      if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation(); card.click();
    });
    U.setText(card.querySelector('.card-name-de'), overviewName(item));
    if (overviewSort === 'lat') {
      U.setText(card.querySelector('.card-name-de'), overviewName(item, 'lat'));
      U.setText(card.querySelector('.card-name-lat'), item.name?.de || '');
    }
    const image = card.querySelector('.card-image');
    const url = item.images?.panel || CONFIG.DEFAULT_PANEL_IMG;
    if (image) {
      image.removeAttribute('srcset'); image.removeAttribute('sizes');
      if (image.tagName === 'IMG') {
        image.addEventListener('error', () => {
          if (CONFIG.DEFAULT_PANEL_IMG && image.getAttribute('src') !== CONFIG.DEFAULT_PANEL_IMG) U.setWFImage(image, CONFIG.DEFAULT_PANEL_IMG);
        }, { once: true });
        image.removeAttribute('src');
        image.loading = 'lazy'; image.decoding = 'async';
        image.setAttribute('fetchpriority', 'low');
        image.alt = overviewName(item);
      } else image.style.backgroundImage = 'none';
      if (overviewImageObserver) overviewImageSources.set(image, url);
      else U.setWFImage(image, url);
    }
    return card;
  }

  async function renderOverview(animate = true, resetScroll = true) {
    if (!overviewDataReady || activeView !== 'cards') return;
    if (!DOM.speciesCardTemplate) {
      overviewStatus.textContent = 'Die bestehende Webflow-Kartenvorlage #species-card-template fehlt.';
      return;
    }
    const token = ++overviewRenderToken;
    overviewContent.setAttribute('aria-busy', 'true');
    if (animate && overviewRenderedSort !== null) { overviewContent.classList.add('is-changing'); await overviewWait(125); }
    if (token !== overviewRenderToken || activeView !== 'cards') return;
    overviewImageObserver?.disconnect();
    stopOverviewCardReveal();
    const groups = overviewGroups(ALL, overviewSort);
    const styles = snapshotSearchTooltipStyles(DOM.speciesCardTemplate);
    const fragment = document.createDocumentFragment();
    const sections = [];
    let built = 0;
    for (const [index, group] of groups.entries()) {
      const section = document.createElement('section');
      section.className = 'gbv-group';
      section.id = `gbv-group-${index}`;
      const heading = document.createElement('h2');
      heading.className = 'gbv-heading';
      heading.id = `${section.id}-heading`;
      section.setAttribute('aria-labelledby', heading.id);
      const title = document.createElement('span'); title.textContent = group.label;
      const count = document.createElement('span'); count.className = 'gbv-count';
      count.textContent = `${group.items.length} ${group.items.length === 1 ? 'Art/Form' : 'Arten/Formen'}`;
      heading.append(title, count);
      const grid = document.createElement('div'); grid.className = 'gbv-grid';
      for (const item of group.items) {
        const card = makeOverviewCard(item, styles);
        if (card) {
          if (!overviewReducedMotion() && 'IntersectionObserver' in window) card.classList.add('is-reveal-pending');
          grid.appendChild(card);
        }
        if (++built % 48 === 0) {
          await new Promise(requestAnimationFrame);
          if (token !== overviewRenderToken || activeView !== 'cards') return;
        }
      }
      section.append(heading, grid); fragment.appendChild(section);
      sections.push({ key: group.key, section });
    }
    if (token !== overviewRenderToken || activeView !== 'cards') return;
    overviewContent.replaceChildren(fragment);
    overviewGroupsOnScreen = sections;
    overviewRenderedSort = overviewSort;
    const alphabetical = ['de', 'lat'].includes(overviewSort);
    overview.classList.toggle('has-alphabet', alphabetical);
    overviewAlphabet.hidden = !alphabetical;
    overviewAlphabet.replaceChildren();
    overviewAlphabetActive = null;
    if (alphabetical) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      if (groups.some((group) => group.key === '#')) letters.push('#');
      for (const letter of letters) {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = letter; button.dataset.letter = letter;
        button.setAttribute('aria-label', `Zum Buchstaben ${letter}`);
        button.disabled = !groups.some((group) => group.key === letter);
        overviewAlphabet.appendChild(button);
      }
    }
    overviewContent.querySelectorAll('.card-image').forEach((image) => {
      if (overviewImageSources.has(image)) overviewImageObserver?.observe(image);
    });
    if (resetScroll) {
      overview.scrollTop = 0;
      overviewHeaderLastScroll = 0; overviewHeaderTravel = 0;
      setOverviewHeaderHidden(false);
    }
    const count = ALL.filter((item) => overviewRegions(item).length).length;
    overviewStatus.textContent = `${count} Arten/Formen aus Hawaii, sortiert nach ${overviewSorts.find(([value]) => value === overviewSort)[1]}.`;
    overviewStatus.classList.add('is-sr-only');
    overviewContent.setAttribute('aria-busy', 'false');
    requestAnimationFrame(() => {
      if (token === overviewRenderToken && activeView === 'cards') { overviewContent.classList.remove('is-changing'); updateOverviewAlphabet(); startOverviewCardReveal(); }
    });
  }

  function overviewHeadingOffset() {
    const heading = overviewContent.querySelector('.gbv-heading');
    return heading ? parseFloat(getComputedStyle(heading).top) || 0 : 0;
  }

  function updateOverviewStickyHeadings() {
    const stickyTop = overview.getBoundingClientRect().top + overviewHeadingOffset();
    for (const group of overviewGroupsOnScreen) {
      const heading = group.section.querySelector('.gbv-heading');
      if (!heading) continue;
      // Clip a departing sticky title at the header edge, keeping the logo clear.
      const clipped = Math.max(0, stickyTop - heading.getBoundingClientRect().top);
      heading.style.setProperty('--gbv-title-clip', `${clipped}px`);
    }
  }

  function updateOverviewAlphabet() {
    overviewScrollFrame = 0;
    updateOverviewStickyHeadings();
    positionOverviewAlphabet();
    if (overviewAlphabet.hidden) return;
    let active = overviewGroupsOnScreen[0]?.key;
    for (const group of overviewGroupsOnScreen) {
      if (group.section.getBoundingClientRect().top <= overview.getBoundingClientRect().top + overviewHeadingOffset() + 1) active = group.key;
      else break;
    }
    if (overview.scrollTop > 0 && overview.scrollTop + overview.clientHeight >= overview.scrollHeight - 2) active = overviewGroupsOnScreen.at(-1)?.key;
    overviewAlphabet.querySelectorAll('button').forEach((button) => {
      if (button.dataset.letter === active) {
        button.setAttribute('aria-current', 'true');
        if (overviewAlphabetActive !== active) {
          overviewAlphabet.scrollTop = button.offsetTop - (overviewAlphabet.clientHeight - button.offsetHeight) / 2;
        }
      } else button.removeAttribute('aria-current');
    });
    overviewAlphabetActive = active;
  }

  function updateOverviewTabs(next) {
    document.querySelectorAll('#globe-view-switch .gv-tab').forEach((button) => {
      const selected = button.classList.contains(next === 'cards' ? 'gv-grid' : 'gv-globe');
      button.classList.toggle('is-active', selected); button.setAttribute('aria-pressed', String(selected));
    });
  }

  async function setOverviewView(next) {
    const token = ++overviewSwitchToken;
    if (activeView === next) { updateOverviewTabs(next); return; }
    setOverviewMenu(false);
    setOverviewHeaderHidden(false);
    overviewHeaderLastScroll = overview.scrollTop; overviewHeaderTravel = 0;
    setSearchOpen(false);
    await closeAllPanels(true);
    if (token !== overviewSwitchToken) return;
    if (next === 'cards') {
      hawaiiFlightPending = false;
      viewer.camera.cancelFlight();
      hawaiiOverviewLocked = false;
      overviewCameraSnapshot = {
        destination: Cesium.Cartesian3.clone(viewer.camera.positionWC),
        direction: Cesium.Cartesian3.clone(viewer.camera.directionWC),
        up: Cesium.Cartesian3.clone(viewer.camera.upWC)
      };
      activeView = 'cards';
      updateOverviewTabs(next);
      viewer.useDefaultRenderLoop = false;
      viewer.scene.screenSpaceCameraController.enableInputs = false;
      DOM.globeHost.setAttribute('aria-hidden', 'true');
      DOM.globeHost.setAttribute('inert', '');
      document.body.classList.add('globe-cards-view');
      overview.removeAttribute('inert'); overview.setAttribute('aria-hidden', 'false');
      if (overviewRenderedSort !== overviewSort || overviewContent.getAttribute('aria-busy') === 'true') await renderOverview(false, true);
      else startOverviewCardReveal();
      overviewContent.querySelectorAll('.card-image').forEach((image) => {
        if (overviewImageSources.has(image)) overviewImageObserver?.observe(image);
      });
    } else {
      activeView = 'globe';
      stopOverviewCardReveal();
      updateOverviewTabs(next);
      ++overviewRenderToken;
      document.body.classList.remove('globe-cards-view');
      overview.setAttribute('inert', ''); overview.setAttribute('aria-hidden', 'true');
      DOM.globeHost.removeAttribute('aria-hidden'); DOM.globeHost.removeAttribute('inert');
      viewer.useDefaultRenderLoop = true;
      viewer.resize();
      if (overviewCameraSnapshot) viewer.camera.setView({ destination: overviewCameraSnapshot.destination, orientation: { direction: overviewCameraSnapshot.direction, up: overviewCameraSnapshot.up } });
      viewer.scene.screenSpaceCameraController.enableInputs = !introActive;
      viewer.scene.requestRender?.();
    }

  }

  document.querySelector('#globe-view-switch .gv-grid')?.addEventListener('click', () => setOverviewView('cards'));
  document.querySelector('#globe-view-switch .gv-globe')?.addEventListener('click', () => setOverviewView('globe'));
  overviewSortButton.addEventListener('click', () => setOverviewMenu(!overviewMenuOpen));
  overviewSortButton.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOverviewMenu(true, true); }
  });
  overviewOptions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-sort]');
    if (!option) return;
    const changed = overviewSort !== option.dataset.sort;
    overviewSort = option.dataset.sort;
    overview.querySelector('#gbv-sort-value').textContent = option.textContent;
    overviewOptionButtons.forEach((button) => button.setAttribute('aria-selected', String(button === option)));
    setOverviewMenu(false); overviewSortButton.focus();
    if (changed) renderOverview();
  });
  overviewOptions.addEventListener('keydown', (event) => {
    const index = overviewOptionButtons.indexOf(document.activeElement);
    let target;
    if (event.key === 'ArrowDown') target = (index + 1) % overviewOptionButtons.length;
    if (event.key === 'ArrowUp') target = (index - 1 + overviewOptionButtons.length) % overviewOptionButtons.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = overviewOptionButtons.length - 1;
    if (target !== undefined) { event.preventDefault(); overviewOptionButtons[target].focus(); }
    if (event.key === 'Tab') setOverviewMenu(false);
  });
  overview.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overviewMenuOpen) { event.preventDefault(); event.stopImmediatePropagation(); setOverviewMenu(false); overviewSortButton.focus(); }
  }, true);
  overviewAlphabet.addEventListener('click', (event) => {
    const button = event.target.closest('[data-letter]');
    if (!button || button.disabled) return;
    const group = overviewGroupsOnScreen.find((entry) => entry.key === button.dataset.letter);
    if (group) {
      if (innerWidth <= 860) setOverviewHeaderHidden(true);
      const offset = innerWidth <= 860
        ? parseFloat(getComputedStyle(overview).getPropertyValue('--gbv-mobile-safe-top')) || 0
        : overviewHeadingOffset();
      overview.scrollTo({ top: Math.max(0, overview.scrollTop + group.section.getBoundingClientRect().top - offset), behavior: overviewReducedMotion() ? 'instant' : 'smooth' });
    }
  });
  overview.addEventListener('scroll', () => {
    updateOverviewScrollHeader();
    if (overviewMenuOpen) positionOverviewMenu();
    if (!overviewScrollFrame) overviewScrollFrame = requestAnimationFrame(updateOverviewAlphabet);
  }, { passive: true });
  overview.addEventListener('click', (event) => event.stopPropagation());
  overview.addEventListener('focusout', (event) => {
    if (!isWithinOverviewSort(event.relatedTarget)) setOverviewMenu(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!isWithinOverviewSort(event.target)) setOverviewMenu(false);
  });

  addEventListener('resize', () => {
    if (innerWidth > 860) setOverviewHeaderHidden(false);
    if (overviewMenuOpen) positionOverviewMenu();
    if (activeView === 'cards' && !overviewScrollFrame) overviewScrollFrame = requestAnimationFrame(updateOverviewAlphabet);
  });

  window.visualViewport?.addEventListener('resize', () => {
    if (activeView === 'cards') positionOverviewAlphabet();
  });
  document.addEventListener('focusin', event => {
    if (event.target.closest?.('#globe-brand, #globe-view-switch, #globe-search, .gbv-toolbar')) setOverviewHeaderHidden(false);
  });
  overview.addEventListener('transitionend', event => {
    if (event.propertyName === 'top' && event.target.classList.contains('gbv-heading') && !overviewScrollFrame) {
      overviewScrollFrame = requestAnimationFrame(updateOverviewAlphabet);
    }
  });

  const searchRoot = document.createElement('section');
  searchRoot.id = 'globe-search';
  searchRoot.setAttribute('aria-label', 'Suche');
  searchRoot.innerHTML = `
    <button type="button" class="gs-launch" aria-label="Suche öffnen" aria-expanded="false" aria-controls="gs-surface"><span class="gs-icon" aria-hidden="true"></span></button>
    <div id="gs-surface" class="gs-surface">
      <div class="gs-header">
        <label class="gs-field"><span class="gs-icon" aria-hidden="true"></span><input id="gs-input" type="search" aria-label="Suche nach Art, Gattung oder Familie" placeholder="Suche nach Art, Gattung oder Familie" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-controls="gs-results" /></label>
        <button type="button" class="gs-close" aria-label="Suche schliessen und zum Globus zurückkehren"><span aria-hidden="true"></span></button>
      </div>
      <div id="gs-results" class="gs-results" aria-label="Suchergebnisse" hidden></div>
      <span class="gs-sr" role="status" aria-live="polite"></span>
    </div>`;
  document.body.appendChild(searchRoot);
  const searchInput = searchRoot.querySelector('input');
  const searchResults = searchRoot.querySelector('.gs-results');
  const searchStatus = searchRoot.querySelector('[role="status"]');
  const searchLaunch = searchRoot.querySelector('.gs-launch');
  const searchMedia = matchMedia('(max-width: 860px)');
  const searchNormalize = (value) => (value || '').toString().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ß/g, 'ss')
    .replace(/[ʻ’']/g, '').trim();

  function setSearchOpen(open, focus = false) {
    searchRoot.classList.toggle('is-open', open);
    document.body.classList.toggle('globe-search-open', open);
    searchLaunch.setAttribute('aria-expanded', String(open));
    if (open) {
      hideTooltip();
      renderSearchResults();
      if (focus) searchInput.focus();
    } else {
      searchResults.hidden = true;
      searchInput.blur();
    }
  }

  function buildSearchIndex() {
    const grouped = (key) => {
      const map = new Map();
      ALL.forEach((item) => {
        const id = item.taxonomy[key];
        if (!id) return;
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(item);
      });
      return map;
    };
    const genera = grouped('genus_key');
    const families = grouped('family_key');
    const entry = (type, item, species = []) => ({
      type, item, species,
      names: [item.name?.de, item.name?.lat, item.name?.en].filter(Boolean).map(searchNormalize)
    });
    searchEntries = [
      ...ALL.map((item) => entry('species', item)),
      ...Array.from(GENUS_BY_KEY.values(), (item) => entry('genus', item, genera.get(item.id) || [])),
      ...Array.from(FAMILY_BY_KEY.values(), (item) => entry('family', item, families.get(item.id) || []))
    ];
    searchReady = true;
    if (searchRoot.classList.contains('is-open')) renderSearchResults();
  }

  function snapshotSearchTooltipStyles(source = DOM.tip) {
    if (!source) return [];
    // Preserve the source's rendered Webflow styles before IDs are removed.
    // This also supports rules scoped to #species-tooltip / #tooltip-card.
    const properties = [
      'display', 'flex-direction', 'flex-wrap', 'align-items', 'align-content',
      'justify-content', 'gap', 'row-gap', 'column-gap', 'padding', 'margin',
      'background-color', 'background-image', 'background-size',
      'background-position', 'background-repeat', 'border', 'border-radius',
      'box-shadow', 'color', 'font-family', 'font-size', 'font-weight',
      'font-style', 'line-height', 'letter-spacing', 'text-align',
      'text-transform', 'text-decoration', 'object-fit', 'object-position'
    ];
    return [source, ...source.querySelectorAll('*')].map((element) => {
      const style = getComputedStyle(element);
      const values = properties.map((property) => [property, style.getPropertyValue(property)]);
      if (element.tagName === 'IMG') {
        ['width', 'height', 'border-radius'].forEach((property) => {
          const value = style.getPropertyValue(property);
          if (property === 'border-radius' || parseFloat(value) > 0) values.push([property, value]);
        });
      }
      return values;
    });
  }

  function makeSearchResult(entry, tooltipStyles) {
    const { item, type, species } = entry;
    // Keep the complete Webflow subtree: no new text wrappers or card layout.
    if (!DOM.tip) return null;
    const card = DOM.tip.cloneNode(true);
    [card, ...card.querySelectorAll('*')].forEach((element, index) => {
      (tooltipStyles[index] || []).forEach(([property, value]) => element.style.setProperty(property, value));
    });
    const avatar = card.querySelector('[id="tooltip-avatar"]');
    const title = card.querySelector('[id="tooltip-name-de"]');
    const latin = card.querySelector('[id="tooltip-name-lat"]');
    const date = card.querySelector('[id="tooltip-lastseen"]');

    // Allow text and its existing Webflow wrappers to grow. Preserve their
    // display, typography, spacing, background, image and border styling.
    [title, latin, date].filter(Boolean).forEach((field) => {
      field.classList.add('gs-text-flow');
      let parent = field.parentElement;
      while (parent && parent !== card) {
        parent.classList.add('gs-text-container');
        parent = parent.parentElement;
      }
    });
    [card, ...card.querySelectorAll('*')].forEach((el) => {
      el.removeAttribute('id');
      el.removeAttribute('data-w-id');
      // IDs of the live tooltip must not be referenced by a result clone.
      el.removeAttribute('aria-labelledby');
      el.removeAttribute('aria-describedby');
    });
    card.removeAttribute('aria-hidden');
    card.classList.add('gs-card');
    // Find the existing common container even if Webflow class names differ.
    let tooltipSurface = avatar?.parentElement || card;
    while (tooltipSurface !== card && title && !tooltipSurface.contains(title)) {
      tooltipSurface = tooltipSurface.parentElement;
    }
    tooltipSurface.classList.add('gs-tooltip-surface');
    // Webflow may attach width/max-content or inline-flex sizing to any
    // wrapper between the result root and the painted tooltip surface.
    // Stretch the whole chain, including the surface, in normal block flow.
    let widthNode = tooltipSurface;
    while (widthNode) {
      widthNode.classList.add('gs-full-width');
      widthNode.style.setProperty('width', '100%', 'important');
      widthNode.style.setProperty('min-width', '0', 'important');
      widthNode.style.setProperty('max-width', 'none', 'important');
      widthNode.style.setProperty('box-sizing', 'border-box', 'important');
      if (widthNode !== tooltipSurface) widthNode.style.setProperty('display', 'block', 'important');
      if (widthNode === card) break;
      widthNode = widthNode.parentElement;
    }
    tooltipSurface.style.setProperty('display', 'flex', 'important');
    tooltipSurface.style.setProperty('flex-direction', 'row', 'important');
    if (avatar) avatar.classList.add('gs-source-avatar');
    if (title) {
      title.classList.add('globe-search-title');
      title.setAttribute('lang', 'de');
      let textColumn = title.parentElement;
      while (textColumn && textColumn.parentElement !== tooltipSurface && textColumn !== tooltipSurface) textColumn = textColumn.parentElement;
      if (textColumn && textColumn !== tooltipSurface) textColumn.classList.add('gs-source-text');
    }
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', `${type === 'species' ? 'Art' : type === 'genus' ? 'Gattung' : 'Familie'}: ${item.name?.de || item.name?.lat || item.id}`);
    U.setText(title, germanDisplayName(item.name?.de || item.name?.lat || item.id));
    U.setText(latin, item.name?.lat || '');
    // The original Webflow date row already owns its extinction symbol.
    const dateValue = item.extinction_date || item.last_seen || '';
    U.setText(date, dateValue);
    normalizeExtinctionDate(date);
    if (date) {
      const dateRow = date.closest('.last-seen-content');
      (dateRow || date).hidden = !dateValue;
    }
    if (avatar && type === 'species') {
      U.setWFImage(avatar, item.images?.tooltip || CONFIG.DEFAULT_TOOLTIP_IMG);
      if (avatar.tagName === 'IMG') { avatar.alt = ''; avatar.loading = 'lazy'; }
      avatar.style.setProperty('flex-shrink', '0');
    } else if (avatar) {
      // Replace only the avatar; retain its Webflow classes and its parent.
      const count = document.createElement('div');
      count.className = avatar.className;
      count.classList.add('gs-count');
      ['margin', 'padding', 'border', 'border-radius', 'align-self'].forEach((property) => {
        const value = avatar.style.getPropertyValue(property);
        if (value) count.style.setProperty(property, value);
      });
      const avatarStyle = getComputedStyle(DOM.tipImg || avatar);
      if (parseFloat(avatarStyle.width) > 0 && avatarStyle.width.endsWith('px')) {
        count.style.width = avatarStyle.width;
      }
      if (parseFloat(avatarStyle.height) > 0 && avatarStyle.height.endsWith('px')) {
        count.style.height = avatarStyle.height;
      }
      const number = document.createElement('strong');
      number.textContent = species.length;
      const label = document.createElement('span');
      label.textContent = species.length === 1 ? 'Art' : 'Arten';
      count.append(number, label);
      avatar.replaceWith(count);
    }
    card.addEventListener('click', (event) => {
      event.preventDefault();
      openSearchResult(entry);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSearchResult(entry);
      }
    });
    return card;
  }

  function renderSearchResults() {
    const query = searchNormalize(searchInput.value);
    searchResults.replaceChildren();
    searchResults.scrollTop = 0;
    if (!query) { searchResults.hidden = true; searchStatus.textContent = ''; return; }
    searchResults.hidden = false;
    if (!searchReady) {
      searchResults.textContent = 'Suchdaten werden geladen …';
      return;
    }
    const words = query.split(/\s+/);
    const matches = searchEntries.filter((entry) => words.every((word) => entry.names.some((name) => name.includes(word))));
    const rank = (entry) => entry.names.includes(query) ? 0 : entry.names.some((name) => name.startsWith(query)) ? 1 : 2;
    matches.sort((a, b) => rank(a) - rank(b) || compareText(a.item.name?.de || a.item.name?.lat, b.item.name?.de || b.item.name?.lat));
    const fragment = document.createDocumentFragment();
    const tooltipStyles = snapshotSearchTooltipStyles();
    matches.forEach((entry) => {
      const card = makeSearchResult(entry, tooltipStyles);
      if (card) fragment.appendChild(card);
    });
    searchResults.appendChild(fragment);
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'gs-message';
      empty.textContent = 'Keine Treffer gefunden.';
      searchResults.appendChild(empty);
    }
    searchStatus.textContent = `${matches.length} Treffer`;
  }

  async function openSearchResult(entry) {
    if (searchOpeningResult) return;
    searchOpeningResult = true;
    setSearchOpen(false);
    try {
      if (entry.type === 'species') {
        await openSpeciesFromCard(entry.item);
      } else {
        await restoreDefaultState();
        closeSecondaryPanels();
        closeAIImageModal();
        activeSpeciesItem = null;
        updateAIImageInfoButton(null);
        resetAllPanelScrollPositions();
        if (entry.type === 'genus') {
          fillGenusPanel(entry.item, entry.species);
          renderGenusCards(entry.species);
          finalizeSecondaryPanel(DOM.genusPanel, DOM.genusCards, entry.species);
        } else {
          fillFamilyPanel(entry.item, entry.species);
          renderFamilyCards(entry.species);
          finalizeSecondaryPanel(DOM.familyPanel, DOM.familyCards);
        }
      }
    } catch (error) {
      console.warn('Suchtreffer konnte nicht vollständig geöffnet werden:', error);
    } finally { searchOpeningResult = false; }
  }

  searchLaunch.addEventListener('click', () => setSearchOpen(true, true));
  searchRoot.querySelector('.gs-close').addEventListener('click', () => {
    setSearchOpen(false);
    if (searchMedia.matches) searchLaunch.focus();
  });
  searchInput.addEventListener('focus', () => setSearchOpen(true));
  searchInput.addEventListener('input', () => { setSearchOpen(true); });
  searchRoot.addEventListener('keydown', (event) => {
    const cards = Array.from(searchResults.querySelectorAll('.gs-card'));
    const index = cards.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && cards.length) {
      event.preventDefault(); cards[Math.min(index + 1, cards.length - 1)].focus();
    } else if (event.key === 'ArrowUp' && cards.length) {
      event.preventDefault(); (index <= 0 ? searchInput : cards[index - 1]).focus();
    } else if (event.key === 'Tab' && searchMedia.matches && searchRoot.classList.contains('is-open')) {
      const controls = [searchInput, searchRoot.querySelector('.gs-close'), ...cards];
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchRoot.classList.contains('is-open')) {
      event.preventDefault(); event.stopImmediatePropagation(); setSearchOpen(false);
      if (searchMedia.matches) searchLaunch.focus();
    }
  }, true);
  document.addEventListener('pointerdown', (event) => {
    if (!searchMedia.matches && !searchRoot.contains(event.target)) setSearchOpen(false);
  });
  // Search events must not reach the globe / existing panel overlay.
  searchRoot.addEventListener('click', (event) => event.stopPropagation());
  searchMedia.addEventListener('change', () => setSearchOpen(false));

  // =========================================================
  // START
  // =========================================================
  loadSpecies()
    .then(async (data) => {
      ALL = data;

      GENUS_BY_KEY = new Map(
        (await loadJsonArray(CONFIG.GENUS_URL).catch((error) => { console.warn(error); return []; })).map((item) => [item.id, item])
      );
      FAMILY_BY_KEY = new Map(
        (await loadJsonArray(CONFIG.FAMILY_URL).catch((error) => { console.warn(error); return []; })).map((item) => [item.id, item])
      );

      addAllPoints();
      buildSearchIndex();
      overviewDataReady = true;
      if (activeView === 'cards') renderOverview(false);
      beginIntro();
    })
    .catch((error) => {
      console.warn(error);
      // The independent intro timeline stays usable even if species data fails.
      overviewStatus.textContent = 'Die Arten konnten nicht geladen werden. Bitte die Seite neu laden.';
    });
})();
