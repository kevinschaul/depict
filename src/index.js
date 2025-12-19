import fs from 'fs';
import puppeteer from 'puppeteer';

/**
 * Take a screenshot of a web page or specific element
 * @param {string} url - The URL to screenshot
 * @param {Object} options - Configuration options
 * @param {string} [options.output='screenshot.png'] - Output file path
 * @param {string} [options.selector='body'] - CSS selector to screenshot
 * @param {number} [options.width=1440] - Viewport width
 * @param {number} [options.height=900] - Viewport height
 * @param {number} [options.delay=1000] - Wait before screenshot (milliseconds)
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @param {string} [options.waitForSelector=null] - Wait for CSS selector before screenshot
 * @param {string|Array<string>} [options.css=null] - CSS file(s) to inject
 * @param {string} [options.hide=null] - Hide element(s) before screenshot
 * @param {number} [options.quality=90] - JPEG quality (0-100, only for .jpg/.jpeg)
 * @param {boolean} [options.verbose=false] - Show detailed output
 * @returns {Promise<void>}
 */
export async function depict(url, options = {}) {
    const {
        output = 'screenshot.png',
        selector = 'body',
        width = 1440,
        height = 900,
        delay = 1000,
        timeout = 30000,
        waitForSelector = null,
        css = null,
        hide = null,
        quality = 90,
        verbose = false
    } = options;

    // Prepend protocol if not specified
    if (!url.match(/^\w+:\/\//)) {
        // Use http for localhost, https for everything else
        const protocol = url.match(/^localhost(:|$)/) ? 'http' : 'https';
        url = `${protocol}://${url}`;
    }

    // Load CSS files
    let cssText = '';
    if (css) {
        const cssFiles = Array.isArray(css) ? css : css.split(',');
        cssFiles.forEach((cssPath) => {
            cssText += fs.readFileSync(cssPath.trim(), 'utf8');
        });
    }

    // Add hide styles
    if (hide) {
        cssText += `\n\n ${hide} { display: none !important; }\n`;
    }

    if (verbose) console.log(`\nRequesting ${url}`);

    const browser = await puppeteer.launch({
        args: ['--disable-web-security', '--ignore-certificate-errors']
    });

    try {
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({
            width: width,
            height: height
        });

        // Forward console messages from the page if verbose
        if (verbose) {
            page.on('console', (msg) => console.log(msg.text()));
        } else {
            page.on('console', () => {});
        }

        // Suppress errors
        page.on('pageerror', () => {});

        // Navigate to the page
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: timeout
        });

        const responseCode = response.status();

        if (responseCode >= 200 && responseCode < 300) {
            if (waitForSelector) {
                // Wait for CSS selector to exist
                try {
                    await page.waitForSelector(waitForSelector, { timeout: timeout });
                    await scheduleRender();
                } catch (error) {
                    await browser.close();
                    throw new Error(`Selector not found within timeout: ${waitForSelector}`);
                }
            } else {
                await scheduleRender();
            }
        } else {
            await browser.close();
            throw new Error(`Page could not be loaded. Response code: ${responseCode}`);
        }

        async function scheduleRender() {
            await new Promise(resolve => setTimeout(resolve, delay));
            await renderImage();
        }

        async function renderImage() {
            // Inject CSS and get element bounding box
            const rect = await page.evaluate((selector, cssText) => {
                if (cssText) {
                    const style = document.createElement('style');
                    style.appendChild(document.createTextNode(cssText));
                    document.head.appendChild(style);
                }

                const element = document.querySelector(selector);
                if (!element) {
                    return null;
                }
                return element.getBoundingClientRect();
            }, selector, cssText);

            if (!rect) {
                await browser.close();
                throw new Error(`Selector not found: ${selector}`);
            }

            // Take screenshot of the specific element
            const element = await page.$(selector);

            // Determine image format from file extension
            const isJpeg = /\.jpe?g$/i.test(output);
            const screenshotOptions = { path: output };

            if (isJpeg) {
                screenshotOptions.type = 'jpeg';
                screenshotOptions.quality = quality;
            }

            await element.screenshot(screenshotOptions);

            if (verbose) console.log(`Saved image to ${output}`);
            await browser.close();
        }

    } catch (error) {
        await browser.close();
        throw error;
    }
}

export default depict;
