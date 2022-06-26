//++ core/lazy ++//

  /**
   * Build a lazy initializer property.
   *
   * Basically the first time the property is accessed it's built.
   * Subsequent accesses will use the already built property.
   * This is an extension of the {@link Lum.prop} method.
   *
   * @param {object} obj - The object to add the property to.
   * @param {string} name - The name of the property to add.
   * @param {function} initfunc - The function to initialize the property.
   * 
   *   This function will have `this` set to the `obj` parameter.
   *   It will also be passed `name` as the sole parameter.
   * 
   * @param {mixed} [onset] How to handle assignment.
   * 
   *   If this is `true` then the new value will be assigned directly,
   *   skipping the initialization process entirely.
   * 
   *   If this is `false` then any attempt at assignment will throw
   *   a `ReferenceError` with a message indicating the property is read-only.
   * 
   *   If this is a `function` it will take two arguments, the
   *   first being the value that is trying to be assigned, and
   *   the second being the currently assigned value.
   *   As with any getter or setter, `this` will be the `obj` itself.
   *   The function must return the value to be assigned.
   *   If it returns `undefined`, then the value was not valid,
   *   and will not be assigned.
   * 
   *   If this is anything else, assignment will do nothing at all.
   * 
   * @param {object} [desc=DESC.CONF] The Descriptor for the property.
   *
   * @return {object} The object we defined the property on.
   *
   * @method Lum.prop.lazy
   */
   function lazy(obj, name, initfunc, onset, desc=DESC.CONF)
   {
     if (!isComplex(obj))
     {
       throw new TypeError("obj parameter was not an object");
     }
     if (typeof name !== S)
     {
       throw new TypeError("name parameter was not a string");
     }
     if (typeof initfunc !== F)
     {
       throw new TypeError("initfunc parameter was not a function");
     }
 
     let value;
     let setter = null;
 
     function getter()
     {
       if (value === undefined)
       {
         value = initfunc.call(this, name);
       }
       return value;
     }
 
     if (onset === true)
     { // Allow direct assignment.
       setter = function(newval)
       {
         value = newval;
       }
     }
     else if (onset === false)
     { // Throw an error on assignment.
       setter = function()
       {
         throw new ReferenceError("The "+name+" property is read-only");
       }
     }
     else if (typeof onset === F)
     { // A proxy method for assignment.
       setter = function(newval)
       {
         const setval = onset.call(this, newval);
         if (setval !== undefined)
         {
           value = setval;
         }
       }
     }
 
     prop(obj, name, getter, setter, desc);
   }
 
   // Gotta be one of the greatest lines...
   prop(prop, 'lazy', lazy);

   //-- core/lazy --//
   