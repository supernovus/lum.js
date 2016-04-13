# Nano.js v1.5

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

It will Uglify the script sources, and also supports compiling Riot.js tag 
files and SCSS/Sass stylesheets (it uses libsass, which may have a few 
limitations compared to the Ruby Sass compiler, but is faster and can be 
installed with NPM rather than requiring another OS package.)

## Requirements

* Node.js, the Javascript runtime. The scripts expect it to be called 'node'.
* npm, the Node.js package manager.
* git, the version control software that you downloaded this with.

This is tested on a Linux operating system, but should work anywhere Node.js does. If you find platform specific issues, let me know.

## Setup

* If you don't have a _grunt_ binary run: 'npm install -g grunt-cli'.
* If you don't have a _gulp_ binary run: 'npm install -g gulp-cli'

* Run 'npm install' to install development dependencies.
* Run './bin/download-deps.js' to download external resource scripts.

* If you want to use 'grunt' as your build system, run './bin/setup-grunt.sh'
* If you want to use 'gulp' as your build system, run './bin/setup-gulp.sh'

* Run 'grunt' or 'gulp' to compile the source files into website scripts.

## Optional Features

* Run 'npm install semantic-ui' to install Semantic-UI.
    * When it asks for a target location, make sure to install it into 'ext/semantic' as our symlinks point there.
* Run 'git submodule init && git submodule update' to install:
    * Ace editor libraries.
    * Crypto.js libraries.
* Run './bin/setup-sass.sh' to install SASS components for grunt and/or gulp.
* Run './bin/setup-riot.sh' to install Riot.js components for grunt and/or gulp.

## Use in your own projects

* Copy or symbolically link the 'node_modules' directory.
* If using 'grunt', copy or symlink the 'Gruntfile.js' into your own project.
* If using 'grunt', copy the contents of the grunt/ directory into your project and customize them as required for your needs.
* If using 'gulp', copy the 'gulpfile.js' into your own project and customize as required for your needs.
* When Nano.php is added to Github, it has a script which can set up new projects, and install both it and Nano.js into your project root. I will update this documentation when it is available.

## Cleanup

* Run 'grunt clean:release' to remove compiled libraries.
* Run 'grunt clean:downloads' to remove downloaded libraries.
* Run 'grunt clean' to remove anything added by grunt.

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

