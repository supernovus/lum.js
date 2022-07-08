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

The modules that made up the `core.js` will now be split off into **4** standalone libraries. 

- [x] [@lumjs/core]
  - [x] `typechecks.js` → `core.types:` → `def()`
  - [x] `header.js` → `core.context:` ← Any code related to context.
  - [x] `context.js` → `core.context:` ← Refactored significantly.
  - [x] `objectpaths.js` → `core.obj:ns`
  - [x] `ns.js` → `core.obj:ns` ← Only small portions.
  - [x] `clone.js` → `core.obj:clone`, `core.obj:lock`, `core.obj:merge` ← Split up further.
  - [x] `strings.js` → `core.strings:`
  - [x] `flags.js` → `core.flags:`
  - [x] `descriptors.js` → `core.descriptors:` → `DESC`
  - [x] `opt.js` → `core.opt:`
  - [x] `objectid.js` → `core:objectid` → `InternalObjectId`, `randomNumber()`
  - [x] `meta.js` → `core:meta` → `stacktrace()`, `AbstractClass`, `Functions`
  - [x] `enum.js` → `core.Enum`
  - [x] `prop.js` → `core.prop`
  - [x] `lazy.js` → `core.lazy`
  - [x] `observable.js` → `core.observable`
- [ ] [@lumjs/global-object]
  - [ ] `header.js` → `global-object:`
  - [ ] `lum-self.js` → `global-object:`
  - [ ] `footer.js` → `global-object:`
  - [ ] `ns.js` → `global-object.ns:`
  - [ ] `utils.js` → `global-object:utils._`
  - [ ] `loadtracker.js` → `global-object.LoadTracker`
  - [ ] `lib.js` → `global-object.lib:`
  - [ ] `jq.js` → `global-object.jq:`
- [ ] [@lumjs/simple-loader]
  - [ ] `load.js` → `simple-loader`
- [ ] [@lumjs/wrapper]
  - [ ] `wrapper.js` → `wrapper`

## Standalone libraries

Most of the current libraries in the `src/js` folder will be moved into 
new standalone libraries. There's a few exceptions in cases where the library
is deprecated entirely, or there's already an implementation that can be used
instead of our own.

- [ ] [@lumjs/when-events]
  - `whenreceived.js` → `when-events.WhenReceived`
  - `whenready.js` → `when-events.WhenReady`
- [ ] [@lumjs/model-base]
  - `modelapi.js` → `model-base`
- [ ] [@lumjs/debug]
  - `debug.js` → `debug:`
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
- [ ] [@lumjs/oquery]
  - `oquery.js` → `oquery`
- [ ] [@lumjs/arrays]
  - `arrayutils.js` → `arrays`
  - A few methods like `indexOf`, `contains`, and `extends` will be removed.
  - Some new methods ported from the corresponding PHP library will be added.
- [ ] [@lumjs/encode]
  - `encode.js` → `encode:`
- [ ] [@lumjs/webservice]
  - `webservice.js` → `webservice:`
  - This will be split up into modules.
  - A new `FetchTransport` class will be default for the npm library.
  - The `v5` wrapper library will still use `JQueryTransport` as its default. 
- [x] [@lumjs/tests]
  - `test.js` → `tests.Test`, `tests:log`
  - Added a `tests.functional` feature similar to the PHP version.
  - Also planning on adding a JS `tests.Harness` class like the PHP version.
- [ ] [@lumjs/tests-browser]
  - `tests.js` -> `tests-browser`
  - This class is weird and may need some rewriting.
- [ ] [@lumjs/service-worker-context]
  - `service_worker.js` → `service-worker-context:` ← All `ServiceWorkerGlobalContext` features.
- [ ] [@lumjs/service-worker-window]
  - `service_worker.js` → `service-worker-window:` ← All `window` context features.
- [ ] [@lumjs/web-view-controller]
  - `viewcontroller.js` → `web-view-controller:`
- [ ] [@lumjs/web-data]
  - `userdata.js` -> `web-data:`
- [ ] [@lumsj/web-tabs]
  - `tabpanes.js` -> `web-tabs.Panes`
  - `tabs.js` -> `web-tabs.Tabs` ← Previously unfinished library.
- [ ] [@lumjs/web-modal]
  - `modal.js` → `web-modal`
- [ ] [@lumjs/web-url-hash] 
  - `hash.js` → `web-url-hash:`
- [ ] [@lumjs/web-pager]
  - `pager.js` → `web-pager`
- [ ] [@lumjs/web-css]
  - `css.js` → `web-css`
- [ ] [@lumjs/web-context-menu]
  - `contextmenu.js` → `web-context-menu`
- [ ] [@lumjs/web-input-validation]
  - `validation.js` → `web-input-validation`
  - `notifications.js` → `web-notifications:`
- [ ] [@lumjs/web-listing]
  - `listing.js` → `web-listing:`
- [ ] [@lumjs/web-element-editor]
  - `elementeditor.js` → `web-element-editor:`
- [ ] [@lumjs/web-code-editor]
  - `editor.js` → `web-code-editor:`
- [ ] [@lumjs/web-grid]
  - `grid.js` → `web-grid:` ← Just the `DisplayGrid` class.
- [ ] [@lumjs/jquery-ui-grid]
  - `grid.js` → `jquery-ui-grid:` ← Just the `UIGrid` class.
- [ ] [@lumjs/jquery-plugins]
  - `exists.jq.js` → `jquery-plugins:exists`
  - `disabled.jq.js` → `jquery-plugins:disabled`
  - `selectboxes.jq.js` → `jquery-plugins:select-boxes`
  - `change_type.jq.js` → `jquery-plugins:change-type`
  - `json.jq.js` → `jquery-plugins:json-elements`
  - `xmlns.jq.js` → `jquery-plugins:xmlns`
  - To enable plugins: `jquery-plugins.enable(name1, name2, ...)`
  - To disable plugins: `jquery-plugins.disable(name1, ...)`
  - There will be an API to add more plugins from other libraries.

## Replaced by NPM library

A few of the libraries that were in `v4` have been replaced with the official
versions available in the NPM repositories.

 - `./render/riot2.js` ⇒ `riot-tmpl`
 - `./uuid.js` ⇒  `math.uuid`

## Left in the `v5` repo

Finally, there are a few libraries I am simply not going to bother trying to
migrate as they've been deprecated for some time now and there's no reason
to continue maintaining them. So they'll stay in this collection for
backwards compatibility reasons, but will no longer be updated or supported.

 - `./docs/core.js`
 - `./helpers/extend.js`
 - `./momental.js`
 - `./deprecated.js`
 - `./render/riot1.js`
 - `./helpers.js`
 - `./promise.js`
 - `./webservice/compat.js`
 - `./modelapi/ws_model.js`

Plus any of the former standalone libraries that were moved into the `core`
will remain with the deprecation warnings they've had since moving.

## That's all folks

Once all of the items above are done, and the `v5` branch has working
compatibility wrappers for all of the libraries that were in `v4`, this
library set will have evolved into its final form. All future work will
be done in the standalone libraries.

[@lumjs/core]: https://github.com/supernovus/lum.core.js
[@lumjs/global-object]: https://github.com/supernovus/lum.global-object.js
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
[@lumjs/tests-browser]: https://github.com/supernovus/lum.tests-browser.js

[@lumjs/web-view-controller]: https://github.com/supernovus/lum.web-view-controller.js
[@lumjs/web-data]: https://github.com/supernovus/lum.web-data.js
[@lumsj/web-tabs]: https://github.com/supernovus/lum.web-tabs.js
[@lumjs/web-modal]: https://github.com/supernovus/lum.web-modal.js
[@lumjs/web-url-hash]: https://github.com/supernovus/lum.web-url-hash.js
[@lumjs/web-pager]: https://github.com/supernovus/lum.web-pager.js
[@lumjs/web-css]: https://github.com/supernovus/lum.web-css.js
[@lumjs/web-context-menu]: https://github.com/supernovus/lum.web-context-menu.js
[@lumjs/web-input-validation]: https://github.com/supernovus/lum.web.input-validation.js
[@lumjs/web-notifications]: https://github.com/supernovus/lum.web-notifications.js
[@lumjs/web-listing]: https://github.com/supernovus/lum.web-listing.js
[@lumjs/web-grid]: https://github.com/supernovus/lum.web-grid.js
[@lumjs/web-element-editor]: https://github.com/supernovus/lum.web-element-editor.js
[@lumjs/web-code-editor]: https://github.com/supernovus/lum.web-code-editor.js

[@lumjs/service-worker-context]: https://github.com/supernovus/lum.service-worker-context.js
[@lumjs/service-worker-window]: https://github.com/supernovus/lum.service-worker-window.js

[@lumjs/jquery-plugins]: https://github.com/supernovus/lum.jquery-plugins.js
