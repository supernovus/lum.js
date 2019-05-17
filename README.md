# Nano.js v1.6.x

## Summary

A bunch of common Javascript stuff for my projects that makes life easier.

## Requirements

* Node.js, the Javascript runtime. The scripts expect it to be called 'node'.
* npm, the Node.js package manager.
* git, the version control software that you downloaded this with.

This is tested on a Linux operating system, but should work anywhere Node.js does. If you find platform specific issues, let me know.

## Build System

Nano.js v1.6 has moved to Gulp v4 exclusively.

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

