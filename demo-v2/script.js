/**
 * =========================================================================
 * CORE CLIENT JAVASCRIPT — UGR FILIALA SECTOR 1 BUCUREȘTI (REFINED MASTER)
 * =========================================================================
 * 1. SPA Routing & Navigare Hash (Acasă, Despre, Evenimente, Membri, Contact/FAQ)
 * 2. Meniu Mobil Drawer cu Închidere Automată & Stare Focus
 * 3. Calculator Geodezic Transversal Stereo 70 (EPSG:3844) ⇄ WGS84 Integrat (ANCPI)
 * 4. Harta Vectorială 2D & Filtru Competențe Tehnice
 * 5. Glob 3D WebGL (Globe.gl + Three.js) cu Sateliți și Rază Laser Dinamică
 * 6. Rendare Dinamică: Membri, Conducere BEX, Știri SGR Chișinău, Acordeon FAQ
 * 7. Modal Înscriere Multi-Step conform WCAG 2.2 AA (Capcană Focus & Taste)
 * =========================================================================
 */

// Stare globală a aplicației
const appState = {
    currentView: 'acasa',
    selectedNode: 'bucuresti',
    selectedSkill: 'toate',
    modalStep: 1,
    selectedTier: 'fizica',
    globeInitialized: false,
    lastFocusedElement: null
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. SPA ROUTING & MENIU DE NAVIGARE
// ═══════════════════════════════════════════════════════════════════════════

function navigateTo(viewId) {
    const validViews = ['acasa', 'despre', 'evenimente', 'membri', 'contact'];
    if (!validViews.includes(viewId)) {
        viewId = 'acasa';
    }

    const isPageChange = (appState.currentView !== viewId);

    // Ascunde toate secțiunile
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Afișează secțiunea țintă
    const targetSection = document.getElementById('view-' + viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');

        // Declanșează animația fluidă în cascadă pentru Hero la intrarea pe pagină (identic cu Home, Despre Noi & Evenimente)
        if (isPageChange) {
            const heroReveals = targetSection.querySelectorAll(
                '.events-hero-v2 .scroll-reveal, .despre-hero-v2 .scroll-reveal, .membri-hero-v2 .scroll-reveal'
            );
            if (heroReveals.length) {
                heroReveals.forEach(el => el.classList.remove('is-visible'));
                setTimeout(() => {
                    heroReveals.forEach((el, idx) => {
                        setTimeout(() => el.classList.add('is-visible'), idx * 80);
                    });
                }, 40);
            }
        }

        if (typeof initScrollReveal === 'function') {
            setTimeout(() => initScrollReveal(), 60);
        }
    }

    // Actualizează clasa activă în meniul desktop
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Actualizează clasa activă în meniul mobil
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        if (link.getAttribute('data-mview') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    appState.currentView = viewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Declanșează animația de tipărire la prima vizită
    if (isPageChange) {
        playBrandTypewriter(false);
        // Oprește loop-ul 3D WebGL dacă utilizatorul nu este pe pagina Acasă
        if (viewId !== 'acasa') {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        } else {
            const btn3d = document.getElementById('btn-mode-3d');
            if (btn3d && btn3d.classList.contains('active') && typeof window.startSatelliteAnimation === 'function') {
                window.startSatelliteAnimation();
            }
        }
    }
}

function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'acasa';
    navigateTo(hash);
}

function toggleMobileNav() {
    const mobileMenu = document.getElementById('mobile-menu');
    const burgerBtn = document.querySelector('.burger-btn');
    if (!mobileMenu || !burgerBtn) return;

    const isOpen = mobileMenu.style.display === 'flex';

    if (!isOpen) {
        mobileMenu.style.display = 'flex';
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.getElementById('b-bar-1').style.transform = 'rotate(45deg) translate(5px, 5px)';
        document.getElementById('b-bar-2').style.opacity = '0';
        document.getElementById('b-bar-3').style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
        closeMobileNav();
    }
}

function closeMobileNav() {
    const mobileMenu = document.getElementById('mobile-menu');
    const burgerBtn = document.querySelector('.burger-btn');
    if (!mobileMenu || !burgerBtn) return;

    mobileMenu.style.display = 'none';
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.getElementById('b-bar-1').style.transform = 'none';
    document.getElementById('b-bar-2').style.opacity = '1';
    document.getElementById('b-bar-3').style.transform = 'none';
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMUTATOR ANIMAȚIE BUTOANE HERO & VITEZĂ PHOTO TICKER
// ═══════════════════════════════════════════════════════════════════════════

function setBtnAnimationVariant(variant) {
    const btnMembership = document.getElementById('hero-btn-membership');
    const btnSecondary = document.getElementById('hero-btn-secondary');
    if (btnMembership) {
        btnMembership.classList.add('btn-shimmer-beam');
    }
    if (btnSecondary) {
        btnSecondary.classList.add('btn-shimmer-beam');
    }
}
window.setBtnAnimationVariant = setBtnAnimationVariant;

function setTickerSpeed(speed) {
    const ticker = document.getElementById('hero-photo-ticker');
    if (!ticker) return;

    if (speed === 'dynamic') {
        ticker.classList.add('dynamic');
    } else {
        ticker.classList.remove('dynamic');
    }
}
window.setTickerSpeed = setTickerSpeed;

// ═══════════════════════════════════════════════════════════════════════════
// 3. INTERACȚIUNE HARTĂ 2D & FILTRU COMPETENȚE
// ═══════════════════════════════════════════════════════════════════════════

function selectNode(nodeKey) {
    const node = ugrData.mapNodes[nodeKey];
    if (!node) return;

    appState.selectedNode = nodeKey;

    const titleEl = document.getElementById('node-info-title');
    const coordsEl = document.getElementById('node-info-coords');
    const textEl = document.getElementById('node-info-text');

    if (titleEl) titleEl.innerText = node.name;
    if (coordsEl) {
        coordsEl.innerText = `${node.latStr} / ${node.lonStr}${node.stereo70Str ? ' • ' + node.stereo70Str : ''}`;
    }
    if (textEl) textEl.innerText = node.desc;

    // Actualizare elemente VisionOS Spatial Glass HUD
    const spatialBadge = document.getElementById('spatial-node-badge');
    const spatialCoords = document.getElementById('spatial-node-coords-short');
    const spatialDesc = document.getElementById('spatial-node-desc');
    if (spatialBadge) {
        spatialBadge.innerText = (nodeKey === 'bucuresti' ? '★ ' : '') + node.name;
    }
    if (spatialCoords) {
        spatialCoords.innerText = node.stereo70Str || (node.latStr + ' / ' + node.lonStr);
    }
    if (spatialDesc) {
        spatialDesc.style.opacity = '0';
        setTimeout(() => {
            spatialDesc.innerText = node.desc;
            spatialDesc.style.opacity = '1';
        }, 120);
    }

    // Panou dinamic de telemetrie geodezică pentru nodul selectat
    let telemContainer = document.getElementById('node-telemetry-container');
    if (!telemContainer && textEl && textEl.parentNode) {
        telemContainer = document.createElement('div');
        telemContainer.id = 'node-telemetry-container';
        telemContainer.className = 'node-telemetry-grid';
        telemContainer.style.marginTop = '10px';
        telemContainer.style.display = 'grid';
        telemContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
        telemContainer.style.gap = '8px';
        textEl.parentNode.appendChild(telemContainer);
    }

    if (telemContainer) {
        if (nodeKey === 'bucuresti') {
            telemContainer.innerHTML = `
                <div class="telemetry-card" style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-cyan); font-weight: 700; font-size: 9px; text-transform: uppercase;">STAȚII ROMPOS REF</div>
                    <div style="color: #fff; font-size: 10.5px;">BUCU (Tei) & BUC1 (Vest)</div>
                </div>
                <div class="telemetry-card" style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-cyan); font-weight: 700; font-size: 9px; text-transform: uppercase;">REȚEA RGLMB S1</div>
                    <div style="color: #fff; font-size: 10.5px;">P. Victoriei / Arcul de Triumf</div>
                </div>
                <div class="telemetry-card" style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-cyan); font-weight: 700; font-size: 9px; text-transform: uppercase;">DATUM / CRS</div>
                    <div style="color: #fff; font-size: 10.5px;">Stereo 70 / EPSG:3844</div>
                </div>
                <div class="telemetry-card" style="background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-cyan); font-weight: 700; font-size: 9px; text-transform: uppercase;">PRECIZIE GEODEZICĂ</div>
                    <div style="color: #fff; font-size: 10.5px;">GNSS RTK 1-2cm / Niv. Clasa I</div>
                </div>
            `;
        } else if (nodeKey === 'chisinau') {
            telemContainer.innerHTML = `
                <div class="telemetry-card" style="background: rgba(255,159,28,0.1); border: 1px solid rgba(255,159,28,0.4); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: #FF9F1C; font-weight: 700; font-size: 9px; text-transform: uppercase;">CONGRES SGR 2026</div>
                    <div style="color: #fff; font-size: 10.5px;">11–14 Noiembrie Chișinău</div>
                </div>
                <div class="telemetry-card" style="background: rgba(255,159,28,0.1); border: 1px solid rgba(255,159,28,0.4); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: #FF9F1C; font-weight: 700; font-size: 9px; text-transform: uppercase;">GAZDĂ ACADEMICĂ</div>
                    <div style="color: #fff; font-size: 10.5px;">UTM — Fac. Geodezie & Cadastru</div>
                </div>
                <div class="telemetry-card" style="background: rgba(255,159,28,0.1); border: 1px solid rgba(255,159,28,0.4); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: #FF9F1C; font-weight: 700; font-size: 9px; text-transform: uppercase;">SISTEM PROIECȚIE</div>
                    <div style="color: #fff; font-size: 10.5px;">MOLDREF 99 / EPSG:4026</div>
                </div>
            `;
        } else {
            const telem = node.telemetrySummary || {};
            telemContainer.innerHTML = `
                <div class="telemetry-card" style="background: rgba(64,176,240,0.06); border: 1px solid rgba(64,176,240,0.25); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-accent); font-weight: 700; font-size: 9px; text-transform: uppercase;">SISTEM / DATUM</div>
                    <div style="color: #fff; font-size: 10.5px;">${telem.crs || 'Stereo 70'}</div>
                </div>
                <div class="telemetry-card" style="background: rgba(64,176,240,0.06); border: 1px solid rgba(64,176,240,0.25); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-accent); font-weight: 700; font-size: 9px; text-transform: uppercase;">STAȚIE REF GNSS</div>
                    <div style="color: #fff; font-size: 10.5px;">${telem.romposRef || 'ROMPOS Regional'}</div>
                </div>
                <div class="telemetry-card" style="background: rgba(64,176,240,0.06); border: 1px solid rgba(64,176,240,0.25); padding: 6px 8px; border-radius: 4px; font-family: var(--font-mono); font-size: 10px;">
                    <div style="color: var(--ugr-accent); font-weight: 700; font-size: 9px; text-transform: uppercase;">SPECIALIZARE</div>
                    <div style="color: #fff; font-size: 10.5px;">${telem.specializare || 'Geodezie & Cadastru'}</div>
                </div>
            `;
        }
    }

    // Evidențiază vectorii din SVG
    document.querySelectorAll('.edge-vector').forEach(line => {
        line.style.stroke = 'rgba(64,176,240,0.25)';
        line.style.strokeWidth = '1';
    });

    if (nodeKey === 'bucuresti') {
        // Când este selectat București (Pol Regional), luminează toți vectorii de legătură naționali
        document.querySelectorAll('.edge-vector').forEach(line => {
            line.style.stroke = '#00E5FF';
            line.style.strokeWidth = '1.6';
        });
    } else {
        const activeLine = document.getElementById(`vec-${nodeKey}`);
        if (activeLine) {
            activeLine.style.stroke = nodeKey === 'chisinau' ? '#FF9F1C' : '#00E5FF';
            activeLine.style.strokeWidth = '2.2';
        }
    }

    if (myGlobe) {
        if (typeof myGlobe.pointOfView === 'function') {
            myGlobe.pointOfView({ lat: node.lat, lng: node.lon, altitude: nodeKey === 'bucuresti' ? 0.32 : 0.36 }, 1400);
        }
        updateGlobeRings(nodeKey);
        updateGlobePoints(nodeKey);
        if (typeof updateLaserTracking === 'function') {
            updateLaserTracking();
        }
        if (typeof window.setArcStyle === 'function' && window.currentArcStyle === 'orbital') {
            window.setArcStyle('orbital');
        }
    }
}

function handleSkillFilterChange() {
    const selector = document.getElementById('skill-selector');
    const skill = selector ? selector.value : 'toate';
    appState.selectedSkill = skill;

    const allowedNodes = ugrData.skillMapping[skill] || ugrData.skillMapping.toate;

    const vectorMap = {
        chisinau: 'vec-chisinau',
        cluj: 'vec-cluj',
        iasi: 'vec-iasi',
        constanta: 'vec-constanta',
        timisoara: 'vec-timisoara'
    };

    Object.entries(vectorMap).forEach(([key, lineId]) => {
        const line = document.getElementById(lineId);
        if (line) {
            if (allowedNodes.includes(key)) {
                line.style.opacity = '1';
                line.style.stroke = '#40B0F0';
            } else {
                line.style.opacity = '0.15';
            }
        }
    });

    if (allowedNodes.length > 0 && !allowedNodes.includes(appState.selectedNode)) {
        selectNode(allowedNodes[0]);
    } else if (myGlobe) {
        updateGlobePoints(appState.selectedNode || 'bucuresti');
    }
}

function toggleSpatialDrawer() {
    const drawer = document.getElementById('spatial-drawer-body');
    const toggleText = document.getElementById('spatial-toggle-text');
    const chevron = document.getElementById('spatial-chevron');
    if (!drawer) return;
    const isExpanded = drawer.classList.contains('expanded');
    if (!isExpanded) {
        drawer.classList.add('expanded');
        if (toggleText) toggleText.innerText = 'Ascunde';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        drawer.classList.remove('expanded');
        if (toggleText) toggleText.innerText = 'Detalii Nod';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}
window.toggleSpatialDrawer = toggleSpatialDrawer;

// ═══════════════════════════════════════════════════════════════════════════
// 4. GLOB 3D WEBGL (THREE.JS + GLOBE.GL + SATELLIȚI + LASERE)
// ═══════════════════════════════════════════════════════════════════════════

let myGlobe = null;
let satellites = [];
let laserBeam = null;
let animationFrameId = null;

function updateGlobeRings(activeKey) {
    if (!myGlobe || typeof myGlobe.ringsData !== 'function') return;
    const curStyle = window.currentArcStyle || 'clean';

    if (curStyle === 'clean' || curStyle === 'radar') {
        const rings = Object.keys(ugrData.mapNodes).map(k => {
            const n = ugrData.mapNodes[k];
            const isAct = (k === activeKey);
            const isChi = (k === 'chisinau');
            return {
                lat: n.lat,
                lng: n.lon,
                isAct: isAct,
                isChi: isChi,
                maxR: isAct ? 3.8 : 2.2,
                speed: isAct ? 2.2 : 1.2,
                repeat: isAct ? 950 : 2200
            };
        });
        myGlobe
            .ringsData(rings)
            .ringColor(d => (t) => {
                if (d.isChi) {
                    return `rgba(255, 159, 28, ${Math.max(0, (d.isAct ? 0.95 : 0.45) * (1 - t))})`;
                }
                return `rgba(0, 229, 255, ${Math.max(0, (d.isAct ? 0.95 : 0.4) * (1 - t))})`;
            })
            .ringMaxRadius(d => d.maxR)
            .ringPropagationSpeed(d => d.speed)
            .ringRepeatPeriod(d => d.repeat);
    } else {
        const node = ugrData.mapNodes[activeKey];
        if (!node) return;
        const isChisinau = activeKey === 'chisinau';
        myGlobe
            .ringsData([{ lat: node.lat, lng: node.lon }])
            .ringColor(() => (t) => isChisinau ? `rgba(255, 159, 28, ${Math.max(0, 0.9 * (1 - t))})` : `rgba(0, 229, 255, ${Math.max(0, 0.95 * (1 - t))})`)
            .ringMaxRadius(3.5)
            .ringPropagationSpeed(2.2)
            .ringRepeatPeriod(950);
    }
}

function updateGlobePoints(activeKey) {
    if (!myGlobe || typeof myGlobe.pointsData !== 'function') return;
    const allowed = (ugrData.skillMapping[appState.selectedSkill] || ugrData.skillMapping.toate);
    const updatedPoints = Object.keys(ugrData.mapNodes).map(key => {
        const node = ugrData.mapNodes[key];
        const isSelected = (key === activeKey);
        const isAllowed = allowed.includes(key) || key === 'bucuresti';
        return {
            id: key,
            labelTitle: (key === 'bucuresti' ? '★ SECTOR 1 ' : '') + node.name.toUpperCase(),
            lat: node.lat,
            lng: node.lon,
            size: isSelected ? 0.32 : (isAllowed ? 0.18 : 0.08),
            color: isSelected ? (key === 'chisinau' ? '#FF9F1C' : '#00FFFF') : (isAllowed ? (key === 'chisinau' ? 'rgba(255,159,28,0.85)' : 'rgba(64,176,240,0.85)') : 'rgba(255,255,255,0.15)'),
            altitude: isSelected ? 0.03 : (isAllowed ? 0.018 : 0.008)
        };
    });
    myGlobe.pointsData(updatedPoints);
}

function switchMapView(mode) {
    const btn2d = document.getElementById('btn-mode-2d');
    const btn3d = document.getElementById('btn-mode-3d');
    const svgWrapper = document.getElementById('svg-map-wrapper');
    const globeWrapper = document.getElementById('globe-3d-wrapper');

    if (mode === '3d') {
        btn3d.classList.add('active');
        btn3d.setAttribute('aria-selected', 'true');
        btn2d.classList.remove('active');
        btn2d.setAttribute('aria-selected', 'false');

        const arcPill = document.getElementById('arc-style-pill');
        if (arcPill) arcPill.style.display = 'flex';

        svgWrapper.style.display = 'none';
        globeWrapper.style.display = 'block';

        if (!appState.globeInitialized) {
            init3DGlobe();
        } else {
            if (typeof window.startSatelliteAnimation === 'function') {
                window.startSatelliteAnimation();
            }
            if (myGlobe) {
                const activeKey = appState.selectedNode || 'bucuresti';
                const node = ugrData.mapNodes[activeKey];
                if (node) {
                    myGlobe.pointOfView({ lat: node.lat, lng: node.lon, altitude: activeKey === 'bucuresti' ? 0.32 : 0.36 }, 1200);
                    updateGlobeRings(activeKey);
                    updateGlobePoints(activeKey);
                    if (typeof updateLaserTracking === 'function') {
                        updateLaserTracking();
                    }
                }
            }
        }
    } else {
        btn2d.classList.add('active');
        btn2d.setAttribute('aria-selected', 'true');
        btn3d.classList.remove('active');
        btn3d.setAttribute('aria-selected', 'false');

        const arcPill = document.getElementById('arc-style-pill');
        if (arcPill) arcPill.style.display = 'none';

        globeWrapper.style.display = 'none';
        svgWrapper.style.display = 'block';

        // Oprește loop-ul Three.js când modul 2D este activ
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

function init3DGlobe() {
    const container = document.getElementById('globe-canvas-container');
    if (!container || typeof Globe !== 'function') return;

    appState.globeInitialized = true;

    const w = container.clientWidth || 360;
    const h = container.clientHeight || 290;

    myGlobe = Globe()(container)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor('#00E5FF')
        .atmosphereAltitude(0.18)
        .showGraticules(true)
        .width(w)
        .height(h);

    const activeKey = appState.selectedNode || 'bucuresti';
    const pointsData = Object.keys(ugrData.mapNodes).map(key => {
        const node = ugrData.mapNodes[key];
        const isSelected = (key === activeKey);
        return {
            id: key,
            labelTitle: (key === 'bucuresti' ? '★ SECTOR 1 ' : '') + node.name.toUpperCase(),
            lat: node.lat,
            lng: node.lon,
            size: isSelected ? 0.32 : 0.18,
            color: isSelected ? (key === 'chisinau' ? '#FF9F1C' : '#00FFFF') : (key === 'chisinau' ? 'rgba(255,159,28,0.85)' : 'rgba(64,176,240,0.85)'),
            altitude: isSelected ? 0.03 : 0.018
        };
    });

    myGlobe
        .pointsData(pointsData)
        .pointColor('color')
        .pointAltitude('altitude')
        .pointRadius('size')
        .pointLabel(d => `
            <div style="display:inline-flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${d.id === 'chisinau' ? '#FF9F1C' : '#00E5FF'};box-shadow:0 0 6px ${d.id === 'chisinau' ? '#FF9F1C' : '#00E5FF'};"></span>
                <span>${d.labelTitle}</span>
            </div>
        `)
        .onPointClick(point => {
            if (point && point.id) {
                selectNode(point.id);
            }
        });

    updateGlobeRings(activeKey);

    let currentArcStyle = window.ARCS_STYLE || (new URLSearchParams(window.location.search).get('style')) || 'clean';

    const triangulationPairs = [
        { from: 'bucuresti', to: 'constanta' },
        { from: 'bucuresti', to: 'cluj' },
        { from: 'bucuresti', to: 'iasi' },
        { from: 'cluj', to: 'timisoara' },
        { from: 'cluj', to: 'iasi' },
        { from: 'iasi', to: 'chisinau' }
    ];

    function applyGlobeArcStyle(styleName) {
        if (!myGlobe || typeof myGlobe.arcsData !== 'function') return;
        currentArcStyle = styleName || 'clean';
        window.currentArcStyle = currentArcStyle;

        const btnClean = document.getElementById('btn-style-clean');
        const btnTriangulation = document.getElementById('btn-style-triangulation');
        if (btnClean && btnTriangulation) {
            if (currentArcStyle === 'clean' || currentArcStyle === 'radar') {
                btnClean.style.background = 'rgba(0,229,255,0.3)';
                btnClean.style.borderColor = '#00E5FF';
                btnClean.style.color = '#fff';
                btnTriangulation.style.background = 'transparent';
                btnTriangulation.style.borderColor = 'transparent';
                btnTriangulation.style.color = 'rgba(255,255,255,0.65)';
            } else {
                btnTriangulation.style.background = 'rgba(0,229,255,0.3)';
                btnTriangulation.style.borderColor = '#00E5FF';
                btnTriangulation.style.color = '#fff';
                btnClean.style.background = 'transparent';
                btnClean.style.borderColor = 'transparent';
                btnClean.style.color = 'rgba(255,255,255,0.65)';
            }
        }

        // Demo 2A: ZERO arcuri la sol (fără benzi late), glob curat și triangulație prin satelit
        myGlobe.arcsData([]);
        updateGlobeRings(appState.selectedNode || 'bucuresti');
        if (typeof window.updateLaserTracking === 'function') {
            window.updateLaserTracking();
        }
    }
    window.setArcStyle = applyGlobeArcStyle;

    applyGlobeArcStyle(currentArcStyle);

    if (typeof bordersGeoJson !== 'undefined' && bordersGeoJson.features) {
        myGlobe
            .polygonsData(bordersGeoJson.features)
            .polygonCapColor(() => 'rgba(0, 180, 255, 0.08)')
            .polygonSideColor(() => 'rgba(0, 229, 255, 0.22)')
            .polygonStrokeColor(() => 'rgba(0, 229, 255, 0.75)')
            .polygonAltitude(0.012);
    }

    myGlobe.pointOfView({ lat: 45.8, lng: 25.0, altitude: 2.2 }, 0);
    setTimeout(() => {
        const cur = ugrData.mapNodes[appState.selectedNode || 'bucuresti'];
        if (cur) {
            myGlobe.pointOfView({ lat: cur.lat, lng: cur.lon, altitude: 0.36 }, 1600);
        }
    }, 400);

    const controls = myGlobe.controls();
    if (controls) {
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.minDistance = 115;
        controls.maxDistance = 500;
    }

    setupSatellitesAndLasers();

    window.addEventListener('resize', () => {
        if (myGlobe && container) {
            myGlobe.width(container.clientWidth || 360);
            myGlobe.height(container.clientHeight || 290);
        }
    });
}

function setupSatellitesAndLasers() {
    if (!myGlobe || typeof THREE === 'undefined') return;

    const scene = myGlobe.scene();
    const orbitRadius = 140;

    function buildSatelliteMesh(accentColor) {
        const satGroup = new THREE.Group();

        // Corp central aurit (Multilayer Insulation Foil)
        const bodyGeom = new THREE.BoxGeometry(2.4, 1.6, 2.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xFBBF24,
            metalness: 0.75,
            roughness: 0.25
        });
        const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        satGroup.add(bodyMesh);

        // Panouri solare fotovoltaice (albastru orbital)
        const panelGeom = new THREE.BoxGeometry(5.0, 0.3, 1.6);
        const panelMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
        
        const leftP = new THREE.Mesh(panelGeom, panelMat);
        leftP.position.x = -3.8;
        const rightP = new THREE.Mesh(panelGeom, panelMat);
        rightP.position.x = 3.8;

        satGroup.add(leftP);
        satGroup.add(rightP);

        // Antenă emițătoare cu accent spectral
        const antennaGeom = new THREE.SphereGeometry(0.8, 8, 8);
        const antennaMat = new THREE.MeshBasicMaterial({ color: accentColor || 0x00F0FF });
        const antenna = new THREE.Mesh(antennaGeom, antennaMat);
        antenna.position.y = -1.0;
        satGroup.add(antenna);

        return satGroup;
    }

    // Configurație Constelație Triunghiulară GNSS (Demo Nou):
    // 3 sateliți poziționați în bolta cerească vizibilă a României (Line of Sight 100% garantat)
    const triangleConfigs = [
        { name: 'SAT-ALPHA (Nord-Zenit)', baseLat: 54.0, baseLon: 25.5, alt: 0.48, color: 0x00F0FF, phase: 0 },
        { name: 'SAT-BETA (Sud-Est)',     baseLat: 34.0, baseLon: 36.0, alt: 0.46, color: 0x38BDF8, phase: 2.1 },
        { name: 'SAT-GAMMA (Sud-Vest)',   baseLat: 34.0, baseLon: 15.0, alt: 0.46, color: 0xF59E0B, phase: 4.2 }
    ];

    // Curățăm sateliții anteriori dacă există
    if (satellites && satellites.length > 0) {
        satellites.forEach(s => {
            if (s.mesh) scene.remove(s.mesh);
            if (s.laserLine) scene.remove(s.laserLine);
        });
    }
    if (window._triangleLineMesh) {
        scene.remove(window._triangleLineMesh);
    }

    satellites = [];

    // Linia triunghiulară celestă care unește cei 3 sateliți între ei în spațiu
    const triangleGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
    ]);
    const triangleMat = new THREE.LineBasicMaterial({
        color: 0x00F0FF,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
    });
    const triangleLine = new THREE.Line(triangleGeom, triangleMat);
    scene.add(triangleLine);
    window._triangleLineMesh = triangleLine;

    triangleConfigs.forEach(cfg => {
        const satMesh = buildSatelliteMesh(cfg.color);
        scene.add(satMesh);

        // Fascicul laser fin (1px) de coborâre către sol
        const laserGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const laserMat = new THREE.LineBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const laserLine = new THREE.Line(laserGeom, laserMat);
        scene.add(laserLine);

        satellites.push({
            name: cfg.name,
            mesh: satMesh,
            laserLine: laserLine,
            baseLat: cfg.baseLat,
            baseLon: cfg.baseLon,
            alt: cfg.alt,
            color: cfg.color,
            phase: cfg.phase
        });
    });

    // Funcția de triangulație multi-satelit: toți cei 3 sateliți converg simultan pe stația activă
    function updateLaserTracking() {
        const activeNodeKey = appState.selectedNode || 'bucuresti';
        const node = ugrData.mapNodes[activeNodeKey];

        if (node && satellites.length > 0 && typeof myGlobe.getCoords === 'function') {
            const targetCoords = myGlobe.getCoords(node.lat, node.lon, 0.035);
            const targetVec = new THREE.Vector3(targetCoords.x, targetCoords.y, targetCoords.z);

            satellites.forEach(sat => {
                if (sat.laserLine) {
                    sat.laserLine.geometry.setFromPoints([sat.mesh.position, targetVec]);
                    sat.laserLine.geometry.attributes.position.needsUpdate = true;
                    sat.laserLine.visible = true;
                }
            });
        }
    }
    window.updateLaserTracking = updateLaserTracking;

    let animTime = 0;
    function animateSatellites() {
        animTime += 0.015;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (typeof myGlobe.getCoords === 'function') {
            const satPositions = [];
            const centerRomania = myGlobe.getCoords(45.5, 25.0, 0.0);
            const centerVec = new THREE.Vector3(centerRomania.x, centerRomania.y, centerRomania.z);

            satellites.forEach(sat => {
                // Mișcare orbitală armonioasă (oscilație fină în spațiul vizibil al României)
                const latShift = prefersReducedMotion ? 0 : Math.sin(animTime * 0.4 + sat.phase) * 2.5;
                const lonShift = prefersReducedMotion ? 0 : Math.cos(animTime * 0.4 + sat.phase) * 3.5;
                
                const coords = myGlobe.getCoords(sat.baseLat + latShift, sat.baseLon + lonShift, sat.alt);
                sat.mesh.position.set(coords.x, coords.y, coords.z);
                sat.mesh.lookAt(centerVec);
                satPositions.push(new THREE.Vector3(coords.x, coords.y, coords.z));
            });

            // Actualizăm triunghiul celest care unește sateliții în spațiu
            if (satPositions.length === 3 && window._triangleLineMesh) {
                window._triangleLineMesh.geometry.setFromPoints([
                    satPositions[0], satPositions[1], satPositions[2], satPositions[0]
                ]);
                window._triangleLineMesh.geometry.attributes.position.needsUpdate = true;
            }

            updateLaserTracking();
        }

        const globeWrapper = document.getElementById('globe-3d-wrapper');
        const isGlobeVisible = (appState.currentView === 'acasa' && globeWrapper && globeWrapper.style.display !== 'none');

        if (!prefersReducedMotion && isGlobeVisible) {
            animationFrameId = requestAnimationFrame(animateSatellites);
        } else {
            animationFrameId = null;
        }
    }

    function startSatelliteAnimation() {
        if (!animationFrameId && appState.globeInitialized) {
            const globeWrapper = document.getElementById('globe-3d-wrapper');
            if (appState.currentView === 'acasa' && globeWrapper && globeWrapper.style.display !== 'none') {
                animationFrameId = requestAnimationFrame(animateSatellites);
            }
        }
    }
    window.startSatelliteAnimation = startSatelliteAnimation;

    animateSatellites();

    // Re-check animation if user changes preference at runtime
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (!e.matches && appState.globeInitialized) {
            startSatelliteAnimation();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CALCULATOR STEREO 70 (EPSG:3844) ⇄ WGS84 (CONFORM NORME ANCPI)
// ═══════════════════════════════════════════════════════════════════════════

function initProj4() {
    if (typeof proj4 !== 'undefined') {
        // Standard oficial ANCPI: Pulkovo 1942(58) / Stereo 70 (Ordinul ANCPI nr. 108/2010)
        proj4.defs(
            "EPSG:3844",
            "+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 +ellps=krass +towgs84=2.3287,-147.0425,-92.0802,0.3092483,0.3248218,-0.4973001,5.68906266 +units=m +no_defs"
        );
        // Suport retrocompatibil pentru aliasul istoric EPSG:31700
        proj4.defs("EPSG:31700", proj4.defs("EPSG:3844"));
    }
}

// Animație de cifrare / derulare numere geodezice (Motion Scramble Decoder)
function animateScramble(elemId, targetText, duration = 380) {
    const el = document.getElementById(elemId);
    if (!el) return;
    el.classList.add('scramble-active');

    const chars = '0123456789.';
    const startTime = performance.now();

    function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
            let out = '';
            for (let i = 0; i < targetText.length; i++) {
                const c = targetText[i];
                if (c === ' ' || c === '°' || c === '\'' || c === '"' || c === 'N' || c === 'E' || c === '|' || c === 'm') {
                    out += c;
                } else if (Math.random() < progress * 1.3) {
                    out += c;
                } else {
                    out += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            el.innerText = out;
            requestAnimationFrame(frame);
        } else {
            el.innerText = targetText;
            setTimeout(() => {
                el.classList.remove('scramble-active');
            }, 200);
        }
    }
    requestAnimationFrame(frame);
}

function calculateCoordinates(event) {
    if (event) event.preventDefault();

    const xNord = parseFloat(document.getElementById('coord-x').value);
    const yEst = parseFloat(document.getElementById('coord-y').value);

    if (isNaN(xNord) || isNaN(yEst)) {
        alert("Vă rugăm să introduceți valori numerice valide pentru coordonatele X și Y (Stereo 70).");
        return;
    }

    try {
        // [Est, Nord] conform standardului GIS Proj4 cu proiecția oficială ANCPI EPSG:3844
        const [lon, lat] = proj4("EPSG:3844", "WGS84", [yEst, xNord]);

        const resultBox = document.getElementById('calc-result-box');
        if (resultBox) {
            resultBox.style.display = 'block';
            // Restart card entrance animation
            resultBox.classList.remove('calc-card-animate');
            void resultBox.offsetWidth; // trigger reflow
            resultBox.classList.add('calc-card-animate');
        }

        // Valori Stereo 70 Sursă
        const resSourceX = document.getElementById('res-source-x');
        const resSourceY = document.getElementById('res-source-y');
        if (resSourceX) resSourceX.innerText = `${xNord.toFixed(3)} m`;
        if (resSourceY) resSourceY.innerText = `${yEst.toFixed(3)} m`;

        // Coordonate WGS84 Destinație cu animație scramble/odometru
        const latStr = `${lat.toFixed(6)}° N`;
        const lonStr = `${lon.toFixed(6)}° E`;
        const dmsLat = formatDMS(lat, 'lat');
        const dmsLon = formatDMS(lon, 'lon');
        const dmsStr = `${dmsLat} | ${dmsLon}`;

        // Câmpuri retrocompatibile
        const resLat = document.getElementById('res-lat');
        const resLon = document.getElementById('res-lon');
        if (resLat) resLat.innerText = `${lat.toFixed(6)}° (${dmsLat})`;
        if (resLon) resLon.innerText = `${lon.toFixed(6)}° (${dmsLon})`;

        // Elemente tabel animat modern (mai lent, calcul de precizie vizibil)
        animateScramble('res-lat-val', latStr, 600);
        animateScramble('res-lon-val', lonStr, 680);
        animateScramble('res-dms-val', dmsStr, 760);

    } catch (err) {
        console.error("Eroare transformare geodezică EPSG:3844:", err);
        alert("Eroare la calcularea proiecției. Verificați valorile introduse.");
    }
}

function fillExampleCoords(preset = 'central') {
    const inputX = document.getElementById('coord-x');
    const inputY = document.getElementById('coord-y');

    if (preset === 'sector1') {
        // Exemplu Sector 1 (Piața Victoriei / Arcul de Triumf)
        if (inputX) inputX.value = '328733.315';
        if (inputY) inputY.value = '586483.430';
    } else {
        // Sediul Central UGR (Lacul Tei 124)
        if (inputX) inputX.value = '334250.125';
        if (inputY) inputY.value = '591240.850';
    }

    // Efect de puls vizual pe câmpurile de intrare
    [inputX, inputY].forEach(inp => {
        if (inp) {
            inp.classList.add('input-pulse-active');
            setTimeout(() => inp.classList.remove('input-pulse-active'), 450);
        }
    });

    calculateCoordinates();
}

function copyCalculatedCoords(btn) {
    const lat = document.getElementById('res-lat-val')?.innerText || '';
    const lon = document.getElementById('res-lon-val')?.innerText || '';
    const dms = document.getElementById('res-dms-val')?.innerText || '';
    const textToCopy = `WGS84: ${lat}, ${lon} (${dms}) — Stereo 70 ANCPI EPSG:3844`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<span>✓</span> Copiat cu succes!`;
            btn.style.borderColor = '#10B981';
            btn.style.color = '#10B981';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        }).catch(() => {
            prompt("Copiați coordonatele:", textToCopy);
        });
    } else {
        prompt("Copiați coordonatele:", textToCopy);
    }
}
window.copyCalculatedCoords = copyCalculatedCoords;

function exportCalculatedPoint(type) {
    const x = document.getElementById('coord-x')?.value || '334250.125';
    const y = document.getElementById('coord-y')?.value || '591240.850';
    const lat = document.getElementById('res-lat-val')?.innerText || '';
    const lon = document.getElementById('res-lon-val')?.innerText || '';
    const dms = document.getElementById('res-dms-val')?.innerText || '';

    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (type === 'csv') {
        content = "Punct,Sistem_Sursa,X_Nord_m,Y_Est_m,Sistem_Destinatie,Latitudine_WGS84,Longitudine_WGS84,Format_DMS,Norma_Tehnica\r\n";
        content += `1,Stereo 70 (EPSG:3844),${x},${y},WGS84 (EPSG:4326),${lat},${lon},"${dms}",ANCPI Ord. 108/2010\r\n`;
        filename = "punct_geodezic_stereo70_wgs84.csv";
        mimeType = 'text/csv;charset=utf-8;';
    } else {
        content = "=================================================================\r\n";
        content += "  RAPORT TRANSFORMARE GEODEZICĂ — UGR FILIALA SECTOR 1\r\n";
        content += "=================================================================\r\n";
        content += `Dată & Oră: ${new Date().toLocaleString('ro-RO')}\r\n`;
        content += "Standard: ANCPI (Ordinul Directorului General ANCPI nr. 108/2010)\r\n\r\n";
        content += `SISTEM SURSĂ: Stereo 70 (EPSG:3844) pe Elipsoid Krasovski 1940\r\n`;
        content += `  X (Nord): ${x} m\r\n`;
        content += `  Y (Est):  ${y} m\r\n\r\n`;
        content += `SISTEM DESTINAȚIE: WGS84 Global Geodetic (EPSG:4326)\r\n`;
        content += `  Latitudine (DD): ${lat}\r\n`;
        content += `  Longitudine (DD): ${lon}\r\n`;
        content += `  Sexagesimal (DMS): ${dms}\r\n\r\n`;
        content += "PARAMETRI HELMERT 7-PARAMETRI UTILIZAȚI:\r\n";
        content += "  dX = +2.3287 m, dY = -147.0425 m, dZ = -92.0802 m\r\n";
        content += "  rX = +0.3092483\", rY = +0.3248218\", rZ = -0.4973001\"\r\n";
        content += "  Scară s = +5.68906266 ppm\r\n";
        content += "=================================================================\r\n";
        filename = "raport_transformare_geodezica.txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
window.exportCalculatedPoint = exportCalculatedPoint;

function formatDMS(deg, type) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    let direction = (type === 'lat') ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'V');
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. RENDARE DINAMICĂ A DATELOR DIN DATA.JS
// ═══════════════════════════════════════════════════════════════════════════

function renderMembersTable(members) {
    if (!members) members = ugrData.membersList || [];

    const tableIds = [
        'members-table-body',
        'members-table-body-demo1',
        'members-table-body-demo2',
        'members-table-body-demo3',
        'members-table-body-demo4',
        'members-table-body-demo5'
    ];

    const emptyRow = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: rgba(250,251,252,0.6);">Nu a fost găsit niciun membru conform criteriilor de căutare.</td></tr>`;

    const rowsHtml = members.length === 0 ? emptyRow : members.map((m, idx) => `
        <tr class="table-row-animated" style="border-bottom: 1px solid rgba(255,255,255,0.06); animation-delay: ${idx * 25}ms;">
            <td style="padding: 13px 16px; font-family: var(--font-mono); font-weight: 600; color: #00E5FF;">${m.id}</td>
            <td style="padding: 13px 16px; font-weight: 600; color: #FFFFFF;">${m.name}</td>
            <td style="padding: 13px 16px; color: rgba(250,251,252,0.75);">${m.judet}</td>
            <td style="padding: 13px 16px; font-family: var(--font-mono); font-size: 12px; color: rgba(250,251,252,0.85);">${m.auth}</td>
            <td style="padding: 13px 16px;">
                <span class="member-status-badge" style="background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); padding: 3px 8px; border-radius: 4px; font-size: 11px; font-family: var(--font-mono); font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                    <span class="status-live-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px #10B981;"></span> ${m.status.toUpperCase()}
                </span>
            </td>
        </tr>
    `).join('');

    tableIds.forEach(id => {
        const tbody = document.getElementById(id);
        if (tbody) tbody.innerHTML = rowsHtml;
    });

    const countBadges = [
        'members-count-badge',
        'm-demo1-count',
        'm-demo2-count',
        'm-demo3-count',
        'm-demo4-count',
        'm-demo5-count'
    ];
    countBadges.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) badge.innerHTML = `Se afișează <b>${members.length}</b> membri autorizați`;
    });
}

function filterMembers(sourcePrefix = '') {
    let searchVal = '';
    let countyVal = 'toate';

    const searchInput = document.getElementById(sourcePrefix ? `${sourcePrefix}-search` : 'member-search-input') 
                     || document.getElementById('member-search-input')
                     || document.querySelector('.m-dynamic-search');
    const countySelect = document.getElementById(sourcePrefix ? `${sourcePrefix}-county` : 'member-county-select') 
                      || document.getElementById('member-county-select')
                      || document.querySelector('.m-dynamic-county');

    if (searchInput) searchVal = searchInput.value.toLowerCase().trim();
    if (countySelect) countyVal = countySelect.value;

    const filtered = (ugrData.membersList || []).filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchVal) || m.auth.toLowerCase().includes(searchVal) || m.id.toLowerCase().includes(searchVal);
        const matchesCounty = (countyVal === 'toate') || (m.judet === countyVal);
        return matchesSearch && matchesCounty;
    });

    renderMembersTable(filtered);
}
window.filterMembers = filterMembers;

function filterEvents(scope, btn) {
    if (btn) {
        document.querySelectorAll('.event-filter-pill').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
    }
    renderNewsBento(scope);
}
window.filterEvents = filterEvents;

function renderNewsBento(filterScope = 'all') {
    const container = document.getElementById('news-bento-container');
    if (!container || !ugrData.newsList) return;

    const filtered = filterScope === 'all' 
        ? ugrData.newsList 
        : ugrData.newsList.filter(item => item.scope === filterScope);

    container.innerHTML = filtered.map(item => {
        const isNational = item.scope === 'national';
        const badgeClass = isNational ? 'badge-scope-national' : 'badge-scope-local';
        const dotClass = isNational ? 'badge-dot-gold' : 'badge-dot-cyan';
        const borderClass = isNational ? 'card-scope-national' : 'card-scope-local';
        const targetAttr = (item.source.url && item.source.url.startsWith('http')) ? 'target="_blank" rel="noopener noreferrer"' : '';

        return `
        <article class="bento-card ${borderClass}">
            <div class="bento-card-media">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="bento-card-content">
                <div class="bento-scope-badge ${badgeClass}">
                    <span class="${dotClass}"></span>
                    <span>${item.scopeLabel || (isNational ? 'EVENIMENT NAȚIONAL UGR / FIG / CLGE' : 'ACTIVITATE LOCALĂ FILIALA SECTOR 1')}</span>
                </div>
                <div class="bento-meta">
                    <span class="bento-cat-text">${item.category}</span>
                    <span class="bento-date-text">${item.date}</span>
                </div>
                <h3 class="bento-card-title">${item.title}</h3>
                <p class="bento-card-desc">${item.desc}</p>
                <div class="bento-card-footer">
                    <span class="bento-location">📍 ${item.location}</span>
                    <a href="${item.source.url}" ${targetAttr} class="bento-action-link ${isNational ? 'link-gold' : 'link-cyan'}">
                        ${item.actionText || 'Deschide detalii ↗'}
                    </a>
                </div>
            </div>
        </article>
        `;
    }).join('');
}

function renderLeadership() {
    const container = document.getElementById('leadership-cards-container');
    if (!container || !ugrData.leadership) return;

    container.innerHTML = ugrData.leadership.map(member => `
        <div class="bento-card card-light">
            <div style="height: 160px; overflow: hidden; background: var(--ugr-paper); display: flex; align-items: center; justify-content: center;">
                <img src="${member.image}" alt="${member.name}" style="height: 100%; object-fit: contain; padding: 12px;">
            </div>
            <div class="bento-card-content">
                <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ugr-accent); text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">${member.role}</span>
                <h4 style="font-size: 17px; margin-bottom: 8px; font-weight: 700; color: var(--ugr-text-main);">${member.name}</h4>
                <p style="font-size: 12.5px; color: var(--ugr-text-muted); line-height: 1.5;">${member.desc}</p>
            </div>
        </div>
    `).join('');
}

function renderDocuments() {
    const container = document.getElementById('documents-container');
    if (!container || !ugrData.documentsList) return;

    container.innerHTML = ugrData.documentsList.map(doc => `
        <div class="bento-card card-light">
            <div class="bento-card-content" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-family: var(--font-mono); font-weight: 700; background: rgba(18,125,194,0.1); color: var(--ugr-accent);">
                        ${doc.format}
                    </span>
                    <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ugr-text-muted); text-transform: uppercase;">
                        ${doc.badge}
                    </span>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--ugr-text-main);">${doc.title}</h4>
                <p style="font-size: 12.5px; color: var(--ugr-text-muted); line-height: 1.5; margin-bottom: 20px;">${doc.desc}</p>
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="border-color: var(--ugr-accent); color: var(--ugr-accent); justify-content: center; text-align: center; font-size: 11px; margin-top: auto;">
                    Descarcă formularul tipizat ⬇
                </a>
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. ACORDEON FAQ (ÎNTREBĂRI FRECVENTE)
// ═══════════════════════════════════════════════════════════════════════════

function renderFaq() {
    const container = document.getElementById('faq-accordion-container');
    if (!container || !ugrData.faqList) return;

    container.innerHTML = ugrData.faqList.map((item, index) => `
        <div class="faq-card ${index === 0 ? 'open' : ''}" id="faq-item-${index}">
            <button type="button" class="faq-question" id="faq-btn-${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="faq-ans-${index}" onclick="toggleFaq(${index})">
                <span>${item.q}</span>
                <span class="faq-icon" aria-hidden="true">${index === 0 ? '−' : '+'}</span>
            </button>
            <div class="faq-answer" id="faq-ans-${index}" role="region" aria-labelledby="faq-btn-${index}" ${index === 0 ? '' : 'hidden'}>
                <p>${item.a}</p>
            </div>
        </div>
    `).join('');
}

function toggleFaq(index) {
    const target = document.getElementById(`faq-item-${index}`);
    if (!target) return;

    const wasOpen = target.classList.contains('open');

    // Închide toate
    document.querySelectorAll('.faq-card').forEach((card, idx) => {
        card.classList.remove('open');
        const btn = document.getElementById(`faq-btn-${idx}`);
        const ans = document.getElementById(`faq-ans-${idx}`);
        const icon = btn ? btn.querySelector('.faq-icon') : null;
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (ans) ans.setAttribute('hidden', '');
        if (icon) icon.innerText = '+';
    });

    if (!wasOpen) {
        target.classList.add('open');
        const btn = document.getElementById(`faq-btn-${index}`);
        const ans = document.getElementById(`faq-ans-${index}`);
        const icon = btn ? btn.querySelector('.faq-icon') : null;
        if (btn) btn.setAttribute('aria-expanded', 'true');
        if (ans) ans.removeAttribute('hidden');
        if (icon) icon.innerText = '−';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. CONTACT FORM SUBMISSION
// ═══════════════════════════════════════════════════════════════════════════

function handleContactSubmit(event) {
    event.preventDefault();
    const statusMsg = document.getElementById('contact-status-msg');
    if (statusMsg) {
        statusMsg.style.display = 'block';
    }

    setTimeout(() => {
        if (statusMsg) statusMsg.style.display = 'none';
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
    }, 4000);
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. MODAL DE ÎNREGISTRARE MULTI-STEP (WCAG 2.2 AA COMPLIANT)
// ═══════════════════════════════════════════════════════════════════════════

function openRegistrationModal() {
    appState.lastFocusedElement = document.activeElement;
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    modal.classList.add('active');
    appState.modalStep = 1;
    updateModalStepView();

    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        firstFocusable.focus();
    }

    document.addEventListener('keydown', handleModalKeydown);
}

function closeRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.removeEventListener('keydown', handleModalKeydown);

    appState.modalStep = 1;
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const phoneInput = document.getElementById('reg-phone');
    const banner = document.getElementById('reg-success-banner');

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (banner) banner.style.display = 'none';

    if (appState.lastFocusedElement) {
        appState.lastFocusedElement.focus();
    }
}

function handleModalKeydown(event) {
    const modal = document.getElementById('registration-modal');
    if (!modal || !modal.classList.contains('active')) return;

    if (event.key === 'Escape') {
        closeRegistrationModal();
        return;
    }

    if (event.key === 'Tab') {
        const allFocusables = Array.from(modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        const focusables = allFocusables.filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === first || !focusables.includes(document.activeElement)) {
                event.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last || !focusables.includes(document.activeElement)) {
                event.preventDefault();
                first.focus();
            }
        }
    }
}

function selectMemberTier(tier) {
    appState.selectedTier = tier;
    const boxFizica = document.getElementById('tier-fizica');
    const boxStudent = document.getElementById('tier-student');
    const boxJuridica = document.getElementById('tier-juridica');

    [boxFizica, boxStudent, boxJuridica].forEach(b => {
        if (b) {
            b.style.border = '1px solid rgba(11,46,78,0.2)';
            b.style.background = 'transparent';
            b.setAttribute('aria-checked', 'false');
        }
    });

    const activeBox = document.getElementById(`tier-${tier}`);
    if (activeBox) {
        activeBox.style.border = '2px solid var(--ugr-accent)';
        activeBox.style.background = 'rgba(18,125,194,0.06)';
        activeBox.setAttribute('aria-checked', 'true');
    }
}

function updateModalStepView() {
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');
    const step3 = document.getElementById('modal-step-3');
    const badge = document.getElementById('modal-step-badge');
    const btnBack = document.getElementById('btn-modal-back');
    const btnNext = document.getElementById('btn-modal-next');

    if (step1) step1.style.display = appState.modalStep === 1 ? 'block' : 'none';
    if (step2) step2.style.display = appState.modalStep === 2 ? 'block' : 'none';
    if (step3) step3.style.display = appState.modalStep === 3 ? 'block' : 'none';

    if (badge) badge.innerText = `Pasul ${appState.modalStep} din 3`;

    if (btnBack) {
        btnBack.disabled = (appState.modalStep === 1);
    }

    if (btnNext) {
        btnNext.innerText = (appState.modalStep === 3) ? 'Finalizează înscrierea ✓' : 'Continuă →';
    }
}

function nextModalStep() {
    if (appState.modalStep === 1) {
        appState.modalStep = 2;
        updateModalStepView();
    } else if (appState.modalStep === 2) {
        const name = (document.getElementById('reg-name')?.value || '').trim();
        const email = (document.getElementById('reg-email')?.value || '').trim();
        const phone = (document.getElementById('reg-phone')?.value || '').trim();

        if (!name || !email || !phone) {
            alert("Vă rugăm să completați toate câmpurile obligatorii din Pasul 2.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Vă rugăm să introduceți o adresă de email validă.");
            return;
        }

        appState.modalStep = 3;
        updateModalStepView();
    } else if (appState.modalStep === 3) {
        const banner = document.getElementById('reg-success-banner');
        if (banner) {
            banner.style.display = 'block';
        }
        setTimeout(() => {
            closeRegistrationModal();
        }, 3000);
    }
}

function prevModalStep() {
    if (appState.modalStep > 1) {
        appState.modalStep -= 1;
        updateModalStepView();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 9.5 ANIMAȚIE BRAND DEFINITIVĂ: TIPĂRIRE (TYPEWRITER) LA ÎNCĂRCARE & SCHIMBARE PAGINĂ
// ═══════════════════════════════════════════════════════════════════════════

const BRAND_NAME_TEXT = "UGR Filiala Sector 1";
let brandAnimTimer = null;
let brandAnimTimeout = null;
let brandHasTyped = false;

function playBrandTypewriter(force = false) {
    const titleEl = document.getElementById('header-brand-title');
    if (!titleEl) return;

    // Dacă a fost deja tastat și utilizatorul navighează prin pagini, nu se mai repetă
    if (brandHasTyped && !force) {
        titleEl.textContent = BRAND_NAME_TEXT;
        return;
    }

    if (brandAnimTimeout) clearTimeout(brandAnimTimeout);
    if (brandAnimTimer) clearTimeout(brandAnimTimer);

    titleEl.className = 'brand-title';
    titleEl.innerHTML = '<span class="brand-text"></span><span class="brand-cursor"></span>';
    const textSpan = titleEl.querySelector('.brand-text');
    const cursorSpan = titleEl.querySelector('.brand-cursor');
    let charIndex = 0;

    function typeStep() {
        if (charIndex < BRAND_NAME_TEXT.length) {
            charIndex++;
            if (textSpan) {
                textSpan.textContent = BRAND_NAME_TEXT.substring(0, charIndex);
            }

            // Cadență calmă, nobilă și lizibilă pentru un public matur (46ms / 95ms la spațiu)
            const lastChar = BRAND_NAME_TEXT[charIndex - 1];
            const delay = (lastChar === ' ') ? 95 : 46;

            brandAnimTimeout = setTimeout(typeStep, delay);
        } else {
            brandHasTyped = true;
            brandAnimTimeout = null;
            // Cursorul pulsează discret 1.8 secunde apoi se estompează lin
            brandAnimTimer = setTimeout(() => {
                if (cursorSpan) {
                    cursorSpan.style.opacity = '0';
                    setTimeout(() => {
                        if (cursorSpan && cursorSpan.parentNode) cursorSpan.remove();
                    }, 500);
                }
            }, 1800);
        }
    }

    brandAnimTimeout = setTimeout(typeStep, 100);
}
window.playBrandTypewriter = playBrandTypewriter;

// ═══════════════════════════════════════════════════════════════════════════
// 10. INIȚIALIZARE LA ÎNCĂRCAREA PAGINII
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initProj4();

    renderMembersTable(ugrData.membersList);
    renderNewsBento();
    renderLeadership();
    renderDocuments();
    renderFaq();

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    selectNode('bucuresti');

    // Verifică parametrul de URL pentru stilul butoanelor (?btn=a / ?btn=b sau ?btn=1 / ?btn=2)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const btnParam = urlParams.get('btn');
        if (btnParam === 'b' || btnParam === '2') {
            setBtnAnimationVariant('b');
        } else {
            setBtnAnimationVariant('a');
        }
    } catch (e) {}

    // Declanșare inițială la pornire / refresh (rămâne permanent la final)
    setTimeout(() => {
        playBrandTypewriter();
    }, 200);

    // Închidere drawer mobil la tasta Escape sau la click în afara lui
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && mobileMenu.style.display === 'flex') {
                closeMobileNav();
                const burger = document.querySelector('.burger-btn');
                if (burger) burger.focus();
            }
        }
    });

    document.addEventListener('click', (e) => {
        const mobileMenu = document.getElementById('mobile-menu');
        const burgerBtn = document.querySelector('.burger-btn');
        if (mobileMenu && mobileMenu.style.display === 'flex') {
            if (!mobileMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
                closeMobileNav();
            }
        }
    });

    // Inițializare Animație 3D Kinetică pentru Titlu & Kicker Calculator (Opțiunea 3 / 21st.dev cu Kicker Alb)
    initCalculatorKineticText();

    // Inițializare Scroll Reveal & Typewriter pentru Misiune & Statistici (din Original)
    initScrollReveal();
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. ANIMAȚIE 3D KINETICĂ CALCULATOR (OPȚIUNEA 3 / 21ST.DEV PERSONALIZATĂ)
//     Declanșare strict la scroll, o singură dată (JUST ONE TIME, FĂRĂ REPEAT), mai lent
// ═══════════════════════════════════════════════════════════════════════════
function initCalculatorKineticText() {
    const kickerEl = document.getElementById("calc-kinetic-kicker");
    const titleEl = document.getElementById("calc-kinetic-title");
    const headerEl = document.querySelector(".section-header.style-21stdev") || kickerEl;
    if (!kickerEl || !titleEl) return;

    let hasAnimated = false;

    // 1. Pregătire caractere: generate în DOM dar ținute invizibile până când utilizatorul dă scroll aici
    function prepareElements() {
        const kickerText = "—— UTILITAR TEHNIC INTEGRAT";
        kickerEl.innerHTML = "";
        kickerEl.style.perspective = "1000px";
        [...kickerText].forEach((char) => {
            const span = document.createElement("span");
            span.className = "eng-char";
            span.style.color = "#ffffff";
            span.innerHTML = char === " " ? "&nbsp;" : char;
            kickerEl.appendChild(span);
        });

        const titleText = "Calculator Transversal Stereo 70 ⇄ WGS84";
        titleEl.innerHTML = "";
        titleEl.style.perspective = "1000px";
        [...titleText].forEach((char) => {
            const span = document.createElement("span");
            span.className = "eng-char";
            span.innerHTML = char === " " ? "&nbsp;" : char;
            titleEl.appendChild(span);
        });

        const specBox = document.querySelector(".eng-spec-box");
        if (specBox) {
            specBox.style.opacity = "0";
            specBox.style.transform = "translateY(12px)";
        }
    }

    prepareElements();

    // 2. Declanșare animație o singură dată (JUST ONE TIME, NICIUN REPEAT)
    function triggerOnceAnimation() {
        if (hasAnimated) return;
        hasAnimated = true;

        // Kicker alb: animat 3D kinetic mai lent (36ms stagger, 1.05s durată)
        const kickerSpans = kickerEl.querySelectorAll(".eng-char");
        kickerSpans.forEach((span, index) => {
            span.style.animationDelay = `${0.08 + index * 0.036}s`;
            span.classList.add("animated");
        });

        // Titlu H2 mare: începe după kicker, animat mai lent (34ms stagger, 1.1s durată)
        const titleSpans = titleEl.querySelectorAll(".eng-char");
        titleSpans.forEach((span, index) => {
            span.style.animationDelay = `${0.55 + index * 0.034}s`;
            span.classList.add("animated");
        });

        // Casetă descriere normativ ANCPI: apariție lină
        const specBox = document.querySelector(".eng-spec-box");
        if (specBox) {
            specBox.style.transition = "opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.95s, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.95s";
            setTimeout(() => {
                specBox.style.opacity = "1";
                specBox.style.transform = "translateY(0)";
            }, 60);
        }

        // Card formular calculator / tabel: intrare lină la scroll
        const calcCard = document.querySelector(".calc-card");
        if (calcCard) {
            calcCard.classList.add("calc-card-scroll-reveal");
        }
    }

    // Monitorizare scroll cu IntersectionObserver: se declanșează strict când ajungi la secțiune
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    triggerOnceAnimation();
                    observer.unobserve(entry.target);
                    observer.disconnect(); // GARANTAT O SINGURĂ DATĂ, NU SE MAI REPETĂ NICIODATĂ
                }
            });
        }, {
            rootMargin: "0px 0px -80px 0px",
            threshold: 0.12
        });
        observer.observe(headerEl);
    } else {
        window.addEventListener('scroll', function onScrollOnce() {
            const rect = headerEl.getBoundingClientRect();
            if (rect.top < window.innerHeight - 60) {
                triggerOnceAnimation();
                window.removeEventListener('scroll', onScrollOnce);
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. SCROLL REVEAL & SINCRONIZARE FLUIDĂ LA SCROLL (CALIBRAT PENTRU ~35 ANI)
// ═══════════════════════════════════════════════════════════════════════════

function typeText(el, text, speed = 34) {
    if (!el) return;
    el.textContent = '';
    el.classList.add('typing-cursor');
    let i = 0;
    (function step() {
        if (i <= text.length) {
            el.textContent = text.slice(0, i);
            i++;
            setTimeout(step, speed);
        } else {
            setTimeout(() => {
                el.classList.remove('typing-cursor');
            }, 800);
        }
    })();
}

function initMissionScrollSync() {
    // Sincronizare la derularea paginii (Scroll / View Sync):
    // Secțiunea se declanșează calm și nobil când ajunge în câmpul vizual optim (threshold: 0.14)
    const missionSections = document.querySelectorAll('.mission-section-clean');
    if (!missionSections.length) return;

    const missionObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const sec = entry.target;

                // 1. Titlul, Kicker-ul și Paragraful (Blocul stânga - ritm calm, așezat)
                const headerEls = sec.querySelectorAll('.mission-header-block .scroll-reveal');
                headerEls.forEach((el, idx) => {
                    setTimeout(() => el.classList.add('is-visible'), idx * 80);
                });

                const paragraph = sec.querySelector('.mission-paragraph');
                if (paragraph) {
                    setTimeout(() => paragraph.classList.add('is-visible'), 160);
                }

                // 2. Grila de 4 statistici din dreapta (Stagger armonios de 140ms, cadență așezată)
                const statBlocks = Array.from(sec.querySelectorAll('.stat-block'));
                statBlocks.forEach((block, idx) => {
                    setTimeout(() => {
                        block.classList.add('is-visible');
                        const label = block.querySelector('.stat-label');
                        const fullText = label ? (label.getAttribute('data-text') || label.textContent.trim()) : '';
                        if (label && fullText && (!label.textContent.trim() || label.textContent.trim() !== fullText)) {
                            // Pornire calmă a tastării (34ms/caracter) la 220ms după așezarea cardului
                            setTimeout(() => typeText(label, fullText, 34), 220);
                        }
                    }, 180 + idx * 140);
                });

                missionObs.unobserve(sec);
            }
        });
    }, {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px'
    });

    missionSections.forEach((sec) => missionObs.observe(sec));

    // Observator sincronizat pentru bannerele CTA la scroll
    const ctaSections = document.querySelectorAll('.cta-banner-section');
    if (ctaSections.length) {
        const ctaObs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const reveals = entry.target.querySelectorAll('.scroll-reveal');
                    reveals.forEach((el, idx) => {
                        setTimeout(() => el.classList.add('is-visible'), idx * 120);
                    });
                    ctaObs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -40px 0px'
        });

        ctaSections.forEach((cta) => ctaObs.observe(cta));
    }
}

// Optimizare performanță: pune pe pauză animațiile grele din Hero când acesta nu e pe ecran
function initHeroPerformanceOptimizer() {
    const heroSec = document.querySelector('.hero-section');
    const ticker = document.getElementById('hero-photo-ticker');
    if (!heroSec || !ticker || !('IntersectionObserver' in window)) return;

    const heroObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                ticker.style.animationPlayState = 'running';
                if (appState.currentView === 'acasa' && document.getElementById('btn-mode-3d')?.classList.contains('active')) {
                    if (typeof window.startSatelliteAnimation === 'function') {
                        window.startSatelliteAnimation();
                    }
                }
            } else {
                ticker.style.animationPlayState = 'paused';
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
        });
    }, { threshold: 0 });

    heroObs.observe(heroSec);
}

function initScrollReveal() {
    initMissionScrollSync();
    initHeroPerformanceOptimizer();

    // Sincronizare automată pentru toate elementele .scroll-reveal din vederea activă (ex: Despre Noi)
    if ('IntersectionObserver' in window) {
        const activeSection = document.querySelector('.view-section:not(.hidden)');
        if (activeSection) {
            const reveals = activeSection.querySelectorAll('.scroll-reveal:not(.is-visible)');
            if (reveals.length) {
                const revealObs = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            revealObs.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.05,
                    rootMargin: '0px 0px -10px 0px'
                });
                reveals.forEach(el => revealObs.observe(el));
            }
        }
    }
}

// Comutator interactiv fin pentru testarea fotografiilor în secțiunea Despre Noi
window.switchDesprePhoto = function(src, btn) {
    const img = document.getElementById('despre-main-photo');
    if (!img) return;
    img.style.opacity = '0.35';
    img.style.transform = 'scale(0.985)';
    setTimeout(() => {
        img.src = src;
        img.onload = () => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        };
        // fallback in case already cached
        setTimeout(() => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        }, 120);
    }, 120);

    document.querySelectorAll('.photo-switch-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};

// Comutator interactiv pentru cele 4 Demo-uri de Design Evenimente & Media
window.switchEventsDemo = function(demoNum, btn) {
    for (let i = 1; i <= 4; i++) {
        const pane = document.getElementById('events-demo-' + i);
        if (pane) {
            if (i === demoNum) {
                pane.classList.remove('hidden');
                pane.style.opacity = '0';
                pane.style.transform = 'translateY(8px)';
                setTimeout(() => {
                    pane.style.opacity = '1';
                    pane.style.transform = 'translateY(0)';
                }, 40);
            } else {
                pane.classList.add('hidden');
            }
        }
    }
    document.querySelectorAll('.events-demo-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Trigger scroll reveal for newly visible elements
    if (typeof initScrollReveal === 'function') {
        setTimeout(() => initScrollReveal(), 60);
    }
};

window.switchDemo4Tab = function(tabId, btn) {
    document.querySelectorAll('.demo4-panel').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('demo4-pane-' + tabId);
    if (target) {
        target.classList.remove('hidden');
    }
    document.querySelectorAll('.demo4-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};





// ═══════════════════════════════════════════════════════════════════
// COMUTATOARE PENTRU CELE 5 DEMO-URI PAGINA MEMBRI
// ═══════════════════════════════════════════════════════════════════
window.switchMembersDemo = function(demoNum, btn) {
    for (let i = 1; i <= 5; i++) {
        const pane = document.getElementById('members-demo-' + i);
        if (pane) {
            if (i === demoNum) {
                pane.classList.remove('hidden');
                pane.style.opacity = '0';
                pane.style.transform = 'translateY(8px)';
                setTimeout(() => {
                    pane.style.opacity = '1';
                    pane.style.transform = 'translateY(0)';
                }, 40);
            } else {
                pane.classList.add('hidden');
            }
        }
    }
    document.querySelectorAll('.members-demo-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Trigger scroll reveal for newly visible elements
    if (typeof initScrollReveal === 'function') {
        setTimeout(() => initScrollReveal(), 60);
    }
};

window.switchDemo2MembersTab = function(tabId, btn) {
    document.querySelectorAll('.m-demo2-pane').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('m-demo2-pane-' + tabId);
    if (target) {
        target.classList.remove('hidden');
    }
    document.querySelectorAll('.m-demo2-dock-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};

// Comutator pentru stilurile de animație compactă din Cadrul Membri
window.setCardAnimMode = function(mode, btn) {
    const card = document.getElementById('m-target-card');
    const runner = document.getElementById('m-svg-runner');
    const radar = document.getElementById('m-card-radar-box');
    if (!card) return;

    card.classList.remove('show-corners', 'show-shimmer');
    if (runner) runner.style.opacity = '0';
    if (radar) radar.style.display = 'none';

    if (mode === 'combo') {
        if (runner) runner.style.opacity = '1';
        if (radar) radar.style.display = 'flex';
    } else if (mode === 'laser') {
        if (runner) runner.style.opacity = '1';
    } else if (mode === 'radar') {
        if (radar) radar.style.display = 'flex';
    } else if (mode === 'corners') {
        card.classList.add('show-corners');
    } else if (mode === 'shimmer') {
        card.classList.add('show-shimmer');
    }

    document.querySelectorAll('.card-anim-mini-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};
