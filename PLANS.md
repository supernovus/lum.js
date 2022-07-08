# Plans

## The v5 Project

I am working on shifting almost every script from this set into standalone
JS libraries available via `npm` which can be used by a bundler like
Webpack, Browserify, etc.

Because of how many of my projects are using this older bundle of scripts, 
a new `version 5` of this library package will be released which 
will use the new standalone modules and compile them into a form that makes 
them work in a *mostly* backwards compatible form with the same old `Lum` core 
object and basic namespaces.

I am going to try to keep everything in `v5` to be as compatible as possible,
with as many compatibility layers as is required to do so.

## Further down the road

Since this library set will be only a compatibility layer, these items will
have to be done in the new `@lumjs` NPM libraries.

* Standardize all jsdoc comments using JSDoc 3 format.
* Make jQuery optional anywhere possible.
* Standardize debugging using a revamped `debug` library.
* Finish the long shelved `tabs.js`, which will supplement `tabpanes.js`.

