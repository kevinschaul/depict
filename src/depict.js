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
    describe: 'Hide attributes of this selector berore rendering.',
    default: false
  })
  .check(function(argv) {
    if (argv._.length !== 2) throw new Error('URL and OUT_FILE must be given.');
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

// TODO append 'http://' if protocol not specified
var url = argv._[0];
var selector = argv.s || argv.selector;
var out_file = argv._[1];

// TODO implement
var css_file = argv.c || argv.css;
var css_text = '';
if (css_file) {
    css_text = fs.readFileSync(css_file, 'utf8');
}

// TODO implement
var hide_selector = argv.H || argv["hide-selector"];
if (hide_selector) {
  css_text += "\n\n " + hide_selector + " { display: none; }\n";
}

phantom.create(function(ph) {
  ph.createPage(function(page) {
    console.log('Requesting', url);
    page.open(url, function(status) {
      // TODO filter out console.log errors of requested page
      console.log('opened.');
      page.evaluate(function(selector) {
        var element = document.querySelector(selector);
        return element.getBoundingClientRect();
      },
      function(rect) {
        page.set('clipRect', rect);
        page.render(out_file, function() {
          console.log('done!');
          ph.exit();
        });
      },
      selector
      );
    });
  });
});

