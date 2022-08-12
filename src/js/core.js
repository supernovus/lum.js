/*
 * Lum Core Global Object: The engine that powers the Lum.js v4+ library set.
 *
 * As of v5 this is for compatibility use in web apps only.
 * Use the new standalone libraries in `npm` for anything new.
 * As such, I've dropped AMD and CJS support from this script file.
 */
(function(Lum)
{
  Lum.initWrapper().ns.$self();
})(require('@lumjs/global-object'));

