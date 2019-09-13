# TODO

* Make sure all doc comments are in jsDoc3 format!
* Rewrite debug.js to something more useful.
* Make jQuery optional in more places.
* Support alternatives to jQuery where possible.

## v4

A new version with a new name is being planned. This will go along with
a new version of my Nano.php library set (which will also be getting renamed.)

The new version will have a new `core.js` that will be expected to be loaded
before any of the other libraries. It will contain some of the functions that
are currently in `coreutils.js`, the rest will be moved into `objectutils.js`.

While it will have a new global object name, it will have a form of backwards
compatibility by adding aliases to itself using the old 'Nano' name.

