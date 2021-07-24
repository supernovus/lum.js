(function()
{
  "use strict";

  if (window.Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.markLib('dynamic_functions');

  /**
   * Constructor for dynamic generator functions.
   */
  Lum.GeneratorFunction = 
    Object.getPrototypeOf(function*(){}).constructor;

  /**
   * Constructor for dynamic async functions.
   */
  Lum.AsyncFunction = 
    Object.getPrototypeOf(async function(){}).constructor;

  /**
   * Constructor for dynamic async generator functions.
   */
  Lum.AsyncGeneratorFunction = 
    Object.getPrototypeOf(async function*(){}).constructor;

})();