# Nano.js v2

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

The source is written in ES6, and uses Babel to transpile it to ES5.

It also supports compiling Riot.js tag files (it's configured by default to
use ES6 as the scripting language), and SCSS/Sass stylesheets (it uses libsass,
which may have a few limitations compared to the Ruby Sass compiler, but is
faster and can be installed with NPM rather than requiring another OS package.)

## Requirements

This has been tested in a Linux environment, but will likely work anywhere
that Node.js does. The software requirements are Node.js with its NPM package
manager. Everything else will be installed using 'npm' or 'grunt'.

## Setup

If you don't have a _grunt_ binary run: 'npm install -g grunt-cli'.

Run 'npm install' to install development dependencies.
Run 'grunt download' to download external resource scripts.
Run 'grunt' to compile the source files into website scripts.

## Use in your own projects

Copy or symbolically link the 'node_modules' directory into your own project.
Copy the Gruntfile.js, package.json, and grunt/ directory into your own project
and customize them as required for your needs.

## Cleanup

Run 'grunt clean:build' to remove intermediate build files.
Run 'grunt clean:release' to remove website scripts.
Run 'grunt clean:downloads' to remove external resource scripts.
Run 'grunt clean' to remove anything added by grunt.

There is no automated way to remove the modules installed by npm.
Just delete the 'node_modules' directory if you really want a clean slate.

## Author

Timothy Totten <2010@totten.ca>

## License

[Artistic License 2.0](http://www.perlfoundation.org/artistic_license_2_0)

