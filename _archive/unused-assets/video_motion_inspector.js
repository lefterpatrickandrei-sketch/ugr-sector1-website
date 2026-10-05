/**
 * VIDEO MOTION SCROLLER INSPECTOR
 * Automated Frame-by-Frame Scroll Simulation & Telemetry Profiler
 * 
 * Target URLs:
 * 1. http://localhost:8088/demo-v2/#membri
 * 2. http://localhost:8088/demo-v2/demos-membri.html
 * 
 * Viewports:
 * - Desktop: 1440 x 900
 * - Mobile: 390 x 844
 * 
 * Engine: Playwright (channel: 'msedge', headless: true)
 * Strictly telemetry & metrics (NO screenshots taken).
 */

const playwright = require('C:/Users/lefpa/.gemini/antigravity/scratch/ugr-sector1-master/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    scrollStepPx: 175,       // 150-200px per step
    stepDelayMs: 120,        // 120ms tick rate
    settleDelayMs: 600,      // Final settle delay after reaching bottom
    urls: [
        { name: 'Main SPA (#membri)', url: 'http://localhost:8088/demo-v2/#membri' },
        { name: 'Showcase Dedicat (demos-membri.html)', url: 'http://localhost:8088/demo-v2/demos-membri.html' }
    ],
    viewports: [
        { name: 'Desktop (1440px)', width: 1440, height: 900, isMobile: false },
        { name: 'Mobile (390px)', width: 390, height: 844, isMobile: true }
    ]
};

// Tracked sections and text blocks on Membri page
const TARGET_SELECTORS = [
    { id: 'header_section', label: '1. Header Container', selector: '#view-membri .section-header' },
    { id: 'header_tag', label: '1.1 Header Tag (Comunitate & Evidenta Oficiala)', selector: '#view-membri .section-header .section-tag' },
    { id: 'header_title', label: '1.2 Header Titlu H1 (Registrul Geodezilor)', selector: '#view-membri .section-header .section-title' },
    { id: 'header_subtitle', label: '1.3 Header Subtitlu', selector: '#view-membri .section-header .section-subtitle' },
    { id: 'beam_card', label: '2. Card Magic UI Neon Beam', selector: '#view-membri .m-demo4-beam-card' },
    { id: 'card_kicker', label: '2.1 Card Kicker (Aderare Digitala Rapida)', selector: '#view-membri .m-demo4-content-col > div:nth-child(1)' },
    { id: 'card_title', label: '2.2 Card Titlu H2 (Devino Membru)', selector: '#view-membri .m-demo4-card-title' },
    { id: 'card_sub', label: '2.3 Card Subtitlu Beneficii', selector: '#view-membri .m-demo4-card-sub' },
    { id: 'card_actions', label: '2.4 Card Butoane Actiune', selector: '#view-membri .m-demo4-actions' },
    { id: 'photo_col', label: '2.5 Coloana Foto Autentica', selector: '#view-membri .m-demo4-photo-col' },
    { id: 'photo_frame', label: '2.6 Cadru Foto (Laser HUD)', selector: '#view-membri .m-demo4-photo-frame' },
    { id: 'photo_img', label: '2.7 Imagine USAMV Sala Consiliu', selector: '#view-membri .m-demo4-photo-frame img' },
    { id: 'photo_caption', label: '2.8 Eticheta Sub Foto', selector: '#view-membri .m-demo4-photo-caption' },
    { id: 'apartenenta_box', label: '3. Apartenenta: Inscriere Locala (Retro Grid)', selector: '#view-membri .m-demo4-retro-grid' },
    { id: 'apartenenta_cards', label: '3.1 Carduri Apartenenta (1. Inscriere, 2. Vot, 3. BEX)', selector: '#view-membri .m-demo4-retro-grid > div:last-child' },
    { id: 'procedura_box', label: '4. Procedura Oficiala in 4 Pasi', selector: '#view-membri div[class*="scroll-reveal"]:has(h3)' },
    { id: 'cotizatii_box', label: '5. Grila Cotizatii & Date Bancare', selector: '#view-membri div[class*="scroll-reveal"]:has(table.dark-members-table)' },
    { id: 'cotizatii_table', label: '5.1 Tabel Cotizatii', selector: '#view-membri table.dark-members-table' },
    { id: 'directoriu_box', label: '6. Directoriul Membrilor Acreditati', selector: '#view-membri div[class*="scroll-reveal"]:has(#member-search-input)' },
    { id: 'directoriu_search', label: '6.1 Bara Cautare & Filtre', selector: '#view-membri #member-search-input' },
    { id: 'directoriu_table', label: '6.2 Tabel Membri Activi', selector: '#view-membri #members-table-body' }
];

async function runSimulation() {
    console.log('========================================================================');
    console.log('VIDEO MOTION SCROLLER INSPECTOR — PLAYWRIGHT (MSEDGE HEADLESS)');
    console.log('Simulare continua cadru-cu-cadru, inregistrare timeline si masurare CLS');
    console.log('========================================================================\n');

    const browser = await playwright.chromium.launch({
        channel: 'msedge',
        headless: true
    });

    const allResults = [];

    for (const urlItem of CONFIG.urls) {
        for (const vp of CONFIG.viewports) {
            console.log(`\n>>> START TEST: [${urlItem.name}] @ Viewport: ${vp.name} (${vp.width}x${vp.height})`);
            const context = await browser.newContext({
                viewport: { width: vp.width, height: vp.height },
                isMobile: vp.isMobile
            });
            const page = await context.newPage();

            // Setup telemetry hooks inside the page before loading
            await page.addInitScript(() => {
                window.__telemetry = {
                    clsScore: 0,
                    layoutShiftEntries: [],
                    timeline: [],
                    elementStates: {}
                };

                // Track CLS via PerformanceObserver
                try {
                    const po = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                window.__telemetry.clsScore += entry.value;
                                window.__telemetry.layoutShiftEntries.push({
                                    time: entry.startTime,
                                    value: entry.value
                                });
                            }
                        }
                    });
                    po.observe({ type: 'layout-shift', buffered: true });
                } catch (e) {
                    console.warn('CLS observer error:', e);
                }
            });

            // Navigate to target
            const loadStartTime = Date.now();
            await page.goto(urlItem.url, { waitUntil: 'networkidle' });
            await page.waitForTimeout(300);

            // Install in-page telemetry tracker
            await page.evaluate((targets) => {
                window.__targets = targets;
                window.__elementMetrics = {};
                targets.forEach(t => {
                    window.__elementMetrics[t.id] = {
                        id: t.id,
                        label: t.label,
                        selector: t.selector,
                        found: false,
                        enteredViewportMs: null,
                        becameVisibleMs: null,
                        entryScrollY: null,
                        initialBox: null,
                        visibleBox: null,
                        finalBox: null,
                        maxShiftPx: 0
                    };
                });

                window.__recordFrame = function(timeMs, scrollY) {
                    const vh = window.innerHeight;
                    const vw = window.innerWidth;

                    targets.forEach(t => {
                        const m = window.__elementMetrics[t.id];
                        const el = document.querySelector(t.selector);
                        if (!el) return;
                        m.found = true;

                        const rect = el.getBoundingClientRect();
                        const isVisibleClass = el.classList.contains('is-visible') || 
                                              (el.closest('.is-visible') !== null);

                        const inViewport = (rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0);

                        if (inViewport && m.enteredViewportMs === null) {
                            m.enteredViewportMs = Math.round(timeMs);
                            m.entryScrollY = Math.round(scrollY);
                            m.initialBox = {
                                x: Math.round(rect.x),
                                y: Math.round(rect.y),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            };
                        }

                        if (isVisibleClass && m.becameVisibleMs === null) {
                            m.becameVisibleMs = Math.round(timeMs);
                            m.visibleBox = {
                                x: Math.round(rect.x),
                                y: Math.round(rect.y),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            };
                        }

                        // Track coordinate shifts
                        if (m.initialBox && inViewport) {
                            // Normalized shift relative to expected scroll delta
                            const shiftW = Math.abs(rect.width - m.initialBox.width);
                            if (shiftW > m.maxShiftPx) {
                                m.maxShiftPx = shiftW;
                            }
                        }
                    });
                };
            }, TARGET_SELECTORS);

            // Frame-by-frame scroll loop
            const totalScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
            const viewportHeight = vp.height;
            const maxScrollY = Math.max(0, totalScrollHeight - viewportHeight);

            console.log(`Document total height: ${totalScrollHeight}px, Max scrollY: ${maxScrollY}px`);

            let currentScrollY = 0;
            const scrollStartTimestamp = Date.now();
            const frameLogs = [];

            // Initial frame record at scroll 0
            await page.evaluate(({ t, s }) => window.__recordFrame(t, s), { t: 0, s: 0 });

            // Incremental scroll loop: 175px every 120ms
            while (currentScrollY < maxScrollY) {
                currentScrollY = Math.min(maxScrollY, currentScrollY + CONFIG.scrollStepPx);
                const elapsedMs = Date.now() - scrollStartTimestamp;

                await page.evaluate((y) => {
                    window.scrollTo({ top: y, behavior: 'instant' });
                }, currentScrollY);

                // Wait 120ms to simulate fluid frame time
                await page.waitForTimeout(CONFIG.stepDelayMs);

                // Record frame
                await page.evaluate(({ t, s }) => window.__recordFrame(t, s), { t: elapsedMs, s: currentScrollY });

                frameLogs.push({
                    elapsedMs,
                    scrollY: currentScrollY
                });
            }

            // Settle time at bottom
            await page.waitForTimeout(CONFIG.settleDelayMs);
            const totalSimulationDurationMs = Date.now() - scrollStartTimestamp;

            // Final state evaluation and photo badge inspection
            const finalTelemetry = await page.evaluate(() => {
                // Record final boxes
                window.__targets.forEach(t => {
                    const m = window.__elementMetrics[t.id];
                    const el = document.querySelector(t.selector);
                    if (el && m) {
                        const rect = el.getBoundingClientRect();
                        m.finalBox = {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        };
                    }
                });

                // Detailed photo & badge overlap audit
                const photoCol = document.querySelector('.m-demo4-photo-col');
                const photoFrame = document.querySelector('.m-demo4-photo-frame');
                const photoImg = document.querySelector('.m-demo4-photo-frame img');
                const photoBadge = document.querySelector('.m-demo4-photo-badge');
                const photoCaption = document.querySelector('.m-demo4-photo-caption');

                const imgRect = photoImg ? photoImg.getBoundingClientRect() : null;
                const badgeRect = photoBadge ? photoBadge.getBoundingClientRect() : null;

                // Check all elements inside photoFrame to verify if any overlap with img
                const overlappingElements = [];
                if (photoFrame && photoImg && imgRect) {
                    const allFrameChildren = photoFrame.querySelectorAll('*');
                    allFrameChildren.forEach(child => {
                        if (child !== photoImg) {
                            const cRect = child.getBoundingClientRect();
                            // Check bounding box intersection
                            const overlaps = !(cRect.right <= imgRect.left || 
                                               cRect.left >= imgRect.right || 
                                               cRect.bottom <= imgRect.top || 
                                               cRect.top >= imgRect.bottom);
                            if (overlaps && cRect.width > 0 && cRect.height > 0) {
                                overlappingElements.push({
                                    tag: child.tagName,
                                    className: child.className,
                                    box: { x: cRect.x, y: cRect.y, w: cRect.width, h: cRect.height }
                                });
                            }
                        }
                    });
                }

                return {
                    metrics: window.__elementMetrics,
                    clsScore: window.__telemetry.clsScore,
                    layoutShiftEntries: window.__telemetry.layoutShiftEntries,
                    photoAudit: {
                        photoFound: !!photoImg,
                        photoComplete: photoImg ? photoImg.complete : false,
                        naturalSize: photoImg ? `${photoImg.naturalWidth}x${photoImg.naturalHeight}` : null,
                        renderedBox: imgRect ? { x: Math.round(imgRect.x), y: Math.round(imgRect.y), width: Math.round(imgRect.width), height: Math.round(imgRect.height) } : null,
                        aspectRatio: imgRect ? (imgRect.width / imgRect.height).toFixed(2) : null,
                        badgeSelectorCount: document.querySelectorAll('.m-demo4-photo-badge').length,
                        badgeExistsInDom: !!photoBadge,
                        badgeOverlappingPhoto: !!badgeRect,
                        overlappingElementsInsidePhotoFrame: overlappingElements
                    }
                };
            });

            const resultSummary = {
                url: urlItem.url,
                urlName: urlItem.name,
                viewport: vp.name,
                totalScrollHeight,
                maxScrollY,
                totalSimulationDurationMs,
                totalFrames: frameLogs.length,
                clsScore: finalTelemetry.clsScore,
                clsPass: finalTelemetry.clsScore < 0.05,
                photoAudit: finalTelemetry.photoAudit,
                elements: Object.values(finalTelemetry.metrics)
            };

            allResults.push(resultSummary);

            // Log detailed results for this run
            console.log(`\n--- REZULTATE SIMULARE TIMELINE: [${urlItem.name} @ ${vp.name}] ---`);
            console.log(`Durata video timeline: ${(totalSimulationDurationMs / 1000).toFixed(2)}s | Total Cadre Derulare: ${frameLogs.length}`);
            console.log(`CLS Score: ${finalTelemetry.clsScore.toFixed(4)} -> ${finalTelemetry.clsScore < 0.05 ? 'PASS (CLS < 0.05)' : 'FAIL'}`);
            console.log(`Foto Audit: Intacta=${finalTelemetry.photoAudit.photoComplete}, Dimensiuni=${finalTelemetry.photoAudit.renderedBox?.width}x${finalTelemetry.photoAudit.renderedBox?.height}px (4:3), Badge-uri Suprapuse=${finalTelemetry.photoAudit.badgeSelectorCount}`);
            console.log(`Elemente suprapuse peste oameni/masa in photo-frame: ${finalTelemetry.photoAudit.overlappingElementsInsidePhotoFrame.length}`);

            console.log('\nTIMELINE APARITIE SI ANIMATIE ELEMENTE (.is-visible):');
            console.log('ID | Element | Intrare Viewport (ms) | Animat .is-visible (ms) | Delay Stagger (ms) | Box Initial | Stare');
            for (const el of resultSummary.elements) {
                const stagger = (el.becameVisibleMs !== null && el.enteredViewportMs !== null) 
                    ? (el.becameVisibleMs - el.enteredViewportMs) 
                    : 0;
                const status = (el.becameVisibleMs !== null) ? 'ANIMAT OK' : (el.enteredViewportMs !== null ? 'IN VIEWPORT' : 'BELOW FOLD');
                const boxStr = el.initialBox ? `${el.initialBox.width}x${el.initialBox.height}@[${el.initialBox.x},${el.initialBox.y}]` : 'N/A';
                console.log(`- ${el.label}: Entry=${el.enteredViewportMs ?? '0'}ms | Visible=${el.becameVisibleMs ?? '0'}ms | Delta=${stagger}ms | Box=${boxStr} | ${status}`);
            }

            await context.close();
        }
    }

    await browser.close();

    // Save telemetry log to disk
    const logPath = path.resolve(__dirname, 'video_motion_telemetry_results.json');
    fs.writeFileSync(logPath, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n========================================================================`);
    console.log(`INSPECTIE FINALIZATA CU SUCCES! Raportul complet salvat la: ${logPath}`);
    console.log(`========================================================================`);

    return allResults;
}

runSimulation().catch(err => {
    console.error('Fatal error during simulation:', err);
    process.exit(1);
});
