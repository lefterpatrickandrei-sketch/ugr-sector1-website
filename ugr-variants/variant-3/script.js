// State-ul aplicației
        const state = {
            activeSection: 'home',
            modalStep: 1,
            selectedMemberType: 'profesionist'
        };



        // ==================================================================
        // Map nodes — Real geographical lat/lon coordinates
        // Colors: royal blue (#1D4ED8) for branches, crimson red (#e11d48) for active HQ
        // ==================================================================
        const mapNodes = {
            bucuresti:  { name: "București",      lat: 44.4323, lon: 26.1063, latStr: "44°26'08\"", lonStr: "26°06'12\"", desc: "Sediul Central administrativ și principalul nod legislativ în parteneriat cu ANCPI." },
            cluj:       { name: "Cluj-Napoca",     lat: 46.7712, lon: 23.6236, latStr: "46°46'18\"", lonStr: "23°35'47\"", desc: "Nod academic intens în Transilvania și organizator regional." },
            iasi:       { name: "Iași",            lat: 47.1585, lon: 27.6014, latStr: "47°09'44\"", lonStr: "27°35'20\"", desc: "Filială regională importantă conectată cu zona geodezică din Est." },
            constanta:  { name: "Constanța",       lat: 44.1792, lon: 28.6498, latStr: "44°10'42\"", lonStr: "28°38'30\"", desc: "Specializată pe proiecții costiere, marină și lucrări de infrastructură portuară." },
            timisoara:  { name: "Timișoara",       lat: 45.7537, lon: 21.2257, latStr: "45°45'13\"", lonStr: "21°13'43\"", desc: "Gazdă periodică a simpozioanelor și centru universitar geodezic de prestigiu." },
            chisinau:   { name: "Chișinău (UTM)",  lat: 47.0012, lon: 28.8514, latStr: "47°01'12\"", lonStr: "28°51'14\"", desc: "Filială internațională recent înființată la Universitatea Tehnică a Moldovei." }
        };

        const skillMapping = {
            toate: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
            lidar: ["bucuresti", "cluj", "timisoara"],
            gnss: ["bucuresti", "cluj", "iasi", "timisoara"],
            cadastru: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
            gis: ["bucuresti", "cluj", "iasi", "chisinau"],
            nivelment: ["bucuresti", "constanta", "timisoara"]
        };

        // ==================================================================
        // GLOBE.GL â€” Swiss Corporate Theme (Blue/Crimson Theme)
        // ==================================================================
        let myGlobe;

        function initGlobeMap() {
            const container = document.getElementById('3d-globe-container');
            if (!container) return;

            const w = container.clientWidth || 380;
            const h = container.clientHeight || 280;

            // Initialize Globe (restore earth-dark and topology images)
            myGlobe = Globe()(container)
                .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
                .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
                .backgroundColor('rgba(0,0,0,0)')
                .showAtmosphere(true)
                .atmosphereColor('#1D4ED8') // Corporate Royal Blue
                .atmosphereAltitude(0.15)
                .showGraticules(true) // grid lines on the globe
                .width(w)
                .height(h);

            // Style the globe shell to look like dark translucent royal-blue-tinted glass
            myGlobe.globeMaterial().color.set('#040914');

            // Set points data - HQ in crimson red, branches in royal blue
            const gData = Object.keys(mapNodes).map(key => ({
                id: key,
                name: key === 'bucuresti' ? '★ SEDIU CENTRAL (HQ) — București' : mapNodes[key].name,
                lat: mapNodes[key].lat,
                lng: mapNodes[key].lon,
                size: key === 'bucuresti' ? 0.25 : 0.12,
                color: key === 'bucuresti' ? '#e11d48' : '#1D4ED8'
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

            // Initial geodetic connection arcs from Bucharest to other active nodes (thinner lines)
            const initialArcs = Object.keys(mapNodes)
                .filter(key => key !== 'bucuresti')
                .map(key => ({
                    startLat: mapNodes.bucuresti.lat,
                    startLng: mapNodes.bucuresti.lon,
                    endLat: mapNodes[key].lat,
                    endLng: mapNodes[key].lon,
                    color: '#1D4ED8' // Royal Blue connection line
                }));

            myGlobe
                .arcsData(initialArcs)
                .arcColor('color')
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(1500)
                .arcStroke(0.5); // much thinner line for precision feel

            // Load Romania & Moldova GeoJSON borders from local borders.js
            myGlobe
                .polygonsData(bordersGeoJson.features)
                .polygonCapColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(29, 78, 216, 0.18)';
                    }
                    return 'rgba(255, 255, 255, 0.010)';
                })
                .polygonSideColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(29, 78, 216, 0.30)';
                    }
                    return 'rgba(255, 255, 255, 0.015)';
                })
                .polygonStrokeColor(d => {
                    const admin = d.properties.ADMIN;
                    if (admin === 'Romania' || admin === 'Moldova') {
                        return 'rgba(29, 78, 216, 0.80)';
                    }
                    return 'rgba(29, 78, 216, 0.08)';
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

            // Controls setup
            const controls = myGlobe.controls();
            controls.autoRotate = false;
            controls.enableZoom = true;
            controls.enablePan = false; // keep centered on Romania
            controls.minDistance = 115;
            controls.maxDistance = 500;

            // Cinematic entry animation: start far, zoom into Romania (closer zoom focused on Romania + Moldova)
            myGlobe.pointOfView({ lat: 20, lng: 0, altitude: 3.2 }, 0);
            setTimeout(() => {
                myGlobe.pointOfView({ lat: 45.8, lng: 25.5, altitude: 0.24 }, 2500);
            }, 600);

            // Resize listener
            window.addEventListener('resize', () => {
                myGlobe.width(container.clientWidth || 380);
                myGlobe.height(container.clientHeight || 280);
            });
        }

        // Initialize on DOM ready
        document.addEventListener('DOMContentLoaded', () => {
            initGlobeMap();
        });

        // ==================================================================
        // Filter map by skill — update node visibility and connections
        // ==================================================================
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
                        ? (isActive ? '#e11d48' : 'rgba(225, 29, 72, 0.4)') 
                        : (isActive ? '#1D4ED8' : 'rgba(29, 78, 216, 0.25)')
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
                        color: '#1D4ED8'
                    });
                }
            });
            myGlobe.arcsData(arcs)
                .arcColor('color')
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(1500)
                .arcStroke(0.8);

            // Update details panel
            if (activeNodes.length > 0 && selectedSkill !== 'toate') {
                showNodeDetails(activeNodes[0]);
            } else {
                document.getElementById('node-details-panel').classList.add('hidden');
                document.getElementById('node-prompt').classList.remove('hidden');
                myGlobe.pointOfView({ lat: 45.8, lng: 25.5, altitude: 0.24 }, 800);
            }
        }

        // ==================================================================
        // Show node details — highlight selected node and fly to it
        // ==================================================================
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
                        color: '#e11d48'
                    }])
                    .arcColor('color')
                    .arcDashLength(0.4)
                    .arcDashGap(0.2)
                    .arcDashAnimateTime(1500)
                    .arcStroke(0.8);
                } else {
                    myGlobe.arcsData([]);
                }
            }
        }

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

        // Caseta de Sugestii - Salvare in localStorage
        function handleSuggestionSubmission(event) {
            event.preventDefault();
            const suggestionText = document.getElementById('suggestion-mesaj').value.trim();
            if (!suggestionText) return;

            let suggestions = [];
            try {
                const stored = localStorage.getItem('ugr_suggestions');
                if (stored) suggestions = JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }

            const newSuggestion = {
                text: suggestionText,
                date: new Date().toLocaleString('ro-RO')
            };
            suggestions.push(newSuggestion);
            localStorage.setItem('ugr_suggestions', JSON.stringify(suggestions));

            document.getElementById('suggestion-success-msg').classList.remove('hidden');
            document.getElementById('suggestion-mesaj').value = '';
            
            // Reload suggestions list if open
            if (!document.getElementById('admin-suggestions-container').classList.contains('hidden')) {
                loadAdminSuggestions();
            }

            setTimeout(() => {
                document.getElementById('suggestion-success-msg').classList.add('hidden');
            }, 3000);
        }

        function loadAdminSuggestions() {
            const container = document.getElementById('admin-suggestions-container');
            const clearBtn = document.getElementById('btn-clear-suggestions');
            if (!container) return;

            let suggestions = [];
            try {
                const stored = localStorage.getItem('ugr_suggestions');
                if (stored) suggestions = JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }

            if (suggestions.length === 0) {
                container.innerHTML = '<p class="text-ink/40 italic">Nicio sugestie trimisă momentan.</p>';
                if (clearBtn) clearBtn.classList.add('hidden');
            } else {
                container.innerHTML = suggestions.map((s, idx) => `
                    <div class="p-2 border-b border-ink/5 last:border-b-0">
                        <div class="flex justify-between text-[9px] text-ink/40 mb-1">
                            <span>#${idx + 1}</span>
                            <span>${s.date}</span>
                        </div>
                        <p class="whitespace-pre-line text-ink/80">${s.text}</p>
                    </div>
                `).join('');
                if (clearBtn) clearBtn.classList.remove('hidden');
            }
        }

        function toggleAdminSuggestions() {
            const container = document.getElementById('admin-suggestions-container');
            const clearBtn = document.getElementById('btn-clear-suggestions');
            if (!container) return;

            if (container.classList.contains('hidden')) {
                loadAdminSuggestions();
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
                if (clearBtn) clearBtn.classList.add('hidden');
            }
        }

        function clearSuggestions() {
            if (confirm("Sigur doriți să ștergeți toate sugestiile salvate?")) {
                localStorage.removeItem('ugr_suggestions');
                loadAdminSuggestions();
            }
        }

        // Modal înscriere multi-step
        function openRegistrationModal() {
            document.getElementById('registration-modal').classList.remove('hidden');
            state.modalStep = 1;
            updateModalStepUI();
        }

        // Close Modal
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

        // Select Member Type
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

        // Update step UI
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

        // Next Step
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

        // Prev Step
        function prevModalStep() {
            if (state.modalStep > 1) {
                state.modalStep--;
                updateModalStepUI();
            }
        }

        // Type Text
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

        // Stagger Group Reveal
        document.addEventListener('DOMContentLoaded', () => {
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