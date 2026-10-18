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
        fill: Cesium.Color.fromCssColorString("#4C61D7"),
        alpha: 0.25,
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
      updateCardRailTitleLayout(DOM.genusCards);
      updateCardRailTitleLayout(DOM.familyCards);
      updateFamilyGenusStickyTracks(DOM.familyCards);
      updateStickyFamilyGenusLink();
      if (document.body.classList.contains("panel-open")) {
        requestPanelShiftUpdate();
      }
    },
    { passive: true }
  );

  // =========================================================
  // PANEL SHIFT
  // =========================================================
  function getCameraHeightM() {
    try {
      return viewer.camera.positionCartographic?.height ?? Infinity;
    } catch {
      return Infinity;
    }
  }

  function shouldApplyPanelShift() {
    return activeView === "globe" && getCameraHeightM() <= CONFIG.PANEL_SHIFT_MAX_HEIGHT_M;
  }

  let lastShiftFactor = 1;
  let shiftRAF = 0;

  function setShiftFactorFromClick(clickX) {
    const canvasW = viewer.scene.canvas?.clientWidth || innerWidth || 1;
    lastShiftFactor = U.clamp(clickX / canvasW, 0, 1);
  }

  function updatePanelShiftVar() {
    const wantShift = shouldApplyPanelShift();
    const panelW = DOM.panelEl ? DOM.panelEl.offsetWidth : 0;
    const effectiveW = wantShift ? panelW * lastShiftFactor : 0;
    document.body.style.setProperty(
      "--panel-shift",
      `${Math.round(effectiveW)}px`
    );
  }

  function requestPanelShiftUpdate() {
    if (!document.body.classList.contains("panel-open")) return;
    if (shiftRAF) return;

    shiftRAF = requestAnimationFrame(() => {
      shiftRAF = 0;
      updatePanelShiftVar();
      requestViewerResize();
    });
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

  try {
    viewer.camera.changed.addEventListener(() => requestPanelShiftUpdate());
  } catch {}

  // =========================================================
  // RANGES
  // =========================================================
  let activeRangeDS = [];
  let currentPrimaryPolygonDS = null;
  const rangeCache = new Map();

  const rangePoints = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection()
  );

  function clearRangePoints() {
    try {
      rangePoints.removeAll();
    } catch {}
  }

  function stylePolygonDataSource(ds, key) {
    const st = CONFIG.RANGES_STYLE[key];
    if (!st) return;

    const fade = { alpha: 0 };
    const mat = new Cesium.ColorMaterialProperty(
      new Cesium.CallbackProperty(() => st.fill.withAlpha(fade.alpha), false)
    );

    for (const e of ds.entities.values) {
      if (!e.polygon) continue;
      e.polygon.material = mat;
      e.polygon.outline = !!st.outline;
      if (st.outline) {
        e.polygon.outlineColor = st.outline.withAlpha(st.outlineAlpha ?? 1);
      }
      e.polygon.height = 0;
      e.polygon.extrudedHeight = 0;
    }

    const tStart = performance.now();
    const tick = () => {
      const p = Math.min((performance.now() - tStart) / (st.fadeMs || 220), 1);
      fade.alpha = p * (st.alpha ?? 0.45);
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  async function hideRanges() {
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

    await hideRanges();

    const primaryKey = ranges.range_native
      ? "range_native"
      : ranges.breeding_native
      ? "breeding_native"
      : ranges.range_hypothetical
      ? "range_hypothetical"
      : ranges.passage
      ? "passage"
      : null;

    for (const key of [
      "range_native",
      "breeding_native",
      "range_hypothetical",
      "passage"
    ]) {
      const url = ranges[key];
      if (!url) continue;

      let ds = rangeCache.get(url);
      if (!ds) {
        ds = await Cesium.GeoJsonDataSource.load(url, { clampToGround: true });
        rangeCache.set(url, ds);
      }

      if (!viewer.dataSources.contains(ds)) viewer.dataSources.add(ds);
      stylePolygonDataSource(ds, key);
      activeRangeDS.push(ds);

      if (primaryKey && key === primaryKey) currentPrimaryPolygonDS = ds;
    }

    for (const pointKey of ["breeding_spots", "find_spots", "last_observation"]) {
      const pointUrl = ranges[pointKey];
      if (!pointUrl) continue;

      const dsPts = await Cesium.GeoJsonDataSource.load(pointUrl, {
        clampToGround: true
      });

      const t = Cesium.JulianDate.now();
      const st = CONFIG.RANGE_POINTS[pointKey];
      if (!st) continue;

      for (const e of dsPts.entities.values) {
        const pos = e.position?.getValue(t);
        if (!pos) continue;

        rangePoints.add({
          position: pos,
          pixelSize: st.size ?? 8,
          color: Cesium.Color.fromCssColorString(st.color),
          show: true
        });
      }
    }
  }

  // =========================================================
  // SMART VIEW
  // =========================================================
  function getPanelRect() {
    if (!DOM.panelEl) return null;
    const r = DOM.panelEl.getBoundingClientRect();
    return !r || r.width <= 0 || r.height <= 0 ? null : r;
  }

  function getSafeViewportRect() {
    const canvas = viewer.scene.canvas;
    const W = canvas?.clientWidth || innerWidth;
    const H = canvas?.clientHeight || innerHeight;
    const m = CONFIG.VIEW_MARGIN_PX;

    let left = m;
    let top = m;
    let right = W - m;
    let bottom = H - m;

    if (document.body.classList.contains("panel-open")) {
      const pr = getPanelRect();
      if (pr) right = Math.min(right, pr.left - m);
    }

    left = Math.max(0, left);
    top = Math.max(0, top);
    right = Math.max(left + 10, right);
    bottom = Math.max(top + 10, bottom);

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  function computeRangeScreenRect(ds) {
    if (!ds) return null;

    const time = Cesium.JulianDate.now();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;

    for (const e of ds.entities.values) {
      if (!e.polygon || !e.polygon.hierarchy) continue;

      let hier;
      try {
        hier = e.polygon.hierarchy.getValue(time);
      } catch {
        hier = null;
      }

      if (!hier?.positions?.length) continue;

      const step = Math.max(1, CONFIG.RANGE_SAMPLE_STEP);
      for (let i = 0; i < hier.positions.length; i += step) {
        const w = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          viewer.scene,
          hier.positions[i]
        );
        if (!w) continue;

        any = true;
        minX = Math.min(minX, w.x);
        minY = Math.min(minY, w.y);
        maxX = Math.max(maxX, w.x);
        maxY = Math.max(maxY, w.y);
      }
    }

    if (!any || !isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return null;
    }

    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function isFullyInside(inner, outer) {
    return (
      inner.left >= outer.left &&
      inner.right <= outer.right &&
      inner.top >= outer.top &&
      inner.bottom <= outer.bottom
    );
  }

  function coverage(rangeRect, safeRect) {
    const a = Math.max(0, rangeRect.width) * Math.max(0, rangeRect.height);
    const b = Math.max(1, safeRect.width) * Math.max(1, safeRect.height);
    return a / b;
  }

  function angleFromPixels(dxPx, axis = "x") {
    const size =
      axis === "x"
        ? viewer.scene.canvas?.clientWidth || innerWidth || 1
        : viewer.scene.canvas?.clientHeight || innerHeight || 1;
    const fov = viewer.camera.frustum?.fov || Math.PI / 3;
    const ang = (dxPx / Math.max(1, size)) * fov;
    return U.clamp(ang, CONFIG.VIEW_PAN_MIN_ANGLE, CONFIG.VIEW_PAN_MAX_ANGLE);
  }

  function panToReduceOverflow(rangeRect, safeRect) {
    let did = false;

    if (rangeRect.right > safeRect.right) {
      try {
        viewer.camera.rotateRight(
          angleFromPixels(rangeRect.right - safeRect.right, "x")
        );
        did = true;
      } catch {}
    } else if (rangeRect.left < safeRect.left) {
      try {
        viewer.camera.rotateLeft(
          angleFromPixels(safeRect.left - rangeRect.left, "x")
        );
        did = true;
      } catch {}
    }

    if (rangeRect.bottom > safeRect.bottom) {
      try {
        viewer.camera.rotateDown(
          angleFromPixels(rangeRect.bottom - safeRect.bottom, "y")
        );
        did = true;
      } catch {}
    } else if (rangeRect.top < safeRect.top) {
      try {
        viewer.camera.rotateUp(
          angleFromPixels(safeRect.top - rangeRect.top, "y")
        );
        did = true;
      } catch {}
    }

    if (did) viewer.scene.requestRender?.();
    return did;
  }

  function zoomByStep(direction) {
    const h = getCameraHeightM();
    const step = Math.max(50, h * CONFIG.VIEW_ZOOM_STEP_FRAC);

    try {
      direction === "out" ? viewer.camera.zoomOut(step) : viewer.camera.zoomIn(step);
      viewer.scene.requestRender?.();
      return true;
    } catch {
      return false;
    }
  }

  async function smartAdjustViewToRange(ds) {
    if (!ds) return;

    await new Promise((r) => doubleRAF(r));
    const safe = getSafeViewportRect();

    for (let iter = 0; iter < CONFIG.VIEW_MAX_ITERS; iter++) {
      const rr = computeRangeScreenRect(ds);
      if (!rr) return;

      const inside = isFullyInside(rr, safe);
      const cov = coverage(rr, safe);

      if (!inside) {
        const didPan = panToReduceOverflow(rr, safe);
        await new Promise((r) => requestAnimationFrame(r));

        if (!didPan || iter >= CONFIG.VIEW_PAN_ITERS_BEFORE_ZOOM) {
          zoomByStep("out");
          await new Promise((r) => doubleRAF(r));
        }
        continue;
      }

      if (cov < CONFIG.VIEW_MIN_COVERAGE) {
        zoomByStep("in");
        await new Promise((r) => doubleRAF(r));
        continue;
      }

      if (cov > CONFIG.VIEW_MAX_COVERAGE) {
        zoomByStep("out");
        await new Promise((r) => doubleRAF(r));
        continue;
      }

      return;
    }
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

  function hideTooltip() {
    if (!DOM.tip) return;
    DOM.tip.style.opacity = "0";
    DOM.tip.style.transform = "translateY(6px)";
  }

  function showTooltip(item) {
    if (!DOM.tip || !item) return;

   preloadPanelImageForItem(item);

    U.setWFImage(DOM.tipImg, item.images.tooltip);
    U.setText(DOM.tipNameDe, item.name.de);
    U.setText(DOM.tipNameLat, item.name.lat);
    U.setText(DOM.tipLast, item.last_seen);

    const w = DOM.tip.offsetWidth || 320;
    const h = DOM.tip.offsetHeight || 180;

    DOM.tip.style.left =
      U.clamp(pointer.x + 14, 12, innerWidth - w - 12) + "px";
    DOM.tip.style.top =
      U.clamp(pointer.y + 14, 12, innerHeight - h - 12) + "px";
    DOM.tip.style.opacity = "1";
    DOM.tip.style.transform = "translateY(0)";
  }

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
    U.setText(DOM.panelNameDe, item.name.de);
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

    if (!options.deferImage) U.setWFImage(imgEl, item?.images?.panel || CONFIG.DEFAULT_PANEL_IMG);
    U.setText(nameDeEl, item?.name?.de || "");
    U.setText(nameLatEl, item?.name?.lat || "");

    const date = item?.extinction_date || item?.last_seen || "";
    U.setText(extDateEl, date);
    if (extDateEl) extDateEl.style.display = date ? "" : "none";

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
      if (card) container.appendChild(card);
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

  function finalizeSecondaryPanel(panelEl, cardsEl) {
    closeSecondaryPanels();
    resetPanelScroll(panelEl);
    if (cardsEl) cardsEl.scrollLeft = 0;
    panelEl?.classList.add("is-open");
    setPanelOpen(true);
    updateCardRailTitleLayout(cardsEl);
  }

  async function openSpeciesFromCard(item) {
    if (!item) return;

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
    setPanelOpen(true);

    await showRangesForItem(item);
    await smartAdjustViewToRange(currentPrimaryPolygonDS);
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
    finalizeSecondaryPanel(DOM.genusPanel, DOM.genusCards);
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

  async function closeAllPanels() {
    closeSecondaryPanels();
    closeAIImageModal();
    updateAIImageInfoButton(null);
    closeAllReferencesAccordions();
    resetAllPanelScrollPositions();
    await restoreDefaultState();
    setPanelOpen(false);
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

  function setAllPointsVisible(visible) {
    for (let i = 0; i < points.length; i++) {
      const pt = points.get(i);
      if (pt) pt.show = !!visible;
    }
  }

  function addAllPoints() {
    for (const d of ALL) {
      if (d.location.lat == null || d.location.lng == null) continue;
      const p = points.add({
        position: Cesium.Cartesian3.fromDegrees(d.location.lng, d.location.lat),
        pixelSize: CONFIG.POINT_SIZE,
        color: Cesium.Color.fromCssColorString(CONFIG.POINT_COLOR),
        show: !introActive
      });
      p.id = d;
    }
  }

  async function restoreDefaultState() {
    await hideRanges();
    inDetailMode = false;
    setAllPointsVisible(true);
    hideTooltip();
  }

  handler.setInputAction(
    (m) => {
      if (activeView !== 'globe' || introActive || hawaiiFlightActive || hawaiiFlightPending || document.body.classList.contains("panel-open")) return;
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
      if (activeView !== 'globe' || introActive || hawaiiFlightActive || hawaiiFlightPending) return;
      const picked = viewer.scene.pick(c.position);
      const item = picked?.primitive?.id;

      if (item) {
        await restoreDefaultState();
        closeSecondaryPanels();

        setShiftFactorFromClick(c.position.x);
        inDetailMode = true;
        setAllPointsVisible(false);

        fillPanel(item);
        resetPanelScroll(DOM.panelEl);
        resetPanelScroll(DOM.genusPanel);
        resetPanelScroll(DOM.familyPanel);
        resetCardRailScroll();
        setPanelOpen(true);

        await showRangesForItem(item);
        await smartAdjustViewToRange(currentPrimaryPolygonDS);
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

  function setOverviewMenu(open, focusOption = false) {
    overviewMenuOpen = open;
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
      const title = document.createElement('span'); title.textContent = overviewSort === 'region'
        ? (group.label === 'Hawaii (Big Island)' ? 'Hawaii' : group.label).toLocaleUpperCase('de')
        : group.label;
      const count = document.createElement('span'); count.className = 'gbv-count';
      count.textContent = `${group.items.length} ${group.items.length === 1 ? 'Art/Form' : 'Arten/Formen'}`;
      heading.append(title, count);
      const grid = document.createElement('div'); grid.className = 'gbv-grid';
      for (const item of group.items) {
        const card = makeOverviewCard(item, styles);
        if (card) grid.appendChild(card);
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
    if (resetScroll) overview.scrollTop = 0;
    const count = ALL.filter((item) => overviewRegions(item).length).length;
    overviewStatus.textContent = `${count} Arten/Formen aus Hawaii, sortiert nach ${overviewSorts.find(([value]) => value === overviewSort)[1]}.`;
    overviewStatus.classList.add('is-sr-only');
    overviewContent.setAttribute('aria-busy', 'false');
    requestAnimationFrame(() => {
      if (token === overviewRenderToken) { overviewContent.classList.remove('is-changing'); updateOverviewAlphabet(); }
    });
  }

  function updateOverviewAlphabet() {
    overviewScrollFrame = 0;
    if (overviewAlphabet.hidden) return;
    let active = overviewGroupsOnScreen[0]?.key;
    for (const group of overviewGroupsOnScreen) {
      if (group.section.getBoundingClientRect().top <= overview.querySelector('.gbv-toolbar').getBoundingClientRect().bottom + 16) active = group.key;
      else break;
    }
    if (overview.scrollTop > 0 && overview.scrollTop + overview.clientHeight >= overview.scrollHeight - 2) active = overviewGroupsOnScreen.at(-1)?.key;
    overviewAlphabet.querySelectorAll('button').forEach((button) => {
      if (button.dataset.letter === active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
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
    setSearchOpen(false);
    await closeAllPanels();
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
      overviewContent.querySelectorAll('.card-image').forEach((image) => {
        if (overviewImageSources.has(image)) overviewImageObserver?.observe(image);
      });
    } else {
      activeView = 'globe';
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
    if (group) overview.scrollTo({ top: Math.max(0, overview.scrollTop + group.section.getBoundingClientRect().top - Math.max(78, parseFloat(getComputedStyle(overview.querySelector('.gbv-toolbar')).top) + overview.querySelector('.gbv-toolbar').offsetHeight + 14)), behavior: overviewReducedMotion() ? 'instant' : 'smooth' });
  });
  overview.addEventListener('scroll', () => {
    if (!overviewScrollFrame) overviewScrollFrame = requestAnimationFrame(updateOverviewAlphabet);
  }, { passive: true });
  overview.addEventListener('click', (event) => event.stopPropagation());
  overview.addEventListener('focusout', (event) => {
    if (!overview.querySelector('.gbv-select').contains(event.relatedTarget)) setOverviewMenu(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!overview.querySelector('.gbv-select').contains(event.target)) setOverviewMenu(false);
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
      let textColumn = title.parentElement;
      while (textColumn && textColumn.parentElement !== tooltipSurface && textColumn !== tooltipSurface) textColumn = textColumn.parentElement;
      if (textColumn && textColumn !== tooltipSurface) textColumn.classList.add('gs-source-text');
    }
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', `${type === 'species' ? 'Art' : type === 'genus' ? 'Gattung' : 'Familie'}: ${item.name?.de || item.name?.lat || item.id}`);
    U.setText(title, item.name?.de || item.name?.lat || item.id);
    U.setText(latin, item.name?.lat || '');
    // The original Webflow date row already owns its extinction symbol.
    const dateValue = item.extinction_date || item.last_seen || '';
    U.setText(date, dateValue);
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
        setShiftFactorFromClick((viewer.scene.canvas?.clientWidth || innerWidth) / 2);
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
          finalizeSecondaryPanel(DOM.genusPanel, DOM.genusCards);
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
