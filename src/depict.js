#!/usr/bin/env node

var child_process = require('child_process');
var fs = require('fs');
var optimist = require('optimist');
var phantom = require('phantom');

var argv = optimist
  .usage('Usage: depict URL OUT_FILE [OPTIONS]')
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
  .check(function(argv) {
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

if (argv.h || argv.help) return optimist.showHelp();

// Append 'http://' if protocol not specified
var url = argv._[0];
if (!url.match(/^\w+:\/\//)) {
  url = 'http://' + url;
}

var selector = argv.s || argv.selector;
var out_file = argv._[1];

var css_file = argv.c || argv.css;
var css_text = '';
if (css_file) {
  css_text = fs.readFileSync(css_file, 'utf8');
}

var hide_selector = argv.H || argv["hide-selector"];
if (hide_selector) {
  css_text += "\n\n " + hide_selector + " { display: none; }\n";
}

var viewport_width = argv.w || argv['browser-width'];
var delay_time = argv.d || argv['delay'];

var callPhantom = argv['call-phantom'];
var callPhantomTimeout = (argv['call-phantom-timeout'] || 30) * 1000;

var callPhantomTimeoutID;
var hasTakenScreenshot = false;

function depict(url, out_file, selector, css_text) {
  // phantomjs heavily relies on callback functions

  var page;
  var ph;

  console.log('\nRequesting', url);

  phantom.create(createPage)

  function createPage(_ph) {
    ph = _ph;
    ph.createPage(openPage);
  }

  function openPage(_page) {
    page = _page;
    page.set('onError', function() { return; });
    page.onConsoleMessage = function (msg) { console.log(msg); };

    if (callPhantom) {
      page.set('onCallback', function(data) {
        // Ensure message sent was for depict
        if (data.target === 'depict') {
          // Ensure status is ready
          if (data.status === 'ready') {
            page.evaluate(runInPhantomBrowser, renderImage, selector, css_text);
          } else {
            process.stdout.write('callPhantom() did not have status of `ready`\n');
            ph.exit();
            process.exit(1);
          }
        }
      });
    }
    page.open(url, prepForRender);
    page.set('viewportSize', {width: viewport_width, height: 900}); // The height isn't taken into account here but phantomjs requires an object with both a width and a height.
  }

  function prepForRender(status) {
    // TODO status is 'success' even on a 404.
    if (status === 'success') {
      if (callPhantom) {
        callPhantomTimeoutID = setTimeout(function() {
          if (!hasTakenScreenshot) {
            process.stdout.write('callPhantom() was not called; depict timed out.\n');
            ph.exit();
            process.exit(1);
          }
        }, callPhantomTimeout);
      } else {
        page.evaluate(runInPhantomBrowser, renderImage, selector, css_text);
      }
    } else {
      ph.exit()
      process.stdout.write('Page could not be loaded. Response code: ' + pageResponse + '\n');
      process.exit(1);
    }
  }

  function runInPhantomBrowser(selector, css_text) {
    debugger;
    if (css_text) {
      var style = document.createElement('style');
      style.appendChild(document.createTextNode(css_text));
      document.head.appendChild(style);
    }

    var element = document.querySelector(selector);
    return element.getBoundingClientRect();
  }

  function renderImage(rect) {
    // Clear the phantom timeout
    clearTimeout(callPhantomTimeoutID);

    // Not technically true yet, but at this point the screenshot will clearly
    // be taken.
    hasTakenScreenshot = true;
    setTimeout(function(){
      page.set('clipRect', rect);
      page.render(out_file, cleanup);
    }, delay_time)
  }

  function cleanup() {
    console.log('Saved imaged to', out_file);
    ph.exit();
  }
}

depict(url, out_file, selector, css_text);
