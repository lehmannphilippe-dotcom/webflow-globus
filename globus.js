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
      "https://cdn.prod.website-files.com/6950eb029163bef776e18cfd/6973b1021ea865f12ac7c9bf_world.watermask.21600x10800.png",

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
  const el = document.createElement("a");
  el.className = "family-genus-label";
  el.href = "#";
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

  function createFamilyGenusSpacer(text) {
    const el = createFamilyGenusLabel(text);
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    return el;
  }

  function getFamilyGenusGroups() {
    const container = DOM.familyCards;
    if (!container) return [];

    const columns = Array.from(
      container.querySelectorAll(".family-card-column")
    ).filter((el) => el.offsetParent !== null);

    if (!columns.length) return [];

    const groups = [];
    let current = null;

    for (const col of columns) {
      const label = col.dataset.genusLabel || "";
      const key = col.dataset.genusKey || "";
      const cardEl = col.querySelector(".species-card") || col;

      if (!current || current.key !== key) {
        current = {
          key,
          label,
          firstCol: col,
          lastCol: col,
          lastCard: cardEl
        };
        groups.push(current);
      } else {
        current.lastCol = col;
        current.lastCard = cardEl;
      }
    }

    return groups;
  }

  function updateStickyFamilyGenusLink() {
    const container = DOM.familyCards;
    const stickyLink = DOM.familyStickyGenusLink;
    const stickyText = DOM.familyStickyGenusText;

    if (!container || !stickyLink) return;

    const groups = getFamilyGenusGroups();

    if (!groups.length) {
      if (stickyText) stickyText.textContent = "";
      stickyLink.dataset.genusKey = "";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const stickyThreshold = containerRect.left + 24;

    let activeGroup = groups[groups.length - 1];

    for (const group of groups) {
      const lastRect = group.lastCard.getBoundingClientRect();

      if (lastRect.right > stickyThreshold) {
        activeGroup = group;
        break;
      }
    }

    if (stickyText) {
      stickyText.textContent = activeGroup.label || "";
    } else {
      stickyLink.textContent = activeGroup.label || "";
    }

    stickyLink.dataset.genusKey = activeGroup.key || "";
  }

  function bindStickyFamilyGenusScroll() {
    const container = DOM.familyCards;
    if (!container) return;
    if (container.dataset.stickyGenusBound === "true") return;

    container.dataset.stickyGenusBound = "true";

    container.addEventListener(
      "scroll",
      () => {
        updateStickyFamilyGenusLink();
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
  scc.minimumZoomDistance = Math.max(5, CONFIG.ZOOM_IN_STOP_HEIGHT_M);
  scc.maximumZoomDistance = CONFIG.ZOOM_OUT_STOP_HEIGHT_M;
  scc.enableTilt = false;
  scc.enableLook = false;

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(20, 15, 12_000_000)
  });

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
      updateCardRailTitleLayout(DOM.genusCards);
      updateCardRailTitleLayout(DOM.familyCards);
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
    return getCameraHeightM() <= CONFIG.PANEL_SHIFT_MAX_HEIGHT_M;
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
        viewer.scene.screenSpaceCameraController.enableInputs = true;
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
  } catch (e) {
    console.warn("Land-grade stage failed, continuing without it:", e);
  }

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

    U.setWFImage(DOM.panelImg, item.images.panel);
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

  function buildSpeciesCard(item) {
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

    U.setWFImage(imgEl, item?.images?.panel || CONFIG.DEFAULT_PANEL_IMG);
    U.setText(nameDeEl, item?.name?.de || "");
    U.setText(nameLatEl, item?.name?.lat || "");

    const date = item?.extinction_date || item?.last_seen || "";
    U.setText(extDateEl, date);
    if (extDateEl) extDateEl.style.display = date ? "" : "none";

    U.setText(habitatEl, item?.habitat || "");
    if (habitatEl) habitatEl.style.display = item?.habitat ? "" : "none";

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

    let lastGenus = "";

    for (const item of sorted) {
      const col = document.createElement("div");
      col.className = "family-card-column";

      Object.assign(col.style, {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: "0 0 auto"
      });

      const genusLabel = getGenusHeadingLabel(item);
      const genusKey = item?.taxonomy?.genus_key || "";
      col.dataset.genusLabel = genusLabel;
      col.dataset.genusKey = genusKey;

      col.appendChild(
     genusLabel !== lastGenus
    ? createFamilyGenusLabel(genusLabel, genusKey)
    : createFamilyGenusSpacer(genusLabel)
);
lastGenus = genusLabel;

      const card = buildSpeciesCard(item);
      if (card) col.appendChild(card);

      container.appendChild(col);
    }

    doubleRAF(() => {
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
    const familyKey = speciesItem?.taxonomy?.family_key || "";
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
    closeAllReferencesAccordions();
    resetAllPanelScrollPositions();
    await restoreDefaultState();
    setPanelOpen(false);
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
    if (activeSpeciesItem) openFamilyPanelFromSpecies(activeSpeciesItem);
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
    if (e.key === "Escape") await closeAllPanels();
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
        show: true
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
      if (document.body.classList.contains("panel-open")) return;
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
  // START
  // =========================================================
  loadSpecies()
    .then(async (data) => {
      ALL = data;

      GENUS_BY_KEY = new Map(
        (await loadJsonArray(CONFIG.GENUS_URL)).map((item) => [item.id, item])
      );
      FAMILY_BY_KEY = new Map(
        (await loadJsonArray(CONFIG.FAMILY_URL)).map((item) => [item.id, item])
      );

      addAllPoints();
    })
    .catch(console.warn);
})();
