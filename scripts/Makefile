.PHONY: DEFAULT clean distclean bootstrap
.DEFAULT: bootstrap

### NOTE: Pay attention to the suffixes of script files.
### 
###  .dist.js  -- A pre-minified/compiled library we download from the official source.
###  .min.js   -- A library that we have minified ourself using jsmin.
###  .cc.js    -- A library that we have compiled ourself using Closure Compiler.
###  .js       -- A raw source library.
###

## Download all of our prerequisites.
bootstrap: jquery.dist.js json2.js jsmin compiler.jar underscore.dist.js less.dist.js

## Download the source code to jsmin.
jsmin.c:
	wget https://raw.github.com/douglascrockford/JSMin/master/jsmin.c

## Compile jsmin from the source code. Requires 'gcc'.
jsmin: jsmin.c
	gcc -o jsmin jsmin.c

## Download 'jquery', the Javascript framework we use for pretty much everything.
jquery.dist.js:
	wget -O jquery.dist.js http://code.jquery.com/jquery.min.js

## Download 'json2'. It's not minified, so feel free to do so.
json2.js:
	wget https://raw.github.com/douglascrockford/JSON-js/master/json2.js

## Download 'underscore', a collection of functional programming helpers.
underscore.dist.js:
	wget -O underscore.dist.js http://documentcloud.github.com/underscore/underscore-min.js

## Download 'less.js', a CSS extension language.
less.dist.js:
	wget -O less.dist.js http://lesscss.googlecode.com/files/less-1.3.0.min.js

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
	rm -fv jsmin*
	rm -fv jquery.dist.js
	rm -fv json2.js
	rm -fv underscore.dist.js
	rm -fv less.dist.js

