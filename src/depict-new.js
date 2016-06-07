#!/usr/bin/env node

// use of block-scoped declarations (let, const, function, class)
// not supported yet unless using strict mode
'use strict';

const child_process = require('child_process');
const fs = require('fs');
const optimist = require('optimist');
const Horseman = require('node-horseman');

let argv = optimist.usage('Usage: depict URL OUT_FILE [OPTIONS]')
    .options('h', {
        alias: 'help',
        describe: 'Display help',
        default: false
    })
    .options('s', {
        alias: 'selector',
        describe: 'CSS selector',
        default: 'body'
    })
    .options('c', {
        alias: 'css',
        describe: 'CSS file to include in rendering',
        default: false
    })
    .options('H', {
        alias: 'hide-selector',
        describe: 'Hide attributes of this selector before rendering.',
        default: false
    })
    .options('w', {
        alias: 'browser-width',
        describe: 'Specify the desired browser width.',
        default: 1440
    })
    .options('d', {
        alias: 'delay',
        describe: 'Specify a delay time, in milliseconds.',
        default: 1000
    })
    .options('call-phantom', {
        describe: 'Whether to wait for the target page to call `callPhantom()`.',
        default: false
    })
    .options('call-phantom-timeout', {
        describe: 'How long to wait for the target page to call `callPhantom()`, in seconds.',
        default: 30
    })
    .check(function (argv) {
        if (argv._.length !== 2) {
            throw new Error('URL and OUT_FILE must be given.');
            process.exit(1);
        }
        if (argv['call-phantom-timeout'] !== 30 && !argv['call-phantom']) {
            throw new Error('--call-phantom-timeout requires --call-phantom');
            process.exit(1);
        }
    })
    .argv;

if (argv.h || argv.help) {
    return optimist.showHelp();
}

// Append 'http://' if protocol not specified
let url = argv._[0];

if (!url.match(/^\w+:\/\//)) {
    url = 'http://' + url;
}

let selector = argv.s || argv.selector;

let out_file = argv._[1];

let css_file = argv.c || argv.css;

let css_text = '';

if (css_file) {
    css_file.split(',').forEach(function (css_path) {
        css_text += fs.readFileSync(css_path.trim(), 'utf8')
    })
}

let hide_selector = argv.H || argv["hide-selector"];

if (hide_selector) {
    css_text += "\n\n " + hide_selector + " { display: none; }\n";
}

let viewport_width = argv.w || argv['browser-width'];

let delay_time = argv.d || argv['delay'];

let callPhantom = argv['call-phantom'];

let callPhantomTimeout = (argv['call-phantom-timeout'] || 30) * 1000;

let callPhantomTimeoutID;

let hasTakenScreenshot = false;

let horseyOptions = {
    // an array of local JavaScript files to load onto each page.
    clientScripts: [],
    // how long to wait for page loads or wait periods, default 5000 ms.
    timeout: delay_time,
    // how frequently to poll for page load state, default 50 ms.
    interval: 50,
    // port to mount the PhantomJS instance to, default 12401.
    port: 12401,
    // load all inlined images, default true.
    loadImages: true,
    // switch to new tab when created, default false.
    switchToNewTab: false,
    // A file where to store/use cookies.
    cookiesFile: '',
    // ignores SSL errors, such as expired or self-signed certificate errors.
    ignoreSSLErrors: true,
    // sets the SSL protocol for secure connections [sslv3|sslv2|tlsv1|any], default any.
    sslProtocol: 'any',
    // enables web security and forbids cross-domain XHR.
    webSecurity: false,
    // whether jQuery is automatically loaded into each page. Default is true. If jQuery is already present on the page, it is not injected.
    injectJquery: true,
    // whether bluebird is automatically loaded into each page. Default is false. If true and Promise is already present on the page, it is not injected. If 'bluebird' it is always injected as Bluebird, whether Promise is present or not.
    injectBluebird: true,
    // whether or not to enable bluebird debug features. Default is false. If true non-minified bluebird is injected and long stack traces are enabled
    bluebirdDebug: true,
    // specify the proxy server to use address:port, default not set.
    // proxy: ,
    // specify the proxy server type [http|socks5|none], default not set.
    // proxyType: ,
    // specify the auth information for the proxy user:pass, default not set.
    // proxyAuth: ,
    // If PhantomJS is not installed in your path, you can use this option to specify the executable's location.
    // phantomPath: ,
    // Enable web inspector on specified port, default not set.
    debugPort: 4567,
    // Autorun on launch when in debug mode, default is true.
    debugAutorun: true
};

let horseman = new Horseman(horseyOptions);
let scrollToURL = 'https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/2.1.0/jquery.scrollTo.min.js';

function depict(url, out_file, selector, css_text) {

    horseman
        .on('error', console.error)
        .viewport(viewport_width, 900)
        .scrollTo(0, 0)
        .includeJs(scrollToURL)
        .open(url)
        .then(() => {
            var i = 0,
                top,
                getHeight = function () {
                    return document.body.scrollHeight;
                },
                getDocScrollSteps = function () {
                    return document.body.scrollHeight / 10;
                },
                getScrollTop = function () {
                    return document.body.scrollTop;
                };

            let height = horseman.evaluate(getHeight);
            let scrollStepDist = horseman.evaluate(getDocScrollSteps);

            let chicken = setInterval(function () {
                top = horseman.evaluate(getScrollTop);

                horseman.scrollTo(top + scrollStepDist, 0)

                if (top >= height) {
                    horseman
                        .screenshot(out_file)
                        .close();
                    clearInterval(chicken);
                }
            }, 1000);
        })
        // .status()
        // .then(statusCode => {
        //     console.log('HTTP status code: ', statusCode);
        //
        //     if (statusCode >= 400) {
        //         throw 'Page failed with status: ' + statusCode;
        //     }
        //
        // })
        // .evaluate(() => {
        //     $.scrollTo(6000);
        // })
        // .wait(delay_time)
        // .screenshot(out_file)
        // .catch(function (err) {
        //     console.log('Error taking screenshot: ', err);
        // })
        // .finally(() => {
        //     horseman.close();
        // })
}

depict(url, out_file, selector, css_text);
