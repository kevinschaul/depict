#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { depict } from './index.js';

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

const url = argv._[0];

depict(url, {
    output: argv.o || argv.output,
    selector: argv.s || argv.selector,
    width: argv.width,
    height: argv.height,
    delay: argv.delay,
    timeout: argv.timeout * 1000,
    waitForSelector: argv['wait-for-selector'],
    css: argv.css,
    hide: argv.hide,
    quality: argv.quality,
    verbose: argv.verbose
}).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
