# History

These libraries have gone through many extreme changes over the years.

* v1 (2012~2015)
  * Where it all started, a bunch of standalone scripts.
  * Used [Artistic License 2.0](https://spdx.org/licenses/Artistic-2.0.html)
  * Supported Google Closure Compiler (`jsc`), `jsmin`, and `uglifyjs`.
  * Very dependent on jQuery.
  * Earliest versions didn't use any namespaces at all.
  * Started using `Nano` namespace in May 2013.
  * For a time it used a bunch of stuff from riot.js (v1 and later v2).
  
* v2 (2015)
  * This was the first attempt at a ES2015 version.
  * Moved to `grunt` as the build system.
  * Abandoned when I became frustrated with the state of ES2015 in browsers.

* v1.5 (2015~2019) 
  * Started with the `v1` codebase, but using `grunt` build system from `v2`.
  * Added support for external `ace` editor component.
  * Added support for external `cryptojs` libraries.
  * Added support for `gulp3` and later `gulp4` build systems.
  * Added support for compiling CSS using `sass`.
  * A whole lot of modularization of the libraries.

* v1.6 (2019) 
  * Removed support for `grunt` and `gulp3`; it's `gulp4` only now.
  * This was the last version written in ES5.

* v3 (2019) 
  * Moved to ES2015+ codebase using classes and modern JS features.
  * Switched to [MIT](https://spdx.org/licenses/MIT.html) license.

* v4 (2019~2023)
  * Changed from `Nano` to `Lum` namespace.
  * Changed the project name/url to `lum.js`.
  * Rewrote the `core` into a required base library.
  * As of September 2022, I started the `@lumjs` libraries.
    * So `v4` is now in maintenance-only mode.
    * Only bug fixes and dep updates will be applied.

* v5 (2022~2023) 
  * Was planned to be a full compatibility layer using `@lumjs` npm libraries.
  * In late July 2023, I decided to abandon that idea.
  * I'll instead just be moving all my projects to use the new libraries.
  * This old library set will simply be retired entirely.

