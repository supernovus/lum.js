# Plans

The long-term goal is to convert Lum.js into a set of standalone JS modules
that will be available via `npm` and can be used using a bundler like
Webpack or Browserify.

Additionally, a new `version 5` of this library package will be released which 
will use the new standalone modules and compile them into a form that makes 
them work in a mostly backwards compatible form with the same old `Lum` core 
object and basic namespaces.

Some of the libraries are going to get nuked and won't have replacements.
A bunch of deprecated aliases are going to go away as well.

The `Nano` global alias that has been exported will be nuked. It's `Lum` now.

## Scheduled for deprecation

* `promise.js`: This whole library will be deprecated, but not removed.
* `tests/promise.js`: The test for the above library, also deprecated.

## Scheduled for removal

The following list is scheduled to be *removed* in version 5.

* From `core.js`:
  * `Lum._.DESC_*` contants; use `Lum._.DESC.*` factory properties instead.
  * `Lum._.CLONE_*` constants; use `Lum._.CLONE.*` enum properties instead.
  * `Lum._.is_*` methods; use the camelCase function names instead.
* From `arrayutils.js`:
  * `Lum.array.indexOf` method; use `Array.indexOf()` instead.
  * `Lum.array.contains` method; use `Array.includes()` instead.
* Libraries moved to core modules:
  * `dynamic_functions.js`
  * `load.js`
  * `observable.js`
* `deprecated.js`: ironically this is deprecated
* `helpers/extend.js`: long deprecated, time to die
* `polyfill/string_repeat.js`: bye bye
* `webservice/compat.js`: long deprecated as well.
* `tests/helpers_extend.js`: test for removed library.

## Overhauls

* Everything using `wrap.add()` will be moved into `compat/v4-wrappers.js`.
* The `Lum.Wrapper` library will be moved out of the core, into `wrappers.js`.
* Rename `helpers.js` to `obj.js`.
* Move `*.jq.js` to a `jq` subfolder and remove `.jq` from the filename.
* Update all the tests to work with the new versions.

## Further down the road

Since this library set will be only a compatibility layer, these items will
have to be done in the new `@lumjs` NPM libraries.

* Standardize all jsdoc comments using JSDoc 3 format.
* Make jQuery optional anywhere possible.
* Standardize debugging using a revamped `debug` library.
* Finish the long shelved `tabs.js`, which will supplement `tabpanes.js`.

