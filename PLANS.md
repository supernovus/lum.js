# Plans

As each of the existing libraries (including the `core`) is extracted into
individual libraries, I want to ensure there is a compatibility layer for
projects using this monolithic bundle of old-style browser scripts.

That's what `v5` is going to be, a compatibility layer, wrapping each of
the new `@lumjs` NPM libraries into bundled, backwards-compatible forms.

## Export Types

With the new libraries, there are a few types of export styles 
I'll document here. In all cases even if the `ClassName` has capitals, the 
`classname.js` source file will be in all lowercase.

| Identifier style | Description |
| ---------------- | ----------- |
| `lib` | A small enough library that the whole thing is in the `index.js` file. |
| `lib:` | There are multiple source files, but this is referring to the `index.js` itself. |
| `lib.item` | A module that exports a single object or function into the library. |
| `lib:module` | A module that exports multiple items into the library namespace. |
| `lib.namespace:`  | A nested namespace object with multiple items inside it. |
| `lib.ns:module` | A nested namespace with modular source files. Will be a sub-folder. |
| `lib:module.item` | If the module source file has a different name than the exported item. |

## Core Modules

In the last few releases of `v4` the monolithic `core.js` was split into
a bunch of smaller files to make it more manageable, but they were all
still compiled into a single file.

The modules that made up the `core.js` will now be split off into a few standalone libraries. 

- [x] [@lumjs/core]
  - [x] `typechecks.js` → `core.types:` → `def()`
  - [x] `header.js` → `core.context:` ← Any code related to context.
  - [x] `context.js` → `core.context:` ← Refactored significantly.
  - [x] `objectpaths.js` → `core.obj:ns`
  - [x] `ns.js` → `core.obj:ns` ← Only small portions.
  - [x] `clone.js` → `core.obj:clone`, `core.obj:lock`, `core.obj:merge` ← Split up further.
  - [x] `strings.js` → `core.strings:`
  - [x] `flags.js` → `core.flags:`
  - [x] `opt.js` → `core.opt:`
  - [x] `objectid.js` → `core:objectid` → `InternalObjectId`, `randomNumber()`
  - [x] `meta.js` → `core:meta` → `stacktrace()`, `AbstractClass`, `Functions`
  - [x] `enum.js` → `core.Enum`
  - [x] `lazy.js` → `core.lazy`
  - [x] `observable.js` → `core.observable`
  - [x] `arrays.js` → `core.arrays:` ← Only `powerset()` and `random()`, the rest remain here.
  - Introduces new `def()` method that is a simpler replacement for `prop()`.
- [x] [@lumjs/simple-loader]
  - [x] `load.js` → `simple-loader`
- [x] [@lumjs/wrapper]
  - [x] `wrapper.js` → `wrapper`
- [x] [@lumjs/compat]
  - [x] `prop.js` → `compat:v4:meta.prop`
  - [x] `descriptors.js` → `compat:v4:meta.descriptors`
  - [x] `loadtracker.js` → `compat:v4:loadtracker`
- [x] [@lumjs/global-object] (package-local; not available in `npm`)
  - [x] `header.js` → `global-object:`
  - [x] `lum-self.js` → `global-object:`
  - [x] `footer.js` → `global-object:`
  - [x] `ns.js` → `global-object.ns:`
  - [x] `utils.js` → `global-object:utils._`
  - [x] `lib.js` → `global-object.lib:`
  - [x] `jq.js` → `global-object.jq:`

## Standalone libraries

Most of the current libraries in the `src/js` folder will be moved into 
new standalone libraries. There's a few exceptions in cases where the library
is deprecated entirely, or there's already an implementation that can be used
instead of our own.

- [x] [@lumjs/when-events]
  - `whenreceived.js` → `when-events.WhenReceived`
  - `whenready.js` → `when-events.WhenReady`
- [ ] [@lumjs/model-base]
  - `modelapi.js` → `model-base`
- [ ] [@lumjs/debug]
  - `debug.js` → `debug:` ← A basic `Debug` class only depends on `core`.
- [ ] [@lumjs/format-json]
  - `format_json.js` → `format-json`
- [ ] [@lumjs/format-xml]
  - `format_xml.js` → `format-xml`
- [ ] [@lumjs/tax]
  `tax.js` → `tax`
- [ ] [@lumjs/expressions]
  - `expression.js` → `expressions:`
- [ ] [@lumjs/grid]
  - `grid.js` → `grid:` ← Just the `Grid` class.
- [x] [@lumjs/oquery]
  - `oquery.js` → `oquery`
- [x] [@lumjs/arrays]
  - Moving a couple functions to `@lumjs/core/arrays` and leaving the rest here.
- [ ] [@lumjs/encode]
  - `encode.js` → `encode:`
- [ ] [@lumjs/webservice]
  - `webservice.js` → `webservice:`
  - This will be split up into modules.
  - A new `FetchTransport` class will be default for the npm library.
  - The `v5` wrapper library will still use `JQueryTransport` as its default. 
- [ ] [@lumjs/service-worker]
  - `service_worker.js` → `service-worker.context:` ← All `ServiceWorkerGlobalContext` features.
  - `service_worker.js` → `service-worker.window:` ← All `window` context features.
- [ ] [@lumjs/web-view-controller]
  - `viewcontroller.js` → `web-view-controller:`
- [ ] [@lumjs/web-user-data]
  - `userdata.js` -> `web-data:`
- [ ] [@lumsj/web-tabs]
  - `tabpanes.js` -> `web-tabs.Panes`
  - `tabs.js` -> `web-tabs.Tabs` ← Previously unfinished library.
- [ ] [@lumjs/web-modal]
  - `modal.js` → `web-modal`
- [ ] [@lumjs/web-url-hash] 
  - `hash.js` → `web-url-hash:`
- [ ] [@lumjs/web-debug]
  - `debug.js` → `web-debug:` ← Extension of `debug` with `web-url-hash` support.
  - `debug.js` → `web-debug.elements:` ← The `Debug.Elements` class.
- [ ] [@lumjs/web-pager]
  - `pager.js` → `web-pager`
- [ ] [@lumjs/web-css]
  - `css.js` → `web-css`
- [ ] [@lumjs/web-context-menu]
  - `contextmenu.js` → `web-context-menu`
- [ ] [@lumjs/web-input-validation]
  - `validation.js` → `web-input-validation`
- [ ] [@lumjs/web-notifications]
  - `notifications.js` → `web-notifications:`
  - Will be enhanced with support for HTML 5 Notifications.
- [ ] [@lumjs/web-listing]
  - `listing.js` → `web-listing:`
- [ ] [@lumjs/web-element-editor]
  - `elementeditor.js` → `web-element-editor:`
- [ ] [@lumjs/web-grid]
  - `grid.js` → `web-grid:` ← Just the `DisplayGrid` class.
- [ ] [@lumjs/jquery-ui-grid]
  - `grid.js` → `jquery-ui-grid:` ← Just the `UIGrid` class.
- [x] [@lumjs/jquery-plugins]
  - `exists.jq.js` → `jquery-plugins:plugin:exists`
  - `disabled.jq.js` → `jquery-plugins:plugin:disabled`
  - `selectboxes.jq.js` → `jquery-plugins:plugin:select-boxes`
  - `change_type.jq.js` → `jquery-plugins:plugin:change-type`
  - `json.jq.js` → `jquery-plugins:plugin:json-elements`
  - To enable plugins: `jquery-plugins.enable(name1, name2, ...)`
  - To disable plugins: `jquery-plugins.disable(name1, ...)`
  - There will be an API to add more plugins from other libraries.
- [x] [@lumjs/compat]
  - `helpers.js` → `compat:v4:object-helpers`
  - `deprecated.js` → `compat:v4:deprecated`
  - `promise.js` → `compat:v4:promise`

## Replaced by NPM library

A few of the libraries that were in `v4` have been replaced with the official
versions available in the NPM repositories.

 - `./render/riot2.js` ⇒ `riot-tmpl`
 - `./uuid.js` ⇒  `math.uuid`

## Tests

All of the tests formerly in the `tests` folder and using the weird `tests.js`
will be moved to the appropriate packages, and will use the new [@lumjs/tests-dom] 
library which will simply use a *virtual-DOM* for testing instead of requiring
the tests be ran inside a browser. That library is an extension of a whole
new version of the [@lumjs/tests] library, which is no longer part of this
package at all.

## Left in the `v5` repo

Finally, there are a few libraries I am simply not going to bother trying to
migrate as there is no reason to continue maintaining them. 
So they'll stay in this collection for backwards compatibility reasons, 
but will no longer be updated or supported.

 - `./helpers/extend.js`
 - `./momental.js`
 - `./render/riot1.js`
 - `./editor.js`
 - `./xmlns.js`
 - `./webservice/compat.js`
 - `./modelapi/ws_model.js`

Plus any of the former standalone libraries that were moved into the `core`
will remain with the deprecation warnings they've had since moving.

## External Dependencies

I'm going to migrate as much as I can to use `bower` to install any external
dependencies that were expected to have their own scripts in the
`./scripts/ext/` folder. In the case that a package is not available in
`bower`, I'll add it to a small, simplified download list.

A bunch of dependencies I haven't used in ages or never got around to using,
I'm just dropping from the collection entirely. Bye bye.

## That's all folks

Once all of the items above are done, and the `v5` branch has working
compatibility wrappers for all of the libraries that were in `v4`, this
library set will have evolved into its final form. All future work will
be done in the standalone libraries.

[@lumjs/core]: https://github.com/supernovus/lum.core.js
[@lumjs/global-object]: https://github.com/supernovus/lum.js/tree/v5/src/pkg/@lumjs/global-object
[@lumjs/simple-loader]: https://github.com/supernovus/lum.simple-loader.js
[@lumjs/wrapper]: https://github.com/supernovus/lum.wrapper.js

[@lumjs/when-events]: https://github.com/supernovus/lum.when-events.js
[@lumjs/model-base]: https://github.com/supernovus/lum.model-base.js
[@lumjs/debug]: https://github.com/supernovus/lum.debug.js
[@lumjs/format-json]: https://github.com/supernovus/lum.format-json.js
[@lumjs/format-xml]: https://github.com/supernovus/lum.format-xml.js
[@lumjs/tax]: https://github.com/supernovus/lum.tax.js
[@lumjs/expressions]: https://github.com/supernovus/lum.expressions.js
[@lumjs/grid]: https://github.com/supernovus/lum.grid.js
[@lumjs/oquery]: https://github.com/supernovus/lum.oquery.js
[@lumjs/arrays]: https://github.com/supernovus/lum.arrays.js
[@lumjs/encode]: https://github.com/supernovus/lum.encode.js
[@lumjs/webservice]: https://github.com/supernovus/lum.webservice.js

[@lumjs/tests]: https://github.com/supernovus/lum.tests.js
[@lumjs/tests-dom]: https://github.com/supernovus/lum.tests-dom.js

[@lumjs/web-view-controller]: https://github.com/supernovus/lum.web-view-controller.js
[@lumjs/web-data]: https://github.com/supernovus/lum.web-data.js
[@lumsj/web-tabs]: https://github.com/supernovus/lum.web-tabs.js
[@lumjs/web-modal]: https://github.com/supernovus/lum.web-modal.js
[@lumjs/web-url-hash]: https://github.com/supernovus/lum.web-url-hash.js
[@lumjs/web-debug]: https://github.com/supernovus/lum.web-debug.js
[@lumjs/web-pager]: https://github.com/supernovus/lum.web-pager.js
[@lumjs/web-css]: https://github.com/supernovus/lum.web-css.js
[@lumjs/web-context-menu]: https://github.com/supernovus/lum.web-context-menu.js
[@lumjs/web-input-validation]: https://github.com/supernovus/lum.web.input-validation.js
[@lumjs/web-notifications]: https://github.com/supernovus/lum.web-notifications.js
[@lumjs/web-listing]: https://github.com/supernovus/lum.web-listing.js
[@lumjs/web-grid]: https://github.com/supernovus/lum.web-grid.js
[@lumjs/web-element-editor]: https://github.com/supernovus/lum.web-element-editor.js
[@lumjs/web-code-editor]: https://github.com/supernovus/lum.web-code-editor.js

[@lumjs/service-worker]: https://github.com/supernovus/lum.service-worker.js

[@lumjs/jquery-plugins]: https://github.com/supernovus/lum.jquery-plugins.js

[@lumjs/compat]: https://github.com/supernovus/lum.compat.js