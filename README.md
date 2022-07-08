# Lum.js (Nano.js) v5

## Summary

This is the `v5` branch of my old-style Javascript libraries.
See the [Plans document](./PLANS.md) for a list of the new libraries that 
will both replace and power this collection.

### THIS BRANCH IS CURRENTLY NON-FUNCTIONAL

Yeah, it's heavily under construction as I slowly implement the new libraries,
so right now it's quite broken. My projects are sticking with the `v4` branch
for now.

## Branch Note

There are several branches of Nano.js:

* v1 is the original scripts, and hasn't been updated in years.
* v2 was the first attempt at a ES2015 version, but was abandoned.
* v1.5 was the longest lasting ES5 version with multiple build systems.
* v1.6 was the last ES5 version, using Gulp 4 as it's build system.
* v3 was the first stable ES2015+ release.
* v4 was the first release with the new name, and introduced the new Lum core object and a bunch of features to make handling libraries easier.
* v5 is this version, which tries to be as close to `v4` as possible, while using the new `@lumjs` npm packages behind the scenes.

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

