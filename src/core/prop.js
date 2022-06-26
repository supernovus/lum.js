//++ core/prop ++//

  /**
   * A magic wrapper for Object.defineProperty()
   *
   * @method Lum.prop
   *
   * Rather than documenting the arguments in the usual manner, I'm
   * going to simply show all of the ways this method can be called.
   * 
   * Anywhere the `target` parameter is shown, this parameter can be an `object` or `function`.
   * It's the target to which we're adding new properties.
   * 
   * Anywhere the `property` parameter is shown, this parameter can be specified in two different
   * forms. The first and simplest is as a `string` in which case it's simply the name of the property we're adding.
   * The second more advanced form is as an `object`. If it is specified as an object, then it is a set of special options.
   * In this case, a property of that `property` object called `name` will be used as the name of the property.
   * If the `name` property is absent or `undefined`, it's the same as not passing the `property` parameter at all, 
   * and a *bound* function will be returned, using the custom options as its bound defaults.
   * 
   * See below the usage 
   *
   * `Lum.prop(object)`
   *
   *   Return a function that is a bound copy of this function with
   *   the object as it's first parameter.
   *
   * `Lum.prop(object, property)`
   *
   *   Add a property to the object which is mapped to a bound copy of
   *   this function with the object as it's first parameter.
   *
   * `Lum.prop(object, property, function, function)`
   *
   *   Add a getter and setter property with the default descriptor.
   *
   * `Lum.prop(object, property, function, function, object)`
   *
   *   Add a getter and setter property with specified Descriptor options.
   *   Do not use `get`, `set`, or `value` in the descriptor options.
   *
   * `Lum.prop(object, property, function, null, object)`
   *
   *   Add a getter only with specified descriptor options.
   *   Same restrictions to the descriptor options as above.
   *   You can specify `{}` as the descriptor options to use the defaults.
   *
   * `Lum.prop(object, property, null, function, object)`
   *
   *   Add a setter only with specified descriptor options.
   *   Same restrictions as above, and again you can use `{}` for defaults.
   *
   * `Lum.prop(object, property, !null)`
   *
   *   Add a property with the specified non-null value.
   *   This uses the default descriptor.
   *
   * `Lum.prop(object, property, !null, object)`
   *
   *   Add a property value with the specified descriptor options.
   *   Has the same restrictions to the descriptor options as above.
   *
   * `Lum.prop(object, property, null, object)`
   *
   *   Add a property using the descriptor object alone.
   *   This has no restrictions to the descriptor object except those
   *   enforced by Object.defineProperty() itself.
   *   There's no real benefit to this usage over Object.defineProperty(),
   *   other than being slightly shorter to type. Your choice.
   *
   */
   function prop(obj, name, arg1, arg2, arg3)
   {
     let opts;
 
     const isUnbound = unbound(this, true, true);
 
     if (typeof name === O)
     { // A way to set some special options.
       opts = name;
       name = opts.name;
     }
     else if (isUnbound)
     { // Use the default options.
       opts = isObj(prop.options) ? prop.options : {};
     }
     else if (typeof this === O)
     { // This is already a bound copy, so `this` is the options.
       opts = this;
     }
     else 
     { // Something weird is going on here...
       throw new Error("Invalid `this` in a prop() function call");
     }
 
     if (name === undefined)
     { // A special case, returns a copy of this function bound to the object.
       return prop.bind(opts, obj);
     }
     else if (typeof name !== S)
     { // The property must in every other case be a string.
       throw new Error("Non-string property name passed to Lum.prop()");
     }
 
     let desc;
 
     if (arg1 === undefined && arg2 === undefined)
     { // Another special case, the property is a bound version of this.
       return prop(obj, name, prop.bind(opts, obj));
     }
     else if (DESC_ID.is(arg1) && arg2 === undefined)
     { // Yet another special case.
       if (arg1.isReady)
       { // Already has a value or get/set properties assigned.
         desc = arg1;
       }
       else 
       { // We'll need to call setValue(), setGetter(), etc, then done().
         return arg1.whenDone(function()
         {
           return prop(obj, name, this);
         });
       }
     }
     else if (typeof arg1 === F && typeof arg2 === F)
     { // A getter and setter were specified.
       desc = getDescriptor(isObj(arg3) ? cloneIfLocked(arg3) : DESC.CONF);
       desc.setAccessor(arg1, arg2);
     }
     else if (isObj(arg3))
     { // A custom descriptor for an accessor, find the accessor.
       desc = getDescriptor(cloneIfLocked(arg3));
       if (typeof arg1 === F)
       { // A getter-only accessor.
         desc.setGetter(arg1);
       }
       else if (typeof arg2 === F)
       { // A setter-only accessor.
         desc.setSetter(arg2);
       }
     }
     else
     { // Not a getter/setter, likely a standard value.
       desc = getDescriptor(isObj(arg2) ? cloneIfLocked(arg2) : DESC.CONF);
       
       if (notNil(arg1))
       { // If you really want a null 'value', use a custom descriptor.
         desc.setValue(arg1);
       }
     }
 
     // If we reached here, we should have a valid descriptor now.
     return Object.defineProperty(obj, name, desc);
   }
 
//-- core/prop --//