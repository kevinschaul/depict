"use strict";
//This is a wget cookies.txt parser for nodejs
//Author:@mxfli
//date::2011年 12月 13日 星期二 13:33:06 UTC

var fs = require('fs');
var url = require('url');
var assert = require('assert');

var COOKIE_FIELDS = ['domain', 'httponly', 'path', 'secure', 'expires', 'name', 'value'];
//Object contains parsed cookies from cookies.txt
var COOKIES = [];

/**
 * Parse cookies file and return the result to cb;
 */
var parse = function (file, cb) {
  assert(fs.existsSync(file));
  assert(typeof cb === 'function');

  //Fix: 2 cookies file is merged in on Object.
  COOKIES.length = 0;

  fs.readFile(file, function read(err, buffer) {
    if (err) {
      throw err;
    }

    //change dos/mac files to unix format
    var toUnix = function (str) {
      assert(typeof  str === 'string');
      return str.replace(/\\r\\n/g, '\r').replace(/\\r/g, '\n');
    };

    var str = toUnix(buffer.toString('utf8'));
    //console.log('Cookies.txt content: \n', str);

    var cookies = str.split('\n');
    //console.log(cookies.length);

    cookies.forEach(function (line) {
      //console.log(index,':',line);
      line = line.trim();

      if (line.length > 0 && !/^#/.test(line)) {
        var cookie = {};
        line.split(/\s/).forEach(function (c, index) {
          if (COOKIE_FIELDS[index] === 'expires') {
            c = (new Date(parseInt(c, 10) * 1000));
          }
          cookie[COOKIE_FIELDS[index]] = c;
        });

        COOKIES.push(cookie);
      }
    });
    console.log("node-Cookies.txt load:", COOKIES.length, 'cookies.');

    cb(COOKIES);
  });
};

exports.parse = parse;

exports.getCookieString = function (urlStr) {
  var urlObj = url.parse(urlStr, false);

  var result = COOKIES.reduce(function (pre, cookie) {
    if (urlObj.hostname === cookie.domain && urlObj.pathname.indexOf(cookie.path) === 0) {
      pre.push(cookie.name + '=' + cookie.value);
    }
    return pre;
  }, []).join(';');

  console.log('Get "Cookie" :', result);
  return result;
};
