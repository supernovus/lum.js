# Nano.js v3

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

## Requirements

* Node.js, the Javascript runtime. The scripts expect it to be called 'node'.
* npm, the Node.js package manager.
* git, the version control software that you downloaded this with.

This is tested on a Linux operating system, but should work anywhere Node.js does. If you find platform specific issues, let me know.

## Build System

Nano.js v3 uses Gulp 4 as it's build system.

## Setup

```
  sudo npm install -g gulp-cli
  npm install --no-save
  ./bin/deps.js install
  gulp
```

## Optional Features

Run `git submodule init && git submodule update` to install:

* Ace editor libraries.
* Crypto.js libraries.

## Updating downloaded dependencies

You can update downloaded dependencies using the deps.js script:

  ./bin/deps.js upgrade

Or you can simply force re-downloading all script using:

  ./bin/deps.js install --force

## More help with deps.js

Try one of the following:

```
  ./bin/deps.js --help
  ./bin/deps.js --help install
  ./bin/deps.js --help upgrade
```

## Use in your own projects

* Copy or symbolically link the 'node_modules' directory.
* Copy the 'gulpfile.js' into your own project and customize as required.

## Cleanup

* Run `gulp clean` to remove compiled libraries.
* Run `gulp cleandeps` to remove downloaded libraries.
* Run `gulp distclean` to remove everything.

There is no automated way to remove the modules installed by npm.
Just delete the 'node_modules' directory if you really want a clean slate.

## Branch Note

There are several branches of Nano.js:

* v1 is the original scripts, and hasn't been updated in years.
* v2 was the first attempt at a ES2015 version, but was abandoned.
* v1.5 was the longest lasting ES5 version with multiple build systems.
* v1.6 is the current ES5+ stable release, using Gulp 4 as it's build system.
* v3 (this) is the current ES2015+ development release.

This release is once again moving to using ES2015+ as it's primary release
target, with a backwards compatible ES5 build being offered as a solution for
older browsers.

This time I'm not using ES Modules, but am using classes and other ES2015+
features. The source code will be compiled into two output paths:

* scripts/nano/ - The ES2015+ release (compiled with terser).
* scripts/nano-es5/ - The ES5 release (compiled with Babel 7 and uglify-js).

When I have all of the libraries in src/js ported and have tested both the
ES2015+ (in Chrome, Firefox, Edge, and Safari) and ES5 (in IE11), this will
become the default branch of Nano.js.

## Author

Timothy Totten <2010@totten.ca>

## License

[Artistic License 2.0](http://www.perlfoundation.org/artistic_license_2_0)

