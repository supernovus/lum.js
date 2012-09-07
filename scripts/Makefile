.PHONY: DEFAULT clean distclean bootstrap minify_all compile_all
.DEFAULT: bootstrap

###############################################################################
###
### This file is fairly Linux/Unix specific. Use on Windows likely won't work.
###
### NOTE: Pay attention to the suffixes of script files.
### 
###  .dist.js  -- A pre-minified/compiled library from the official source.
###  .min.js   -- A library that we have minified using jsmin.
###  .cc.js    -- A library that we have compiled using Closure Compiler.
###  .js       -- A raw source library.
###
##############################################################################

BOOT_COMPILERS = jsmin compiler.jar
BOOT_SCRIPTS = jquery.dist.js json2.js underscore.dist.js less.dist.js
BOOT_DEPENDS = $(BOOT_COMPILERS) $(BOOT_SCRIPTS)

## A list of all files to minify.
ALL_MIN = $(shell ls *.js | egrep -v '.(dist|cc|min).js' | sed -e 's/\.js/.min.js/g')
ALL_CC = $(shell ls *.js | egrep -v '.(dist|cc|min).js' | sed -e 's/\.js/.cc.js/g')

## Download all of our prerequisites.
bootstrap: $(BOOT_DEPENDS)

## Download the source code to jsmin.
jsmin.c:
	wget https://raw.github.com/douglascrockford/JSMin/master/jsmin.c

## Compile jsmin from the source code. Requires 'gcc'.
jsmin: jsmin.c
	gcc -o jsmin jsmin.c

## Download jQuery, our primary Javascript framework.
jquery.dist.js:
	wget -O jquery.dist.js http://code.jquery.com/jquery.min.js

## Download JSON2. It's not minified, so feel free to do so.
json2.js:
	wget https://raw.github.com/douglascrockford/JSON-js/master/json2.js

## Download Underscore, a collection of functional programming helpers.
underscore.dist.js:
	wget -O underscore.dist.js http://documentcloud.github.com/underscore/underscore-min.js

## Download LESS, a CSS extension language.
less.dist.js:
	wget -O less.dist.js http://lesscss.googlecode.com/files/less-1.3.0.min.js

## Download Closure Compiler. Requires 'unzip'.
compiler.jar:
	wget http://closure-compiler.googlecode.com/files/compiler-latest.zip
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

## Build a minified script using jsmin.
%.min.js : %.js jsmin
	./jsmin < $< > $@

## Build a "compiled" version using Closure Compiler. Requires 'java'.
%.cc.js : %.js jsc compiler.jar
	./jsc $< 

## Remove all .min.js and .cc.js files.
clean:
	rm -vf *.min.js
	rm -vf *.cc.js

## Remove everything that was downloaded or compiled.
distclean: clean
	rm -fv jsmin*
	rm -fv json2.js
	rm -fv *.dist.js

## Build .min files for all scripts.
minify_all: $(ALL_MIN)

## Build .cc files for all scripts.
compile_all: $(ALL_CC)


