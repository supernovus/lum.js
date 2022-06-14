# Lum.js (Nano.js) v4

## Summary

A bunch of client-side Javascript stuff for my projects that makes life easier.

This was called Nano.js for the first 3 major releases, but was renamed after I 
found a bunch of other libraries with the same (or similar) names.

There's probably several references to 'nano' or 'Nano' scattered about,
but the default global name that all libraries will be exported into is now 
'Lum'. If it's not in use, a global alias called 'Nano' will still be
exported by default for at least some semblance of backwards compatibility.

A new core.js MUST be loaded before any of the other libraries, as it defines
the _core_ APIs used by the rest.

The rest of the older object helpers have been moved into helpers.js, which is
required by a few of the more complex libraries.

## Future Plans

See the [Plans document](./PLANS.md) for details on the future direction, and
the up-coming version 5.

## Requirements

* Node.js, the Javascript runtime. The scripts expect it to be called 'node'.
* npm, the Node.js package manager.
* git, the version control software that you downloaded this with.

This is tested on a Linux operating system, but should work anywhere Node.js does. If you find platform specific issues, let me know.

## Build System

This uses Gulp 4 as it's build system.

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

## Installing deps from different dep suites

```
  ./bin/deps.js install -s <suite> [libname]
```

## Installing all packages from all dep suites

```
  ./bin/deps.js install -A
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

## Scripts location

The source code will be compiled into two output paths:

* scripts/nano/ - The ES2015+ release (compiled with terser).
* scripts/nano-es5/ - The ES5 release (compiled with Babel 7 and uglify-js).

The 'nano' in the path is a holdover from the original name of this library set.
In the future I may change it, and just use a symlink to the old path.

## Branch Note

There are several branches of Nano.js:

* v1 is the original scripts, and hasn't been updated in years.
* v2 was the first attempt at a ES2015 version, but was abandoned.
* v1.5 was the longest lasting ES5 version with multiple build systems.
* v1.6 was the last ES5 version, using Gulp 4 as it's build system.
* v3 was the first stable ES2015+ release.
* v4 is the current release with the new name.

## Authors

Some libraries were borrowed from other sources:

| Library            | Author(s)                           |
| ------------------ | ----------------------------------- |
| xmlns.jq.js        | Ryan Kelly                          |
| uuid.js            | Robert Kieffer                      |
| selectboxes.jq.js  | Sam Collett, Tim Totten             |
| riot.\*.js         | Mutt Inc. + contributors            |
| observable.js      | Mutt Inc. + contributors            |
| format_xml.js      | Multiple contributors               |
| format_json.js     | Ketan Jetty, Tim Totten             |

Anything not in that list was written by Tim Totten.

## License

Some of the libraries written by third parties are licensed separately:

| Library     | License                                             |
| ----------- | --------------------------------------------------- |
| xmlns.jq.js | Dual licensed under the MIT and GPL licenses.       |
| uuid.js     | Dual licensed under the MIT and GPL licenses.       |
| selectboxes.jq.js | Dual licensed under the MIT and GPL licenses. |

Anything not in the list are licensed under the [MIT license](https://spdx.org/licenses/MIT.html).

