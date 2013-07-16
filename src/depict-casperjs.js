var casper = require('casper').create();
var utils = require('utils');

var showUsage = function() {
    var usage = 'Usage: casper.js depict-casperjs.js URL SELECTOR OUTFILE [CSS_TEXT]';
    console.log(usage);
    casper.exit();
};

var args = casper.cli.args;
var options = casper.cli.options;

if (args.length < 3) {
    showUsage();
}

var url = args[0];
var selector = args[1];
var outFile = args[2];

var cssText = false;
if (options.css) {
    var cssText = args[3];
}

console.log('\nRequesting ' + url + ' ' + selector);
casper.start(url);

casper.waitForSelector(selector, function() {
    if (cssText) {
        casper.evaluate(function(cssText) {
            var style = document.createElement('style');
            style.appendChild(document.createTextNode(cssText));
            document.head.appendChild(style);
        }, cssText);
    }
    this.captureSelector(outFile, selector);
    console.log('Saved to ' + outFile);
});

casper.run();

