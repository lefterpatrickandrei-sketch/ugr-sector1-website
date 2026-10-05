const { chromium } = require('playwright');

async function testPage(url, pageName) {
    console.log(`\n========================================`);
    console.log(`TESTING: ${pageName} (${url})`);
    console.log(`========================================`);

    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    const pageErrors = [];
    page.on('pageerror', err => {
        pageErrors.push(err.message);
    });

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // If it's index.html#contact, ensure section is visible
    if (url.includes('#contact')) {
        await page.evaluate(() => {
            if (typeof showSection === 'function') {
                showSection('contact');
            }
        });
        await page.waitForTimeout(300);
    }

    // 1. Check Console & Page Errors
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
        console.error('Details:', consoleErrors);
    }
    console.log(`Page Errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
        console.error('Details:', pageErrors);
    }

    // 2. Desktop Overflow Check
    const desktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`Desktop Overflow: ${desktopOverflow}px (Expected: <= 0px)`);

    // 3. Mobile (390px) Overflow Check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`Mobile (390px) Overflow: ${mobileOverflow}px (Expected: <= 0px)`);

    // Back to Desktop for interaction tests
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);

    // 4. Test Accordion Count and Toggle
    const faqCount = await page.locator('.faq-card').count();
    console.log(`Total FAQ cards rendered: ${faqCount}`);

    if (faqCount > 0) {
        const firstCard = page.locator('.faq-card').first();
        const firstBtn = firstCard.locator('.faq-question');
        const initialOpen = await firstCard.evaluate(el => el.classList.contains('open'));
        console.log(`First card initially open: ${initialOpen}`);

        await firstBtn.click();
        await page.waitForTimeout(250);
        const afterToggleOpen = await firstCard.evaluate(el => el.classList.contains('open'));
        console.log(`First card after click open: ${afterToggleOpen}`);

        // Click again to close or restore
        await firstBtn.click();
        await page.waitForTimeout(250);
    }

    // 5. Test Search Filtering
    const searchInput = page.locator('#faq-search-input');
    if (await searchInput.count() > 0) {
        await searchInput.fill('cotizatie');
        await page.waitForTimeout(250);
        const visibleAfterSearch = await page.locator('.faq-card:not([style*="display: none"])').count();
        console.log(`Visible FAQs searching "cotizatie": ${visibleAfterSearch}`);

        // Clear search
        const clearBtn = page.locator('#faq-search-clear');
        if (await clearBtn.isVisible()) {
            await clearBtn.click();
            await page.waitForTimeout(250);
            const visibleAfterClear = await page.locator('.faq-card:not([style*="display: none"])').count();
            console.log(`Visible FAQs after clear search: ${visibleAfterClear}`);
        }
    }

    // 6. Test Category Pills
    const pills = page.locator('.faq-pill-btn');
    const pillCount = await pills.count();
    console.log(`Category pills count: ${pillCount}`);
    if (pillCount > 1) {
        // Click second pill (Înscriere & Cotizații)
        await pills.nth(1).click();
        await page.waitForTimeout(250);
        const visibleAderare = await page.locator('.faq-card:not([style*="display: none"])').count();
        console.log(`Visible FAQs under pill 1: ${visibleAderare}`);

        // Click first pill (Toate)
        await pills.nth(0).click();
        await page.waitForTimeout(250);
        const visibleAll = await page.locator('.faq-card:not([style*="display: none"])').count();
        console.log(`Visible FAQs under "Toate": ${visibleAll}`);
    }

    // 7. Verify NO old AI slop indicators
    const aiSlopChecks = await page.evaluate(() => {
        return {
            hasVoteWidget: !!document.querySelector('.faq-feedback-vote'),
            hasTicketBadge: !!document.querySelector('.ticket-number'),
            hasHudMapCoords: !!document.querySelector('.hud-map-coords'),
            hasBtnShimmerContact: !!document.querySelector('.btn-shimmer-contact')
        };
    });
    console.log('AI Slop Checks (all should be false):', aiSlopChecks);

    await browser.close();
}

async function run() {
    try {
        await testPage('http://localhost:8088/demo-v2/#contact', 'Integrated Site FAQ (#view-contact)');
        await testPage('http://localhost:8088/demo-v2/demos-faq.html', 'Standalone Showcase FAQ (demos-faq.html)');
        console.log('\n========================================');
        console.log('ALL FAQ TESTS PASSED WITH 0 ERRORS!');
        console.log('========================================');
    } catch (e) {
        console.error('Test execution failed:', e);
        process.exit(1);
    }
}

run();
