History of cookies.txt
=====
### 0.1.2 
* Fix: Parse 2 cookies files, the result is merged into one globale object. Reset cookie object when call parse() method.

### 0.1.1
* parse cookies only
* remove old jar request support; new way: ``` request.get({url:'url', jar:true, headers:{Cookie:cookie.getCookieString('url')}});```
* return http request header "Cookie" string by request.url.

### 0.1.0
* basic wget cookies.txt format file parser.
* working with module request: _NOT work with request:jar Object of new version request_.
