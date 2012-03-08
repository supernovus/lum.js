.PHONY: DEFAULT clean distclean bootstrap
.DEFAULT: bootstrap

## Download all of our pre-requisites.
bootstrap: jquery.js json2.js jsmin compiler.jar

## Download the source code to jsmin.
jsmin.c:
	wget https://raw.github.com/douglascrockford/JSMin/master/jsmin.c

## Compile jsmin from the source code. Requires 'gcc'.
jsmin: jsmin.c
	gcc -o jsmin jsmin.c

## Download 'jquery'. Do not minify this, it's already compressed.
jquery.js:
	wget -O jquery.js http://code.jquery.com/jquery.min.js

## Download 'json2'. It's not minified, so feel free to do so.
json2.js:
	wget https://raw.github.com/douglascrockford/JSON-js/master/json2.js

## Download 'underscore'. An optional component, this is pre-minified.
underscore.js:
	wget -O underscore.js http://documentcloud.github.com/underscore/underscore-min.js

## Download 'compiler.jar'. Requires 'unzip'.
compiler.jar:
	wget http://closure-compiler.googlecode.com/files/compiler-latest.zip
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

## Build a minified script using jsmin.
%.min.js : %.js jsmin
	./jsmin < $< > $@

## Build a "compiled" version using Closure Compiler.
%.cc.js : %.js jsc compiler.jar
	./jsc $< 

## Remove all .min.js and .cc.js files.
clean:
	rm -vf *.min.js
	rm -vf *.cc.js

## Remove everything that was downloaded or compiled.
distclean: clean
	rm -v jsmin*
	rm -v jquery.js
	rm -v json2.js

