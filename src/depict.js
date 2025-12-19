#!/usr/bin/env node

import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import puppeteer from 'puppeteer';

const argv = yargs(hideBin(process.argv))
    .usage('Usage: depict <URL> [options]')
    .option('o', {
        alias: 'output',
        describe: 'Output file',
        default: 'screenshot.png'
    })
    .option('s', {
        alias: 'selector',
        describe: 'CSS selector',
        default: 'body'
    })
    .option('width', {
        describe: 'Viewport width',
        default: 1440
    })
    .option('height', {
        describe: 'Viewport height',
        default: 900
    })
    .option('delay', {
        describe: 'Wait before screenshot (milliseconds)',
        default: 1000
    })
    .option('timeout', {
        describe: 'Timeout in seconds (for page load and selector waiting)',
        default: 30
    })
    .option('wait-for-selector', {
        describe: 'Wait for CSS selector to exist before screenshot',
        default: null
    })
    .option('css', {
        describe: 'CSS file(s) to inject (comma-separated)',
        default: null
    })
    .option('hide', {
        describe: 'Hide element(s) before screenshot',
        default: null
    })
    .option('quality', {
        describe: 'JPEG quality (0-100, only for .jpg/.jpeg output)',
        default: 90
    })
    .option('verbose', {
        describe: 'Show detailed output',
        default: false
    })
    .help('h')
    .alias('h', 'help')
    .check((argv) => {
        if (argv._.length !== 1) {
            throw new Error('URL must be provided.');
        }
        return true;
    })
    .argv;

// Prepend 'https://' if protocol not specified
let url = argv._[0];
if (!url.match(/^\w+:\/\//)) {
    url = `https://${url}`;
}

const selector = argv.s || argv.selector;
const outFile = argv.o || argv.output;
const quality = argv.quality;

const cssFile = argv.css;
let cssText = '';
if (cssFile) {
    cssFile.split(',').forEach((cssPath) => {
        cssText += fs.readFileSync(cssPath.trim(), 'utf8');
    });
}

const hideSelector = argv.hide;
if (hideSelector) {
    cssText += `\n\n ${hideSelector} { display: none !important; }\n`;
}

const viewportWidth = argv.width;
const viewportHeight = argv.height;
const delayTime = argv.delay;
const timeout = argv.timeout * 1000;

const waitForSelector = argv['wait-for-selector'];
const verbose = argv.verbose;

async function depict(url, outFile, selector, cssText) {
    if (verbose) console.log(`\nRequesting ${url}`);

    const browser = await puppeteer.launch({
        args: ['--disable-web-security', '--ignore-certificate-errors']
    });

    try {
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({
            width: viewportWidth,
            height: viewportHeight
        });

        // Forward console messages from the page if verbose
        if (verbose) {
            page.on('console', (msg) => console.log(msg.text()));
        } else {
            page.on('console', () => {});
        }

        // Suppress errors
        page.on('pageerror', () => {});

        let responseCode;

        // Track response code
        page.on('response', (response) => {
            if (response.url() === url) {
                responseCode = response.status();
            }
        });

        // Navigate to the page
        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: timeout
        });

        responseCode = response.status();

        if (responseCode >= 200 && responseCode < 300) {
            if (waitForSelector) {
                // Wait for CSS selector to exist
                try {
                    await page.waitForSelector(waitForSelector, { timeout: timeout });
                    await scheduleRender();
                } catch (error) {
                    process.stdout.write(`Selector not found within timeout: ${waitForSelector}\n`);
                    await browser.close();
                    process.exit(1);
                }
            } else {
                await scheduleRender();
            }
        } else {
            await browser.close();
            process.stdout.write(`Page could not be loaded. Response code: ${responseCode}\n`);
            process.exit(1);
        }

        async function scheduleRender() {
            setTimeout(async () => {
                await renderImage();
            }, delayTime);
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
                process.stdout.write(`Selector not found: ${selector}\n`);
                process.exit(1);
            }

            // Take screenshot of the specific element
            const element = await page.$(selector);

            // Determine image format from file extension
            const isJpeg = /\.jpe?g$/i.test(outFile);
            const screenshotOptions = { path: outFile };

            if (isJpeg) {
                screenshotOptions.type = 'jpeg';
                screenshotOptions.quality = quality;
            }

            await element.screenshot(screenshotOptions);

            if (verbose) console.log(`Saved image to ${outFile}`);
            await browser.close();
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        await browser.close();
        process.exit(1);
    }
}

depict(url, outFile, selector, cssText);
