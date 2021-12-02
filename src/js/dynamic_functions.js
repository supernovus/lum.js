(function(Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not found");

  Lum.lib.mark('dynamic_functions').ns.new('Function',
  {
    /**
     * Constructor for dynamic generator functions.
     */
    Generator: Object.getPrototypeOf(function*(){}).constructor,
  
    /**
     * Constructor for dynamic async functions.
     */
    Async: Object.getPrototypeOf(async function(){}).constructor,
  
    /**
     * Constructor for dynamic async generator functions.
     */
    AsyncGenerator: Object.getPrototypeOf(async function*(){}).constructor,
  
  });

})(self.Lum);