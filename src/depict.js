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

var url = argv._[0];
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

phantom.create(function(ph) {
  ph.createPage(function(page) {
    page.open('http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html',
        function(status) {
      console.log(this);
      console.log(status);
      page.set('clipRect', { top: 200, left: 10, width: 950, height: 600 });
      page.render('out.png', function() {
        console.log('done!');
      });
    });
  });
});

/*
var args = [__dirname + '/depict-casperjs.js', url, selector, out_file];

if (css_text) {
    args.push('--css', css_text);
}

casper = child_process.spawn('casperjs', args);

casper.stdout.on('data', function(data) {
    process.stdout.write(data);
});
*/

