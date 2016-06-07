cookies.txt
===========

TestStatus:[![Test Status](https://travis-ci.org/mxfli/node-cookies.txt.png)](https://travis-ci.org/mxfli/node-cookies.txt)

#README
 This is a _wget cookies.txt_ formart parser for nodejs.

 Convert wget cookies.txt format file into JSON boject.

 Working whith `http.requst` or `request module`.


##Install
```npm install cookies.txt```

##Usage
```
var cookie = require('cookies.txt');
cookie.parse('your cookies.txt file path here.', function(jsonCookieObj){
  //your codes here 
  //...
});
```
### Working with request module
```
var request = require('request');
var cookie = requeire('cookies.txt');

cookie.parse('your cookies.txt file path here.', function(jsonCookieObj){
  //your codes here 
  request.get({
      url:'the http url',
      jar:true, 
      encoding:null, 
      headers:{
        Cookie:cookie.getCookieString('the url')}})
    .pipe(AWritebleStreamInstance);
  //...
});
```

##License
MIT
