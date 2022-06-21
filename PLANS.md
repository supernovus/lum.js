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

The `Nano` global alias that has been exported will be nuked.

## Methods and properties to be removed

Everything using `wrap.add()`, regardless of file will go. In addition the
following list is scheduled to be removed in version 5.

* From `core.js`:
  * `Lum._.DESC_*` contants; use `Lum._.DESC.*` factory properties instead.
  * `Lum._.CLONE_*` constants; use `Lum._.CLONE.*` enum properties instead.
  * `Lum._.is_*` methods; use the camelCase function names instead.

## Files/libraries to be removed

* `helpers/extend.js`
* `polyfill/string_repeat.js`
* `promise.js`
* `webservice/compat.js`
* `tests/helpers_extend.js`
* `tests/promise.js`

## Overhauls

* Split `helpers.js` into `obj.js` and `opt.js` libraries.
* Change all direct assignments to `Lum.obj` into `prop()` assignments.
* Finish the long shelved `tabs.js`, which will replace `tabpanes.js`.
* Move `*.jq.js` to a `jq` subfolder and remove `.jq` from the filename.
