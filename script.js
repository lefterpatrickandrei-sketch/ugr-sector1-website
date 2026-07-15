// State-ul aplicației
        const state = {
            activeSection: 'home',
            modalStep: 1,
            selectedMemberType: 'profesionist'
        };

        const mapNodes = ugrData.mapNodes || {};
        const skillMapping = ugrData.skillMapping || {};

        // Activare vizualizare (Routing)
        function navigateTo(sectionId) {
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.add('hidden');
            });

            const targetSection = document.getElementById('view-' + sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }

            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('data-view') === sectionId) {
                    link.classList.remove('text-chalk/75', 'hover:text-chalk');
                    link.classList.add('text-brass-light');
                } else {
                    link.classList.remove('text-brass-light');
                    link.classList.add('text-chalk/75', 'hover:text-chalk');
                }
            });

            state.activeSection = sectionId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Toggle Meniu Mobil
        function toggleMobileMenu() {
            const dropdown = document.getElementById('mobile-dropdown');
            const bar1 = document.getElementById('mobile-bar-1');
            const bar2 = document.getElementById('mobile-bar-2');
            const bar3 = document.getElementById('mobile-bar-3');

            if (dropdown.classList.contains('max-h-0')) {
                dropdown.classList.remove('max-h-0');
                dropdown.classList.add('max-h-[380px]');
                bar1.classList.add('rotate-45', 'translate-y-[7.5px]');
                bar2.classList.add('opacity-0');
                bar3.classList.add('-rotate-45', '-translate-y-[7.5px]');
            } else {
                dropdown.classList.add('max-h-0');
                dropdown.classList.remove('max-h-[380px]');
                bar1.classList.remove('rotate-45', 'translate-y-[7.5px]');
                bar2.classList.remove('opacity-0');
                bar3.classList.remove('-rotate-45', '-translate-y-[7.5px]');
            }
        }

        let myGlobe;

        function initGlobeMap() {
            const container = document.getElementById('3d-globe-container');
            if (!container) return;

            const w = container.clientWidth || 380;
            const h = container.clientHeight || 280;

            // Initialize Globe
            myGlobe = Globe()(container)
                .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
                .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
                .backgroundColor('rgba(0,0,0,0)')
                .showAtmosphere(true)
                .atmosphereColor('#40b0f0') // Sky Blue
                .atmosphereAltitude(0.15)
                .showGraticules(true)
                .width(w)
                .height(h);

            // Style the globe shell to look like dark translucent blue-tinted glass
            myGlobe.globeMaterial().color.set('#040d1a');

            // Set points data - HQ in orange, branches in sky blue
            const gData = Object.keys(mapNodes).map(key => ({
                id: key,
                name: key === 'bucuresti' ? '★ SEDIU CENTRAL (HQ) — București' : mapNodes[key].name,
                lat: mapNodes[key].lat,
                lng: mapNodes[key].lon,
                size: key === 'bucuresti' ? 0.25 : 0.12,
                color: key === 'bucuresti' ? '#ff9f1c' : '#40b0f0'
            }));

            myGlobe
                .pointsData(gData)
                .pointColor('color')
                .pointAltitude(0.06)
                .pointRadius('size')
                .pointsMerge(false)
                .pointLabel('name')
                .onPointClick(point => {
                    showNodeDetails(point.id);
                    const sel = document.getElementById('skill-selector');
                    if (sel) sel.value = 'toate';
                });

            // Set initial arcs from HQ to all branches
            const initialArcs = Object.keys(mapNodes)
                .filter(key => key !== 'bucuresti')
                .map(key => ({
                    startLat: mapNodes.bucuresti.lat,
                    startLng: mapNodes.bucuresti.lon,
                    endLat: mapNodes[key].lat,
                    endLng: mapNodes[key].lon,
                    color: '#40b0f0'
                }));
            myGlobe
                .arcsData(initialArcs)
                .arcColor('color')
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(1500)
                .arcStroke(1.2);

            // Load Romania & Moldova GeoJSON borders
            myGlobe
                .polygonsData(bordersGeoJson.features)
                .polygonCapColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(64, 176, 240, 0.20)';
                    }
                    return 'rgba(255, 255, 255, 0.015)';
                })
                .polygonSideColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(64, 176, 240, 0.35)';
                    }
                    return 'rgba(255, 255, 255, 0.02)';
                })
                .polygonStrokeColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(64, 176, 240, 0.85)';
                    }
                    return 'rgba(255, 255, 255, 0.08)';
                })
                .polygonAltitude(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 0.012;
                    }
                    return 0.002;
                })
                .polygonLabel(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return `<b>${admin}</b>`;
                    }
                    return admin;
                });

            // Start far away, then zoom in after globe is ready
            myGlobe.pointOfView({ lat: 46.0, lng: 25.0, altitude: 3.5 }, 0);

            // Wait for globe to fully render, then do cinematic zoom (closer zoom focused on Romania + Moldova)
            setTimeout(() => {
                myGlobe.pointOfView({ lat: 46.0, lng: 25.5, altitude: 0.24 }, 2500);
            }, 1500);

            // Controls - NO autoRotate (keeps Romania centered)
            const controls = myGlobe.controls();
            controls.autoRotate = false;
            controls.enableZoom = true;
            controls.enablePan = false;
            controls.minDistance = 115;
            controls.maxDistance = 500;

            // Access underlying Three.js scene of Globe.gl
            const scene = myGlobe.scene();
            const satellites = [];
            const orbitRadius = 142; // Earth radius on globe is approx 100

            // Custom Three.js satellite model geometry builder
            function createSatelliteMesh() {
                const group = new THREE.Group();
                
                // Body
                const bodyGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 8);
                const bodyMat = new THREE.MeshStandardMaterial({
                    color: 0x94A3B8,
                    metalness: 0.9,
                    roughness: 0.1
                });
                const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
                bodyMesh.rotation.x = Math.PI / 2;
                group.add(bodyMesh);
                
                // Solar panels
                const panelGeom = new THREE.BoxGeometry(0.2, 1.5, 4.5);
                const panelMat = new THREE.MeshBasicMaterial({ color: 0x40b0f0 });
                const leftPanel = new THREE.Mesh(panelGeom, panelMat);
                leftPanel.position.x = -2.2;
                const rightPanel = new THREE.Mesh(panelGeom, panelMat);
                rightPanel.position.x = 2.2;
                
                group.add(leftPanel);
                group.add(rightPanel);
                
                return group;
            }

            // Define 3 satellites with individual parameters (inclination, speed, orbit height)
            const orbits = [
                { inclination: 0.25, speed: 0.003, height: 8, startAngle: 0 },
                { inclination: -0.15, speed: 0.002, height: -12, startAngle: 2.2 },
                { inclination: 0.45, speed: 0.0025, height: 20, startAngle: 4.4 }
            ];

            orbits.forEach((orb) => {
                const satMesh = createSatelliteMesh();
                scene.add(satMesh);
                
                // Fine, low-opacity orbit line
                const orbitPoints = [];
                for (let a = 0; a <= 2 * Math.PI + 0.1; a += 0.1) {
                    const x = orbitRadius * Math.cos(a);
                    const z = orbitRadius * Math.sin(a);
                    const y = orb.height * Math.sin(a) + Math.cos(a) * orb.inclination * 10;
                    orbitPoints.push(new THREE.Vector3(x, y, z));
                }
                const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
                const orbitMat = new THREE.LineBasicMaterial({
                    color: 0x40b0f0,
                    transparent: true,
                    opacity: 0.05
                });
                const orbitLine = new THREE.Line(orbitGeom, orbitMat);
                scene.add(orbitLine);
                
                satellites.push({
                    mesh: satMesh,
                    angle: orb.startAngle,
                    speed: orb.speed,
                    height: orb.height,
                    inclination: orb.inclination
                });
            });

            // Single active laser beam definition
            let laserBeam;
            const laserMat = new THREE.LineBasicMaterial({
                color: 0x40b0f0,
                transparent: true,
                opacity: 0.7
            });

            function updateLaserBeam() {
                const selectedSkill = document.getElementById('skill-selector').value;
                const activeNodes = skillMapping[selectedSkill] || [];
                
                if (activeNodes.length > 0 && satellites.length > 0) {
                    let targetNodeId = activeNodes[0];
                    
                    const panel = document.getElementById('node-details-panel');
                    if (panel && !panel.classList.contains('hidden')) {
                        const nodeName = document.getElementById('node-name').innerText;
                        const matchedId = Object.keys(mapNodes).find(k => mapNodes[k].name === nodeName);
                        if (matchedId) targetNodeId = matchedId;
                    }
                    
                    const node = mapNodes[targetNodeId];
                    if (node) {
                        const targetCoords = myGlobe.getCoords(node.lat, node.lon, 0.06);
                        
                        let nearestSat = satellites[0];
                        let minDist = Infinity;
                        satellites.forEach(sat => {
                            const dist = sat.mesh.position.distanceTo(new THREE.Vector3(targetCoords.x, targetCoords.y, targetCoords.z));
                            if (dist < minDist) {
                                minDist = dist;
                                nearestSat = sat;
                            }
                        });
                        
                        const points = [
                            nearestSat.mesh.position,
                            new THREE.Vector3(targetCoords.x, targetCoords.y, targetCoords.z)
                        ];
                        
                        if (!laserBeam) {
                            const geom = new THREE.BufferGeometry().setFromPoints(points);
                            laserBeam = new THREE.Line(geom, laserMat);
                            scene.add(laserBeam);
                        } else {
                            laserBeam.geometry.setFromPoints(points);
                            laserBeam.geometry.attributes.position.needsUpdate = true;
                            laserBeam.visible = true;
                        }
                        return;
                    }
                }
                
                if (laserBeam) {
                    laserBeam.visible = false;
                }
            }

            // Satellites animation loop
            function animateSatellites() {
                requestAnimationFrame(animateSatellites);
                satellites.forEach(sat => {
                    sat.angle += sat.speed;
                    const x = orbitRadius * Math.cos(sat.angle);
                    const z = orbitRadius * Math.sin(sat.angle);
                    const y = sat.height * Math.sin(sat.angle) + Math.cos(sat.angle) * sat.inclination * 10;
                    sat.mesh.position.set(x, y, z);
                    sat.mesh.rotation.y += 0.01;
                });
                updateLaserBeam();
            }
            animateSatellites();

            // Responsive resize
            window.addEventListener('resize', () => {
                myGlobe.width(container.clientWidth || 380);
                myGlobe.height(container.clientHeight || 280);
            });
        }

        // Filtrarea dinamică a hărții în funcție de skill-ul selectat
        function filterMapBySkill() {
            const selectedSkill = document.getElementById('skill-selector').value;
            const activeNodes = skillMapping[selectedSkill];

            if (!myGlobe) return;

            // Highlight active nodes on the globe by updating color/size (specifically HQ)
            const updatedPoints = Object.keys(mapNodes).map(key => {
                const isActive = activeNodes.includes(key);
                const isHQ = key === 'bucuresti';
                return {
                    id: key,
                    name: isHQ ? '★ SEDIU CENTRAL (HQ) — București' : mapNodes[key].name,
                    lat: mapNodes[key].lat,
                    lng: mapNodes[key].lon,
                    size: isHQ ? (isActive ? 0.25 : 0.15) : (isActive ? 0.15 : 0.05),
                    color: isHQ 
                        ? (isActive ? '#ff9f1c' : 'rgba(255, 159, 28, 0.4)') 
                        : (isActive ? '#40b0f0' : 'rgba(64, 176, 240, 0.25)')
                };
            });
            myGlobe.pointsData(updatedPoints);

            // Draw geodetic connection arcs from Bucharest to other active nodes
            const arcs = [];
            activeNodes.forEach(nodeId => {
                if (nodeId !== 'bucuresti') {
                    arcs.push({
                        startLat: mapNodes.bucuresti.lat,
                        startLng: mapNodes.bucuresti.lon,
                        endLat: mapNodes[nodeId].lat,
                        endLng: mapNodes[nodeId].lon,
                        color: '#40b0f0'
                    });
                }
            });
            myGlobe.arcsData(arcs)
                .arcColor('color')
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(1500)
                .arcStroke(1.2);

            // Update details panel
            if (activeNodes.length > 0 && selectedSkill !== 'toate') {
                showNodeDetails(activeNodes[0]);
            } else {
                document.getElementById('node-details-panel').classList.add('hidden');
                document.getElementById('node-prompt').classList.remove('hidden');
                myGlobe.pointOfView({ lat: 46.0, lng: 25.5, altitude: 0.24 }, 800);
            }
        }

        // Harta interactivă - Afișare detalii nod
        function showNodeDetails(nodeId) {
            const node = mapNodes[nodeId];
            if (!node) return;

            document.getElementById('node-prompt').classList.add('hidden');
            
            const panel = document.getElementById('node-details-panel');
            panel.classList.remove('hidden');
            
            document.getElementById('node-name').innerText = node.name;
            document.getElementById('node-coords').innerText = node.latStr + " / " + node.lonStr;
            document.getElementById('node-desc').innerText = node.desc;

            // Fly to point on the globe (closer zoom for selected node)
            if (myGlobe) {
                myGlobe.pointOfView({ lat: node.lat, lng: node.lon, altitude: 0.18 }, 1000);
                
                // Draw connection arc
                if (nodeId !== 'bucuresti') {
                    myGlobe.arcsData([{
                        startLat: mapNodes.bucuresti.lat,
                        startLng: mapNodes.bucuresti.lon,
                        endLat: node.lat,
                        endLng: node.lon,
                        color: '#40b0f0'
                    }])
                    .arcColor('color')
                    .arcDashLength(0.4)
                    .arcDashGap(0.2)
                    .arcDashAnimateTime(1500)
                    .arcStroke(1.2);
                } else {
                    myGlobe.arcsData([]);
                }
            }
        }

        // Filtru dynamic tabel membri
        function filterMembersTable() {
            const searchValue = document.getElementById('member-search').value.toLowerCase();
            const countyValue = document.getElementById('member-county-filter').value;
            const rows = document.querySelectorAll('.member-row');
            let foundAny = false;

            rows.forEach(row => {
                const name = row.querySelector('.member-name').innerText.toLowerCase();
                const auth = row.querySelector('.member-auth').innerText.toLowerCase();
                const judet = row.getAttribute('data-judet');

                const matchesSearch = name.includes(searchValue) || auth.includes(searchValue);
                const matchesCounty = countyValue === 'Toate' || judet === countyValue;

                if (matchesSearch && matchesCounty) {
                    row.classList.remove('hidden');
                    foundAny = true;
                } else {
                    row.classList.add('hidden');
                }
            });

            const noMembersMsg = document.getElementById('no-members-msg');
            if (foundAny) {
                noMembersMsg.classList.add('hidden');
            } else {
                noMembersMsg.classList.remove('hidden');
            }
        }

        // Definim sistemul Stereo 70 (EPSG:31700) pentru proj4
        proj4.defs("EPSG:31700",
            "+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 " +
            "+ellps=krass +towgs84=33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84 " +
            "+units=m +no_defs"
        );

        function handleCoordinateConversion(event) {
            event.preventDefault();
            const xNord = parseFloat(document.getElementById('coord-x').value) || 0;
            const yEst = parseFloat(document.getElementById('coord-y').value) || 0;

            // Atenție: proj4 așteaptă ordinea [Est, Nord], nu [Nord, Est]
            const [lon, lat] = proj4("EPSG:31700", "WGS84", [yEst, xNord]);

            document.getElementById('res-lat').innerText = lat.toFixed(6);
            document.getElementById('res-lon').innerText = lon.toFixed(6);
            document.getElementById('coord-result-panel').classList.remove('hidden');
        }

        // Formular Contact simplificat
        function handleContactSubmission(event) {
            event.preventDefault();
            document.getElementById('contact-success-msg').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('contact-success-msg').classList.add('hidden');
                document.getElementById('contact-nume').value = '';
                document.getElementById('contact-email').value = '';
                document.getElementById('contact-mesaj').value = '';
            }, 3000);
        }

        // Modal înscriere multi-step
        function openRegistrationModal() {
            document.getElementById('registration-modal').classList.remove('hidden');
            state.modalStep = 1;
            updateModalStepUI();
        }

        function closeRegistrationModal() {
            document.getElementById('registration-modal').classList.add('hidden');
            document.getElementById('reg-nume').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-tel').value = '';
            document.getElementById('modal-error-banner').classList.add('hidden');
            document.getElementById('modal-success-screen').classList.add('hidden');
            document.getElementById('modal-fields-container').classList.remove('hidden');
            document.getElementById('modal-footer').classList.remove('hidden');
        }

        function selectMemberType(type) {
            state.selectedMemberType = type;
            const optProf = document.getElementById('opt-profesionist');
            const optStud = document.getElementById('opt-student');

            if (type === 'profesionist') {
                optProf.className = "p-4 rounded-lg border-2 border-brass bg-brass/5 cursor-pointer transition-all";
                optStud.className = "p-4 rounded-lg border-2 border-ink/10 hover:border-brass/35 cursor-pointer transition-all";
            } else {
                optProf.className = "p-4 rounded-lg border-2 border-ink/10 hover:border-brass/35 cursor-pointer transition-all";
                optStud.className = "p-4 rounded-lg border-2 border-brass bg-brass/5 cursor-pointer transition-all";
            }
        }

        function updateModalStepUI() {
            document.getElementById('modal-error-banner').classList.add('hidden');
            document.getElementById('modal-step-1-panel').classList.add('hidden');
            document.getElementById('modal-step-2-panel').classList.add('hidden');
            document.getElementById('modal-step-3-panel').classList.add('hidden');

            const prevBtn = document.getElementById('btn-modal-prev');
            const nextBtn = document.getElementById('btn-modal-next');
            const indicator = document.getElementById('modal-step-indicator');

            if (state.modalStep === 1) {
                document.getElementById('modal-step-1-panel').classList.remove('hidden');
                prevBtn.setAttribute('disabled', 'true');
                nextBtn.innerText = 'Înainte';
                indicator.innerText = 'Pasul 1 din 3';
            } else if (state.modalStep === 2) {
                document.getElementById('modal-step-2-panel').classList.remove('hidden');
                prevBtn.removeAttribute('disabled');
                nextBtn.innerText = 'Înainte';
                indicator.innerText = 'Pasul 2 din 3';
            } else if (state.modalStep === 3) {
                document.getElementById('modal-step-3-panel').classList.remove('hidden');
                prevBtn.removeAttribute('disabled');
                nextBtn.innerText = 'Finalizează Înregistrarea';
                indicator.innerText = 'Pasul 3 din 3';
            }
        }

        function nextModalStep() {
            if (state.modalStep === 1) {
                state.modalStep = 2;
                updateModalStepUI();
            } else if (state.modalStep === 2) {
                const nume = document.getElementById('reg-nume').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const tel = document.getElementById('reg-tel').value.trim();

                if (!nume || !email || !tel) {
                    const banner = document.getElementById('modal-error-banner');
                    banner.innerText = "Toate câmpurile sunt obligatorii.";
                    banner.classList.remove('hidden');
                    return;
                }

                state.modalStep = 3;
                updateModalStepUI();
            } else if (state.modalStep === 3) {
                document.getElementById('modal-fields-container').classList.add('hidden');
                document.getElementById('modal-footer').classList.add('hidden');
                document.getElementById('modal-success-screen').classList.remove('hidden');
                setTimeout(() => {
                    closeRegistrationModal();
                }, 4000);
            }
        }

        function prevModalStep() {
            if (state.modalStep > 1) {
                state.modalStep--;
                updateModalStepUI();
            }
        }

        /* ---- Efect de scriere live ---- */
        function typeText(el, text, speed) {
            el.textContent = '';
            el.classList.add('typing-cursor');
            let i = 0;
            (function step() {
                if (i <= text.length) {
                    el.textContent = text.slice(0, i);
                    i++;
                    setTimeout(step, speed);
                } else {
                    el.classList.remove('typing-cursor');
                }
            })();
        }

        // -------------------------------------------------------------------------
        // RENDERE DINAMICĂ ȘI APĂRARE CONSOLĂ (PENTRU NON-CODERS)
        // -------------------------------------------------------------------------

        function renderMembersTable() {
            const tbody = document.getElementById('members-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            const list = ugrData.membersList || [];
            list.forEach(member => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-paper/30 transition-colors member-row";
                tr.setAttribute('data-judet', member.judet || '');
                
                const statusColor = (member.status === 'Activ') ? 'bg-contour/15 text-contour' : 'bg-red-100 text-red-800';
                
                tr.innerHTML = `
                    <td class="p-4 font-mono text-xs font-semibold text-brass">${member.id || ''}</td>
                    <td class="p-4 font-semibold text-ink member-name">${member.name || ''}</td>
                    <td class="p-4 text-ink/75">${member.judet || ''}</td>
                    <td class="p-4 font-mono text-xs text-ink/60 member-auth">${member.auth || ''}</td>
                    <td class="p-4">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${statusColor}">● ${member.status || 'Inactiv'}</span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function renderLeadershipGrid() {
            const grid = document.getElementById('leadership-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            const list = ugrData.leadership || [];
            list.forEach(member => {
                const card = document.createElement('div');
                card.className = "border-t border-brass pt-6 space-y-4 flex flex-col md:flex-row items-center md:items-start gap-4";
                
                // Photo wrapper with strict sizing and cover fit to prevent distortion
                const imgPath = member.image || 'logo_geodez.png';
                const isPlaceholder = imgPath.includes('logo_geodez.png');
                const imgClass = isPlaceholder 
                    ? "w-16 h-16 object-contain opacity-50" 
                    : "w-20 h-20 object-cover rounded-full border border-brass/30 shadow-sm";
                
                card.innerHTML = `
                    <div class="flex-shrink-0 flex items-center justify-center ${isPlaceholder ? 'w-20 h-20 bg-ink/5 rounded-lg border border-ink/5' : ''}">
                        <img src="${imgPath}" alt="${member.name}" class="${imgClass}" onerror="this.src='logo_geodez.png'; this.className='w-16 h-16 object-contain opacity-50';" />
                    </div>
                    <div class="space-y-1 text-center md:text-left flex-grow">
                        <span class="font-mono text-[9px] uppercase tracking-wider text-contour font-bold block">${member.role || ''}</span>
                        <h3 class="font-serif text-[17px] font-bold text-ink leading-snug">${member.name || ''}</h3>
                        <p class="text-xs text-ink/65 leading-relaxed mt-1">${member.desc || ''}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function renderNewsGrid() {
            const grid = document.getElementById('news-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            const list = ugrData.newsList || [];
            list.forEach(article => {
                const card = document.createElement('article');
                card.className = "bg-chalk p-6 rounded-lg border border-ink/5 flex flex-col justify-between shadow-sm space-y-4 hover:border-brass/30 transition-all duration-300";
                
                const imgPath = article.image || 'logo_geodez.png';
                const isPlaceholder = imgPath.includes('logo_geodez.png');
                const imgClass = isPlaceholder 
                    ? "h-20 w-auto object-contain mx-auto opacity-30" 
                    : "w-full h-40 object-cover rounded-md mb-2";

                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="overflow-hidden rounded-md bg-ink/5 flex items-center justify-center ${isPlaceholder ? 'py-4' : ''}">
                            <img src="${imgPath}" alt="${article.title}" class="${imgClass}" onerror="this.src='logo_geodez.png'; this.className='h-20 w-auto object-contain mx-auto opacity-30';" />
                        </div>
                        <span class="text-[10px] font-mono uppercase tracking-wider text-contour font-bold">${article.category || ''}</span>
                        <h3 class="font-serif text-lg font-bold text-ink hover:text-brass transition-colors leading-snug">${article.title || ''}</h3>
                        <p class="text-xs text-ink/70 leading-relaxed">${article.desc || ''}</p>
                    </div>
                    <div class="pt-4 border-t border-ink/5 flex justify-between items-center text-[10px] font-mono text-ink/40 mt-4">
                        <span>${article.location || ''}</span>
                        <span>${article.date || ''}</span>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function renderDocumentsGrid() {
            const grid = document.getElementById('documents-grid');
            if (!grid) return;
            grid.innerHTML = '';
            
            const list = ugrData.documentsList || [];
            list.forEach(doc => {
                const card = document.createElement('div');
                card.className = "bg-chalk p-6 rounded-lg border border-ink/5 flex flex-col justify-between shadow-sm space-y-4 hover:border-brass/30 transition-all duration-300";
                
                card.innerHTML = `
                    <div class="space-y-2">
                        <div class="h-10 w-10 rounded-md bg-brass/10 flex items-center justify-center text-brass">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 class="font-serif text-sm font-bold text-ink leading-tight">${doc.title || ''}</h4>
                        <p class="text-xs text-ink/65 leading-relaxed">${doc.desc || ''}</p>
                    </div>
                    <div class="pt-2">
                        <a href="${doc.fileUrl || '#'}" target="_blank" rel="noopener" class="w-full py-2 bg-brass/10 hover:bg-brass text-ink font-mono text-[11px] font-bold uppercase rounded transition-colors text-center block">
                            Descarcă ${doc.format || ''} ↓
                        </a>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function setupVerificationLink() {
            const btn = document.getElementById('ancpi-verification-btn');
            if (btn) {
                btn.href = ugrData.ancpiVerificationLink || '#';
            }
        }

        /* ---- Reveal la scroll ---- */
        document.addEventListener('DOMContentLoaded', () => {
            initGlobeMap();
            
            // Apelare randări dinamice la încărcare
            renderMembersTable();
            renderLeadershipGrid();
            renderNewsGrid();
            renderDocumentsGrid();
            setupVerificationLink();

            const singleEls = document.querySelectorAll('.scroll-reveal');
            if (singleEls.length) {
                const singleObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            singleObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
                singleEls.forEach((el) => singleObserver.observe(el));
            }

            /* ---- Reveal secvențial generic pentru grupuri ---- */
            function initStaggerGroup(containerId, itemSelector, opts) {
                const container = document.getElementById(containerId);
                if (!container) return;
                const gap = (opts && opts.gap) || 480;
                const items = Array.from(container.querySelectorAll(itemSelector));
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            items.forEach((item, idx) => {
                                setTimeout(() => {
                                    item.classList.add('is-visible');
                                    if (opts && opts.typewriter) {
                                        const label = item.querySelector(opts.typewriter);
                                        const fullText = label ? label.getAttribute('data-text') : '';
                                        if (label && fullText) {
                                            setTimeout(() => typeText(label, fullText, 38), 650);
                                        }
                                    }
                                }, idx * gap);
                            });
                            obs.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.25, rootMargin: '0px 0px -40px 0px' });
                obs.observe(container);
            }

            initStaggerGroup('mission-stats-grid', '.stat-block', { gap: 550, typewriter: '.stat-label' });
            initStaggerGroup('footer-reveal-grid', '.footer-block', { gap: 220 });
        });