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
###  .ug.js    -- A library that we have compiled using UglifyJS.
###  .js       -- A raw source library.
###
##############################################################################

## Bootstrap stuff.
BOOT_COMPILERS = jsmin compiler.jar
BOOT_SCRIPTS = jquery.dist.js json3.dist.js riot.dist.js riot.min.js.map
BOOT_DEPENDS = $(BOOT_COMPILERS) $(BOOT_SCRIPTS)

## Optional scripts.
MORE_SCRIPTS = underscore.dist.js less.dist.js moment.dist.js yepnope.js modernizr.js sprintf.js bowser.dist.js

## Listings for the minify_all and compile_all targets.
ALL_MIN = $(shell ls *.js | egrep -v '.(dist|cc|min|ug).js' | sed -e 's/\.js/.min.js/g')
ALL_CC = $(shell ls *.js | egrep -v '.(dist|cc|min|ug).js' | sed -e 's/\.js/.cc.js/g')
ALL_UGLY = $(shell ls *.js | egrep -v '.(dist|cc|min|ug).js' | sed -e 's/\.js/.ug.js/g') 

## Download URLs, update as required.
JSMIN_URL = https://raw.github.com/douglascrockford/JSMin/master/jsmin.c
JQUERY_URL = http://code.jquery.com/jquery.min.js
JSON_URL = http://cdnjs.cloudflare.com/ajax/libs/json3/3.2.4/json3.min.js
UNDERSCORE_URL = http://documentcloud.github.com/underscore/underscore-min.js
LESS_URL = http://lesscss.googlecode.com/files/less-1.3.0.min.js
CC_URL = http://dl.google.com/closure-compiler/compiler-latest.zip 
MOMENT_URL = http://momentjs.com/downloads/moment.min.js
YEPNOPE_URL = https://raw.github.com/SlexAxton/yepnope.js/master/yepnope.js
RIOT_URL=https://raw.github.com/muut/riotjs/master/riot.min.js
RIOT_MAP_URL=https://raw.github.com/muut/riotjs/master/riot.min.js.map
MODERNIZR_URL=http://modernizr.com/downloads/modernizr-latest.js
SPRINTF_URL=https://raw.github.com/alexei/sprintf.js/master/src/sprintf.js
BOWSER_URL=https://raw.githubusercontent.com/ded/bowser/master/bowser.min.js

## Download all of our prerequisites.
bootstrap: $(BOOT_DEPENDS)

## Download everything.
all: bootstrap $(MORE_SCRIPTS)

## Download the source code to jsmin.
jsmin.c:
	wget $(JSMIN_URL)

## Compile jsmin from the source code. Requires 'gcc'.
jsmin: jsmin.c
	gcc -o $@ $<

## Download jQuery, our primary Javascript framework.
jquery.dist.js:
	wget -O $@ $(JQUERY_URL)

## Download JSON 3.
json3.dist.js:
	wget -O $@ $(JSON_URL)

## Download Underscore, a collection of functional programming helpers.
underscore.dist.js:
	wget -O $@ $(UNDERSCORE_URL)

## Download LESS, a CSS extension language.
less.dist.js:
	wget -O $@ $(LESS_URL)

## Download Moment, a datetime parsing/formatting library.
moment.dist.js:
	wget -O $@ $(MOMENT_URL)

## Download YepNope, a dependency manager.
yepnope.js:
	wget -O $@ $(YEPNOPE_URL)

## Download Modernizr, a feature testing library.
modernizr.js:
	wget -O $@ $(MODERNIZR_URL)

## Download sprintf.
sprintf.js:
	wget -O $@ $(SPRINTF_URL)

## Download Riot, a MVP framework.
riot.dist.js:
	wget -O $@ $(RIOT_URL)

## Download the map file for Riot.
riot.min.js.map:
	wget -O $@ $(RIOT_MAP_URL)

## Download bowser, a browser detection library.
bowser.dist.js:
	wget -O $@ $(BOWSER_URL)

## Download Closure Compiler. Requires 'unzip'.
compiler.jar:
	wget $(CC_URL)
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

## Build a minified script using jsmin.
%.min.js : %.js jsmin
	./jsmin < $< > $@

## Build a "compiled" version using Closure Compiler. Requires 'java'.
%.cc.js : %.js jsc compiler.jar
	./jsc $< 

## Build a Uglified script using UglifyJS2.
## Unlike the other two, we don't install uglify for you.
## Use 'npm install -g uglify-js' to install it.
%.ug.js : %.js
	uglifyjs $< -o $@

## Remove all .min.js and .cc.js files.
clean:
	rm -vf *.min.js
	rm -vf *.cc.js
	rm -vf *.ug.js

## Remove everything that was downloaded or compiled.
distclean: clean
	rm -fv compiler.jar
	rm -fv jsmin*
	rm -fv *.dist.js
	rm -fv *.map
	rm -fv modernizr.js
	rm -fv yepnope.js

## Build .min files for all scripts.
minify_all: $(ALL_MIN)

## Build .cc files for all scripts.
compile_all: $(ALL_CC)

## Build .ug files for all scripts.
uglify_all: $(ALL_UGLY)

