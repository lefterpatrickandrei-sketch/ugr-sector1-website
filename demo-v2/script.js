/**
 * =========================================================================
 * CORE CLIENT JAVASCRIPT — UGR FILIALA SECTOR 1 BUCUREȘTI (REFINED MASTER)
 * =========================================================================
 * 1. SPA Routing & Navigare Hash (Acasă, Despre, Evenimente, Membri, Contact/FAQ)
 * 2. Meniu Mobil Drawer cu Închidere Automată & Stare Focus
 * 3. Calculator Geodezic Transversal Stereo 70 (EPSG:31700) ⇄ WGS84 Integrat
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

    // Ascunde toate secțiunile
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Afișează secțiunea țintă
    const targetSection = document.getElementById('view-' + viewId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
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
// 2. VITEZĂ PHOTO TICKER HERO (HERO MARQUEE)
// ═══════════════════════════════════════════════════════════════════════════

function setTickerSpeed(speed) {
    const ticker = document.getElementById('hero-photo-ticker');
    const btnCalm = document.getElementById('btn-speed-calm');
    const btnDyn = document.getElementById('btn-speed-dynamic');

    if (!ticker) return;

    if (speed === 'dynamic') {
        ticker.classList.add('dynamic');
        btnDyn?.classList.add('active');
        btnCalm?.classList.remove('active');
    } else {
        ticker.classList.remove('dynamic');
        btnCalm?.classList.add('active');
        btnDyn?.classList.remove('active');
    }
}

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
                    <div style="color: #fff; font-size: 10.5px;">Stereo 70 / EPSG:31700</div>
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

    if (myGlobe && typeof myGlobe.pointOfView === 'function') {
        myGlobe.pointOfView({ lat: node.lat, lng: node.lon, altitude: nodeKey === 'bucuresti' ? 0.32 : 0.36 }, 1200);
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
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. GLOB 3D WEBGL (THREE.JS + GLOBE.GL + SATELLIȚI + LASERE)
// ═══════════════════════════════════════════════════════════════════════════

let myGlobe = null;
let satellites = [];
let laserBeam = null;
let animationFrameId = null;

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

        svgWrapper.style.display = 'none';
        globeWrapper.style.display = 'block';

        if (!appState.globeInitialized) {
            init3DGlobe();
        }
    } else {
        btn2d.classList.add('active');
        btn2d.setAttribute('aria-selected', 'true');
        btn3d.classList.remove('active');
        btn3d.setAttribute('aria-selected', 'false');

        globeWrapper.style.display = 'none';
        svgWrapper.style.display = 'block';
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

    const pointsData = Object.keys(ugrData.mapNodes).map(key => {
        const node = ugrData.mapNodes[key];
        if (key === 'bucuresti') {
            return {
                id: key,
                name: '★ BUCUREȘTI — FILIALA SECTOR 1 (POL REGIONAL CAPITALĂ)',
                lat: node.lat,
                lng: node.lon,
                size: 0.38,
                color: '#00FFFF',
                altitude: 0.08
            };
        } else if (key === 'chisinau') {
            return {
                id: key,
                name: '◆ CHIȘINĂU — UTM (GAZDA INTERNAȚIONALĂ SGR)',
                lat: node.lat,
                lng: node.lon,
                size: 0.26,
                color: '#FF9F1C',
                altitude: 0.06
            };
        } else {
            return {
                id: key,
                name: `● ${node.name}`,
                lat: node.lat,
                lng: node.lon,
                size: 0.13,
                color: '#40B0F0',
                altitude: 0.04
            };
        }
    });

    myGlobe
        .pointsData(pointsData)
        .pointColor('color')
        .pointAltitude('altitude')
        .pointRadius('size')
        .pointLabel('name')
        .onPointClick(point => {
            selectNode(point.id);
        });

    const arcsData = Object.keys(ugrData.mapNodes)
        .filter(k => k !== 'bucuresti')
        .map(k => ({
            startLat: ugrData.mapNodes.bucuresti.lat,
            startLng: ugrData.mapNodes.bucuresti.lon,
            endLat: ugrData.mapNodes[k].lat,
            endLng: ugrData.mapNodes[k].lon,
            color: k === 'chisinau' ? ['#00FFFF', '#FF9F1C'] : ['#00FFFF', 'rgba(64, 176, 240, 0.6)']
        }));

    myGlobe
        .arcsData(arcsData)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(1600)
        .arcStroke(1.4);

    if (typeof bordersGeoJson !== 'undefined' && bordersGeoJson.features) {
        myGlobe
            .polygonsData(bordersGeoJson.features)
            .polygonCapColor(() => 'rgba(18, 125, 194, 0.22)')
            .polygonSideColor(() => 'rgba(0, 229, 255, 0.4)')
            .polygonStrokeColor(() => 'rgba(0, 229, 255, 0.85)')
            .polygonAltitude(0.015);
    }

    myGlobe.pointOfView({ lat: 45.8, lng: 25.0, altitude: 2.2 }, 0);
    setTimeout(() => {
        myGlobe.pointOfView({ lat: 45.8, lng: 25.0, altitude: 0.38 }, 1600);
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

    function buildSatelliteMesh() {
        const satGroup = new THREE.Group();

        const cylGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.4, 8);
        const cylMat = new THREE.MeshStandardMaterial({
            color: 0xE2E8F0,
            metalness: 0.85,
            roughness: 0.2
        });
        const cylMesh = new THREE.Mesh(cylGeom, cylMat);
        cylMesh.rotation.x = Math.PI / 2;
        satGroup.add(cylMesh);

        const panelGeom = new THREE.BoxGeometry(0.2, 1.4, 4.2);
        const panelMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
        
        const leftP = new THREE.Mesh(panelGeom, panelMat);
        leftP.position.x = -2.3;
        const rightP = new THREE.Mesh(panelGeom, panelMat);
        rightP.position.x = 2.3;

        satGroup.add(leftP);
        satGroup.add(rightP);

        return satGroup;
    }

    const orbitConfigs = [
        { inclination: 0.22, speed: 0.0035, height: 10, startAngle: 0 },
        { inclination: -0.18, speed: 0.0022, height: -14, startAngle: 2.1 },
        { inclination: 0.40, speed: 0.0028, height: 22, startAngle: 4.3 }
    ];

    satellites = [];

    orbitConfigs.forEach(cfg => {
        const satMesh = buildSatelliteMesh();
        scene.add(satMesh);

        const orbitPts = [];
        for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.1) {
            const x = orbitRadius * Math.cos(a);
            const z = orbitRadius * Math.sin(a);
            const y = cfg.height * Math.sin(a) + Math.cos(a) * cfg.inclination * 10;
            orbitPts.push(new THREE.Vector3(x, y, z));
        }
        const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPts);
        const orbitMat = new THREE.LineBasicMaterial({
            color: 0x00E5FF,
            transparent: true,
            opacity: 0.08
        });
        const orbitLine = new THREE.Line(orbitGeom, orbitMat);
        scene.add(orbitLine);

        satellites.push({
            mesh: satMesh,
            angle: cfg.startAngle,
            speed: cfg.speed,
            height: cfg.height,
            inclination: cfg.inclination
        });
    });

    const laserMat = new THREE.LineBasicMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.75
    });

    function updateLaserTracking() {
        const activeNodeKey = appState.selectedNode || 'bucuresti';
        const node = ugrData.mapNodes[activeNodeKey];

        if (node && satellites.length > 0 && typeof myGlobe.getCoords === 'function') {
            const targetCoords = myGlobe.getCoords(node.lat, node.lon, 0.06);

            let nearestSat = satellites[0];
            let minDist = Infinity;
            const targetVec = new THREE.Vector3(targetCoords.x, targetCoords.y, targetCoords.z);

            satellites.forEach(sat => {
                const dist = sat.mesh.position.distanceTo(targetVec);
                if (dist < minDist) {
                    minDist = dist;
                    nearestSat = sat;
                }
            });

            const beamPoints = [
                nearestSat.mesh.position,
                targetVec
            ];

            if (!laserBeam) {
                const geom = new THREE.BufferGeometry().setFromPoints(beamPoints);
                laserBeam = new THREE.Line(geom, laserMat);
                scene.add(laserBeam);
            } else {
                laserBeam.geometry.setFromPoints(beamPoints);
                laserBeam.geometry.attributes.position.needsUpdate = true;
                laserBeam.visible = true;
            }
        } else if (laserBeam) {
            laserBeam.visible = false;
        }
    }

    function animateSatellites() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            satellites.forEach(sat => {
                const x = orbitRadius * Math.cos(sat.angle);
                const z = orbitRadius * Math.sin(sat.angle);
                const y = sat.height * Math.sin(sat.angle) + Math.cos(sat.angle) * sat.inclination * 10;
                sat.mesh.position.set(x, y, z);
            });
            updateLaserTracking();
            return;
        }

        animationFrameId = requestAnimationFrame(animateSatellites);

        satellites.forEach(sat => {
            sat.angle += sat.speed;
            const x = orbitRadius * Math.cos(sat.angle);
            const z = orbitRadius * Math.sin(sat.angle);
            const y = sat.height * Math.sin(sat.angle) + Math.cos(sat.angle) * sat.inclination * 10;
            sat.mesh.position.set(x, y, z);
            sat.mesh.rotation.y += 0.015;
        });

        updateLaserTracking();
    }

    animateSatellites();

    // Re-check animation if user changes preference at runtime
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (!e.matches && appState.globeInitialized) {
            animateSatellites();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CALCULATOR STEREO 70 (EPSG:31700) ⇄ WGS84
// ═══════════════════════════════════════════════════════════════════════════

function initProj4() {
    if (typeof proj4 !== 'undefined') {
        proj4.defs(
            "EPSG:31700",
            "+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 +ellps=krass +towgs84=2.3287,-147.0425,-92.0802,0.3092483,0.3248218,-0.4973001,5.68906266 +units=m +no_defs"
        );
    }
}

function calculateCoordinates(event) {
    if (event) event.preventDefault();

    const xNord = parseFloat(document.getElementById('coord-x').value);
    const yEst = parseFloat(document.getElementById('coord-y').value);

    if (isNaN(xNord) || isNaN(yEst)) {
        alert("Vă rugăm să introduceți valori numerice valide pentru coordonatele X și Y.");
        return;
    }

    try {
        // [Est, Nord] conform standardului GIS
        const [lon, lat] = proj4("EPSG:31700", "WGS84", [yEst, xNord]);

        const resultBox = document.getElementById('calc-result-box');
        const resLat = document.getElementById('res-lat');
        const resLon = document.getElementById('res-lon');

        if (resLat) resLat.innerText = `${lat.toFixed(6)}° (${formatDMS(lat, 'lat')})`;
        if (resLon) resLon.innerText = `${lon.toFixed(6)}° (${formatDMS(lon, 'lon')})`;

        if (resultBox) {
            resultBox.style.display = 'flex';
        }
    } catch (err) {
        console.error("Eroare transformare geodezică:", err);
        alert("Eroare la calcularea proiecției. Verificați valorile introduse.");
    }
}

function fillExampleCoords(preset = 'central') {
    if (preset === 'sector1') {
        // Exemplu Sector 1 (Piața Victoriei / Arcul de Triumf)
        document.getElementById('coord-x').value = '328733.315';
        document.getElementById('coord-y').value = '586483.430';
    } else {
        // Sediul Central UGR (Lacul Tei 124)
        document.getElementById('coord-x').value = '334250.125';
        document.getElementById('coord-y').value = '591240.850';
    }
    calculateCoordinates();
}

function formatDMS(deg, type) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    let direction = (type === 'lat') ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'V');
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. RENDARE DINAMICĂ A DATELOR DIN DATA.JS
// ═══════════════════════════════════════════════════════════════════════════

function renderMembersTable(members) {
    const tbody = document.getElementById('members-table-body');
    if (!tbody) return;

    if (!members || members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--ugr-text-muted);">Nu a fost găsit niciun membru conform criteriilor de căutare.</td></tr>`;
        return;
    }

    tbody.innerHTML = members.map(m => `
        <tr style="border-bottom: 1px solid rgba(11,46,78,0.08); transition: background 0.15s ease;">
            <td style="padding: 14px 16px; font-family: var(--font-mono); font-weight: 600; color: var(--ugr-accent);">${m.id}</td>
            <td style="padding: 14px 16px; font-weight: 600; color: var(--ugr-text-main);">${m.name}</td>
            <td style="padding: 14px 16px; color: var(--ugr-text-muted);">${m.judet}</td>
            <td style="padding: 14px 16px; font-family: var(--font-mono); font-size: 12px; color: var(--ugr-text-main);">${m.auth}</td>
            <td style="padding: 14px 16px;">
                <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: var(--font-mono); background: rgba(16,185,129,0.15); color: #065F46; border: 1px solid rgba(16,185,129,0.3);">
                    ✓ ${m.status.toUpperCase()}
                </span>
            </td>
        </tr>
    `).join('');
}

function filterMembers() {
    const searchVal = (document.getElementById('member-search-input')?.value || '').toLowerCase().trim();
    const countyVal = document.getElementById('member-county-select')?.value || 'toate';

    const filtered = ugrData.membersList.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchVal) || m.auth.toLowerCase().includes(searchVal) || m.id.toLowerCase().includes(searchVal);
        const matchesCounty = (countyVal === 'toate') || (m.judet === countyVal);
        return matchesSearch && matchesCounty;
    });

    renderMembersTable(filtered);
}

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
                <div class="event-scope-ribbon ${badgeClass}">
                    <span class="${dotClass}"></span>
                    <span>${item.scopeLabel || (isNational ? '[EVENIMENT NAȚIONAL UGR / FIG / CLGE]' : '[ACTIVITATE LOCALĂ FILIALA SECTOR 1]')}</span>
                </div>
            </div>
            <div class="bento-card-content">
                <div class="bento-meta">
                    <span class="bento-cat-text">${item.category}</span>
                    <span class="bento-date-text">${item.date}</span>
                </div>
                <h3 class="bento-card-title">${item.title}</h3>
                <p class="bento-card-desc">${item.desc}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--ugr-border); padding-top: 14px; margin-top: auto; flex-wrap: wrap; gap: 8px;">
                    <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ugr-accent-light);">📍 ${item.location}</span>
                    <a href="${item.source.url}" ${targetAttr} style="font-family: var(--font-mono); font-size: 11px; color: ${isNational ? 'var(--ugr-hq-gold-bright)' : 'var(--ugr-cyan)'}; font-weight: 600;">
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
});
