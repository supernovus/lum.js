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
  gulp build
```

## Optional Features

Run `git submodule init && git submodule update` to install:

* Ace editor libraries.
* Crypto.js libraries.

## Updating downloaded dependencies

You can update downloaded dependencies using the deps.js script:

```
  ./bin/deps.js upgrade
```

Or you can simply force re-downloading all script using:

```
  ./bin/deps.js install --force
```

## More help with deps.js

Try one of the following:

```
  ./bin/deps.js --help
  ./bin/deps.js --help install
  ./bin/deps.js --help upgrade
```

## Building the tests

To build the tests (simple HTML files) simply run:

```
  gulp build-tests
```

Then you can open index.html to start browsing the tests.

If you need to, you can use gulp to launch a web server on port 8000:

```
  gulp webserver
```

It's a quick way to run a web server directly from Node.js.

Other options like 'local-web-server' exist as well, use what you like.

## Building the API Documentation

NOTE: I'm still in the process of updating the comments to the jsDoc3 format.

To build the documentation simply run:

```
  gulp build-docs
```

It'll put them into the docs/api/ folder. You can use the same web server
as the tests to view them.

## Cleanup

* Run `gulp clean` to remove compiled libraries.
* Run `gulp clean-tests` to remove the built tests.
* Run `gulp clean-docs` to remove the build API docs.
* Run `gulp clean-deps` to remove downloaded libraries.
* Run `gulp clean-npm` to remove things downloaded by npm.
* Run `gulp distclean` to remove everything.

Note if you use `gulp clean-npm` or `gulp distclean` you will need to
re-run the `npm install` command before you can use gulp again.

## Branch Note

There are several branches of Nano.js:

* v1 is the original scripts, and hasn't been updated in years.
* v2 was the first attempt at a ES2015 version, but was abandoned.
* v1.5 was the longest lasting ES5 version with multiple build systems.
* v1.6 was the last ES5 version, using Gulp 4 as it's build system.
* v3 (this) is the current ES2015+ release.

This release is once again moving to using ES2015+ as it's primary release
target, with a backwards compatible ES5 build being offered as a solution for
older browsers.

This time I'm not using ES Modules, but am using classes and other ES2015+
features. The source code will be compiled into two output paths:

* scripts/nano/ - The ES2015+ release (compiled with terser).
* scripts/nano-es5/ - The ES5 release (compiled with Babel 7 and uglify-js).

## Author

Timothy Totten <2010@totten.ca>

## License

[Artistic License 2.0](http://www.perlfoundation.org/artistic_license_2_0)

