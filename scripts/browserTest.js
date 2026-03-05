import { check } from 'k6';
import { browser } from 'k6/browser';
import http from 'k6/http';

export const options = {
    scenarios: {
        ui: {
            executor: 'shared-iterations',
            exec: 'browserTest',
            vus: 2,
            iterations: 4,
            maxDuration: '1m',
            options: {
                browser: {
                    type: 'chromium',
                    headless: true,
                },
            },
        },

        be: {
            executor: 'constant-vus',
            exec: 'backendStressTest',
            vus: 10,
            duration: '1s',
        },
    },

    thresholds: {
        
        checks: ['rate==1.0'],

    // Backend thresholds
    'http_req_duration{scenario:be}': ['p(95)<800'],
    'http_req_failed{scenario:be}': ['rate<0.01'],

    //Frontend thresholds
        'browser_web_vital_fcp': ['p(95)<2000'],   // First content
        'browser_web_vital_lcp': ['p(95)<2500'],   // Main content
        'browser_web_vital_cls': ['p(95)<0.1'],    // Layout stability
        'browser_web_vital_fid': ['p(95)<100'],    // Interactivity
        'browser_web_vital_ttfb': ['p(95)<600'],   // Server response
    },
};

export async function browserTest() {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://rahulshettyacademy.com/locatorspractice/");

    await page.locator("#inputUsername").type("pramod");

    console.log("Entering password");

    await page
        .locator("input[placeholder='Password']")
        .type("rahulshettyacademy");

    console.log("Trying to submit form");

    await page.locator("button[type=submit]").click();

    console.log("Navigation Completed");

    await page.waitForTimeout(2000);

    const headerText = await page.locator("h1").first().textContent();

    check(headerText, {
        header: (text) => text.includes("Rahul Shetty Academy"),
    });

    await page.close();
}

export function backendStressTest() {
    const res = http.get(
        "https://rahulshettyacademy.com/locatorspractice/"
    );

    check(res, {
        "status is 200": (r) => r.status === 200,
    });
}

