# Nano.js v1.5

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

## Requirements

* Node.js, the Javascript runtime. The scripts expect it to be called 'node'.
* npm, the Node.js package manager.
* git, the version control software that you downloaded this with.

This is tested on a Linux operating system, but should work anywhere Node.js does. If you find platform specific issues, let me know.

## Build System

Nano.js supports either 'gulp' or 'grunt' as a build system. You could actually
install both of them if you want, you'll just use more disk space.

I started with grunt when I began the project, but have switched to gulp now.

Pick whichever one you are more familiar with.

## Setup

* Run 'npm install' to install development dependencies.
* Run './bin/download-deps.js' to download external resource scripts.

* If you want to use 'gulp 3' as your build system, run './bin/setup-gulp3.sh'
    * If you want to install the _gulp_ binary use: './bin/setup-gulp3.sh -g'
    * If you want to uninstall old versions first use: './bin/setup-gulp3.sh -g -u'
    * If you want to install the binary manually: 'npm install -g gulp-cli'
* If you want to use 'gulp 4' as your build system, run './bin/setup-gulp4.sh'
    * If you want to install the _gulp_ binary use: './bin/setup-gulp4.sh -g'
    * If you want to uninstall old versions first use: './bin/setup-gulp4.sh -g -u'
    * If you want to install the binary manually: 'npm install -g "gulpjs/gulp#4.0"'
* If you want to use 'grunt' as your build system, run './bin/setup-grunt.sh'

* Run 'gulp' or 'grunt' to compile the source files into website scripts.

## Optional Features

* Run 'npm install semantic-ui' to install Semantic-UI.
    * When it asks for a target location, make sure to install it into 'ext/semantic' as our symlinks point there.
* Run 'git submodule init && git submodule update' to install:
    * Ace editor libraries.
    * Crypto.js libraries.
* Run './bin/setup-sass.sh' to install SASS components for grunt and/or gulp.
* Run './bin/download-deps.js --suite riot' to download Riot.js libraries.
* Run './bin/setup-riot.sh' to install Riot.js components for grunt and/or gulp.

## Updating downloaded dependencies

Eventually the download-deps script will have proper version checking and will 
be able to redownload only outdated scripts. Until then, you can force the
script to redownload all dependencies using the following:

  ./bin/download-deps.js --redownload

If you downloaded the Riot.js libraries using download-deps, it can also
be updated using the same method:

  ./bin/download-deps.js --suite riot --redownload

## Use in your own projects

* Copy or symbolically link the 'node_modules' directory.
* If using 'gulp', copy the 'gulpfile.js' into your own project and customize as required for your needs.
* If using 'grunt', copy or symlink the 'Gruntfile.js' into your own project.
* If using 'grunt', copy the contents of the grunt/ directory into your project and customize them as required for your needs.
* When Nano.php is added to Github, it has a script which can set up new projects, and install both it and Nano.js into your project root. I will update this documentation when it is available.

## Cleanup

* If using 'gulp'
    * Run 'gulp clean' to remove compiled libraries.
    * Run 'gulp cleandeps' to remove downloaded libraries.
    * Run 'gulp distclean' to remove everything.
* If using 'grunt'
    * Run 'grunt clean:release' to remove compiled libraries.
    * Run 'grunt clean:downloads' to remove downloaded libraries.
    * Run 'grunt clean' to remove everything.

There is no automated way to remove the modules installed by npm.
Just delete the 'node_modules' directory if you really want a clean slate.

## Note

This is based on the Nano.js v2 project that I built to be an ES6 library
set using Babel to transpile the code to ES5. It was based on using RequireJS
as a script loader, and was simply too complicated to work well.

This version retains the v1 libraries and ES5 syntax, while supporting some
of the advanced features from the v2 implementation. Eventually when every
major browser supports ES6 out of the box, and Babel and RequireJS are no
longer needed, I will make a new v3 using the v2 syntax, but all of the
updates from these libraries.

This is to be considered the active branch of Nano.js

## Author

Timothy Totten <2010@totten.ca>

## License

[Artistic License 2.0](http://www.perlfoundation.org/artistic_license_2_0)

