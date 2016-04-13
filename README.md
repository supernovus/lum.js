# Nano.js v1.5

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

It will Uglify the script sources, and also supports compiling Riot.js tag 
files and SCSS/Sass stylesheets (it uses libsass, which may have a few 
limitations compared to the Ruby Sass compiler, but is faster and can be 
installed with NPM rather than requiring another OS package.)

## Requirements

This has been tested in a Linux environment, but will likely work anywhere
that Node.js does. The software requirements are Node.js with its NPM package
manager. Everything else will be installed using 'npm' or 'grunt'.

## Setup

If you don't have a _grunt_ binary run: 'npm install -g grunt-cli'.

* Run 'npm install' to install development dependencies.
* Run 'node download-deps.js' to download external resource scripts.
* Run 'npm install semantic-ui' to install Semantic-UI (if desired.)
* Run 'grunt' to compile the source files into website scripts.

## Use in your own projects

* Copy or symbolically link the 'node_modules' directory and 'Gruntfile.js' into your own project.
* Copy the contents of the grunt/ directory into your own project and customize them as required for your needs.
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

