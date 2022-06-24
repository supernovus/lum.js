Lum.lib(
{
  name: 'dynamic_functions',
  assign: 'Function',
}, 
function(Lum)
{
  "use strict";

  const DynamicFunctions = 
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
  
  }

  // TODO: more function building tools.

  return DynamicFunctions;

});