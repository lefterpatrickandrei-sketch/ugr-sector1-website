// State-ul aplicației
        const state = {
            activeSection: 'home',
            modalStep: 1,
            selectedMemberType: 'profesionist'
        };

        const mapNodes = {
            bucuresti: { name: "București", lat: "44°26'08\"", lon: "26°06'12\"", desc: "Sediul Central administrativ și principalul nod legislativ în parteneriat cu ANCPI." },
            cluj: { name: "Cluj-Napoca", lat: "46°46'18\"", lon: "23°35'47\"", desc: "Nod academic intens în Transilvania și organizator regional." },
            iasi: { name: "Iași", lat: "47°09'44\"", lon: "27°35'20\"", desc: "Filială regională importantă conectată cu zona geodezică din Est." },
            constanta: { name: "Constanța", lat: "44°10'42\"", lon: "28°38'30\"", desc: "Specializată pe proiecții costiere, marină și lucrări de infrastructură portuară." },
            timisoara: { name: "Timișoara", lat: "45°45'13\"", lon: "21°13'43\"", desc: "Gazdă periodică a simpozioanelor și centru universitar geodezic de prestigiu." },
            chisinau: { name: "Chișinău (UTM)", lat: "47°01'12\"", lon: "28°51'14\"", desc: "Filială internațională recent înființată la Universitatea Tehnică a Moldovei." }
        };

        const skillMapping = {
            toate: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
            lidar: ["bucuresti", "cluj", "timisoara"],
            gnss: ["bucuresti", "cluj", "iasi", "timisoara"],
            cadastru: ["bucuresti", "cluj", "iasi", "constanta", "timisoara", "chisinau"],
            gis: ["bucuresti", "cluj", "iasi", "chisinau"],
            nivelment: ["bucuresti", "constanta", "timisoara"]
        };

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

        // Filtrarea dinamică a hărții în funcție de skill-ul selectat
        function filterMapBySkill() {
            const selectedSkill = document.getElementById('skill-selector').value;
            const activeNodes = skillMapping[selectedSkill];

            Object.keys(mapNodes).forEach(nodeId => {
                const nodeElement = document.getElementById('node-' + nodeId);
                const lineElement = document.getElementById('line-' + nodeId);
                
                if (nodeElement) {
                    const innerCircle = nodeElement.querySelector('circle:first-child');
                    const pulseCircle = nodeElement.querySelector('.node-pulse');

                    if (activeNodes.includes(nodeId)) {
                        innerCircle.setAttribute('fill', '#40b0f0');
                        innerCircle.setAttribute('r', '5.5');
                        if (pulseCircle) {
                            pulseCircle.classList.remove('hidden');
                        }
                        if (lineElement) {
                            lineElement.style.opacity = '1.0';
                            lineElement.style.stroke = 'rgba(28, 163, 236, 0.6)';
                        }
                    } else {
                        innerCircle.setAttribute('fill', 'rgba(28, 163, 236, 0.25)');
                        innerCircle.setAttribute('r', '4');
                        if (pulseCircle) {
                            pulseCircle.classList.add('hidden');
                        }
                        if (lineElement) {
                            lineElement.style.opacity = '0.15';
                            lineElement.style.stroke = 'rgba(251, 248, 242, 0.1)';
                        }
                    }
                }
            });

            if (activeNodes.length > 0 && selectedSkill !== 'toate') {
                showNodeDetails(activeNodes[0]);
            } else {
                document.getElementById('node-details-panel').classList.add('hidden');
                document.getElementById('node-prompt').classList.remove('hidden');
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
            document.getElementById('node-coords').innerText = node.lat + " / " + node.lon;
            document.getElementById('node-desc').innerText = node.desc;
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

        /* ---- Reveal la scroll ---- */
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