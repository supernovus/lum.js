.PHONY: DEFAULT clean distclean bootstrap minify_all compile_all
.DEFAULT: help

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
BOOT_SCRIPTS = jquery.dist.js json3.dist.js riot.full.js riot.stub.js
BOOT_DEPENDS = $(BOOT_COMPILERS) $(BOOT_SCRIPTS)

## Optional scripts.
MORE_SCRIPTS = underscore.dist.js less.dist.js moment.dist.js modernizr.js sprintf.js bowser.dist.js riot.control.js uri.dist.js uri.jq.dist.js

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
MODERNIZR_URL=http://modernizr.com/downloads/modernizr-latest.js
SPRINTF_URL=https://raw.github.com/alexei/sprintf.js/master/src/sprintf.js
BOWSER_URL=https://raw.githubusercontent.com/ded/bowser/master/bowser.min.js
URI_URL=https://raw.githubusercontent.com/medialize/URI.js/gh-pages/src/URI.min.js
URI_JQ_URL=https://raw.githubusercontent.com/medialize/URI.js/gh-pages/src/jquery.URI.min.js

## riot.js specific files
RIOT_URL=https://raw.githubusercontent.com/muut/riotjs/master/
RIOT_PKG_FILE=package.json
RIOT_PREFIX=make/prefix.js
RIOT_SUFFIX=make/suffix.js
RIOT_COMPILER=lib/compiler.js
RIOT_OBSERVABLE=lib/observable.js
RIOT_ROUTER=lib/router.js
RIOT_TMPL=lib/tmpl.js
RIOT_VIEW=lib/view.js
RIOT_CONTROL_URL=https://raw.githubusercontent.com/jimsparkman/RiotControl/master/riotcontrol.js

## Show the makefile in all its glory.
help:
	less Makefile

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

## Download Modernizr, a feature testing library.
modernizr.js:
	wget -O $@ $(MODERNIZR_URL)

## Download sprintf.
sprintf.js:
	wget -O $@ $(SPRINTF_URL)

## Download URI.js
uri.dist.js:
	wget -O $@ $(URI_URL)

## Download URI jQuery plugin (requires URI)
uri.jq.dist.js:
	wget -O $@ $(URI_JQ_URL)

## Download bowser, a browser detection library.
bowser.dist.js:
	wget -O $@ $(BOWSER_URL)

## Download Closure Compiler. Requires 'unzip'.
compiler.jar:
	wget $(CC_URL)
	unzip compiler-latest.zip compiler.jar
	rm compiler-latest.zip

## riot.js components, requires node.js

## a full riot bundle, including compiler and 1.x style render() plugin.
riot.full.js: riot.default.js riot.compiler.js riot.render.js
	cat riot.default.js riot.compiler.js riot.render.js > $@

## default riot.js as per the distribution.
riot.default.js: riot.prefix.inc riot.suffix.inc riot.observable.js riot.router.js riot.tmpl.js riot.view.js
	cat riot.prefix.inc riot.observable.js riot.router.js riot.tmpl.js riot.view.js riot.suffix.inc > $@

## a stub for using riot components individually.
riot.stub.js: riot.prefix.inc riot.suffix.inc
	cat riot.prefix.inc riot.suffix.inc > $@

## the riot prefix file.
riot.prefix.inc:
	wget -O $@ $(RIOT_URL)$(RIOT_PREFIX)
	wget -O riot_package.json $(RIOT_URL)$(RIOT_PKG_FILE)
	./build_riot_prefix.sh

## the riot suffix file
riot.suffix.inc:
	wget -O $@ $(RIOT_URL)$(RIOT_SUFFIX)

## the riot tag compiler (for use with custom tag engine)
riot.compiler.js:
	wget -O $@ $(RIOT_URL)$(RIOT_COMPILER)

## the riot observable library
riot.observable.js:
	wget -O $@ $(RIOT_URL)$(RIOT_OBSERVABLE)

## the riot router library
riot.router.js:
	wget -O $@ $(RIOT_URL)$(RIOT_ROUTER)

## the riot 2.0 template engine
riot.tmpl.js:
	wget -O $@ $(RIOT_URL)$(RIOT_TMPL)

## the riot 2.0 custom tag engine (requires template engine)
riot.view.js:
	wget -O $@ $(RIOT_URL)$(RIOT_VIEW)

## RiotControl
riot.control.js:
	wget -O $@ $(RIOT_CONTROL_URL)

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
	uglifyjs $< -m -o $@

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
	rm -fv riot.*.inc riot.full.js riot.default.js riot.stub.js
	rm -fv riot.compiler.js riot.observable.js riot.router.js 
	rm -fv riot.tmpl.js riot.view.js

## Build .min files for all scripts.
minify_all: $(ALL_MIN)

## Build .cc files for all scripts.
compile_all: $(ALL_CC)

## Build .ug files for all scripts.
uglify_all: $(ALL_UGLY)

