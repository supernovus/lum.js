/**
 * UI/UX app core. Extend this to make application specific cores.
 *
 * This is now marked DEPRECATED. 
 * Please migrate to the ModelAPI and ViewController libraries.
 */

(function()
{

"use strict";

if (window.Nano === undefined)
{
  console.log("fatal error: Nano core not loaded");
  return;
}

Nano.App = function (options)
{
  // Set up debugging based on the existence of the Nano.debug library.
  if (options !== undefined && 'auto_debug' in options && options.auto_debug)
  {
    if (Nano.debug !== undefined)
    {
      this.debug = true;
    }
    else
    {
      this.debug = false;
    }
  }
  else
  {
    this.debug = false;
  }
 
  // Keeps track of what has been initialized already, so dependency-based
  // initialization can work properly. 
  this._inittab = {};

}

Nano.App.prototype.initialize = function (options)
{
  for (var init in this.initialize)
  {
    this.need(init, options);
  }
}

Nano.App.prototype.need = function (init, options)
{
  if (this._inittab[init] === true) return;        // Skip already initialized.
  if (this.initialize[init] === undefined) return; // Skip invalid.
  this.initialize[init].call(this, options);       // Call the function.
  this._inittab[init] = true;                      // Mark it as called.
}

})();

