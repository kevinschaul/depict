#!/usr/bin/env node

var child_process = require('child_process');
var fs = require('fs');
var jsdom = require('jsdom');
var optimist = require('optimist');

var argv = optimist
  .usage('Usage: node depict.js FILE')
  .options('h', {
    alias: 'help',
    describe: 'Display help',
    default: false
  })
  .options('s', {
    // TODO
    alias: 'size',
    describe: 'Dimensions of output image, in form `height,width`',
    default: false
  })
  .check(function(argv) {
    if (argv._.length !== 1) throw new Error('FILE must be given.');
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var out_file = argv._[0];
var size = argv.s || argv.size;

var convert_args = ['-o', out_file];
var convert = child_process.spawn('rsvg-convert', convert_args);

convert.stdout.on('data', function(data) {
  process.stdout.write(data);
});

process.stdout.on('data', function(data) {
  console.log(data);
});

var html = '<div id="target"></div>';

var scripts = [
  'node_modules/d3/d3.min.js',
  'node_modules/jquery/tmp/jquery.js',
  'src/data/jobs.js',
  'src/chart.js'
];

if (size) {
  var parts = size.split(',');
  var height = parts[0];
  var width = parts[1];
}

// Read css from disk
var css = [];
css.push('<style>\n');
css.push(fs.readFileSync('chart.css', 'utf8'));
css.push('</style>');

jsdom.env({
  html: [html, css.join('')],
  scripts: scripts,
  done: function(errors, window) {
    var $ = window.$;

    window.insertChart(window.jobs, width, height);

    // Set `svgsrc`
    var svgsrc = $('#target').html();

    // Write to stdin, which convert is waiting to handle
    convert.stdin.write(svgsrc);
    convert.stdin.end();
  }
});

