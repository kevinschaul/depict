var casper = require('casper').create();
var utils = require('utils');

var showUsage = function() {
    var usage = 'Usage: casper.js depict-casperjs.js URL SELECTOR OUTFILE';
    console.log(usage);
    casper.exit();
};

var args = casper.cli.args;

if (args.length !== 3) {
    showUsage();
}

var url = args[0];
var selector = args[1];
var outFile = args[2];

console.log('\nRequesting ' + url + ' ' + selector);
casper.start(url);

casper.waitForSelector(selector, function() {
    casper.evaluate(function(styleURL) {
        var style = document.createElement('style');
        style.appendChild(document.createTextNode('@import url("' + styleURL + '")'));
        document.head.appendChild(style);
    }, 'test.css');
    this.captureSelector(outFile, selector);
    console.log('Saved to ' + outFile);
});

casper.run();

