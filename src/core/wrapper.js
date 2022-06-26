//++ core/wrapper ++//

  //--- Wrapper class (move into 'wrapper' library in next release)

  // A helper function to get a backup name if necessary.
  prop(Lum, '$backupName', function(prop)
  {
    return Lum.$wrapBackupPrefix + prop;
  });

  // A private cache of wrapper objects.
  const wrappers = [];

  /**
   * A class used to create Proxy-wrapped objects.
   *
   * Meant for allowing backwards compatibility modes.
   */
  class LumWrapper
  {
    /**
     * Get a wrapper for the given object.
     *
     * If one has already been created, return it.
     * Otherwise create a new one, register it, and return it.
     *
     * @param {object} obj - The object we want to wrap.
     * @param {object} opts - If creating a new one, options to set.
     */
    static getWrapper(obj=Lum, opts=Lum.Wrapper.getWrapperOpts)
    {
      //console.debug("Wrapper.getWrapper", obj, opts);
      const isProxy = (ctx.has.Proxy && isInstance(obj, Proxy, true));

      for (let i = 0; i < wrappers.length; i++)
      {
        if (isProxy)
        {
          if (wrappers[i].proxy === obj)
          { // Found an existing wrapper for the Proxy.
            return wrappers[i];
          }
        }
        else
        {
          if (wrappers[i].obj === obj)
          { // Found an existing wrapper for the raw object.
            return wrappers[i];
          }
        }
      }

      // Did not find a wrapper, let's make one.
      const wrapper = new Lum.Wrapper(obj, opts);

      wrappers.push(wrapper);

      return wrapper;
    }

    constructor(obj, opts=Lum.Wrapper.constructorOpts)
    {
      //console.debug("Wrapper~constructor()", obj, opts);
      if (!isComplex(obj))
      {
        throw new TypeError("Wrapper~construtor: obj was not a valid object");
      }

      this.obj = obj;
      this.defs = {};

      this.fatal          = opts.fatal          ?? false;
      this.warn           = opts.warn           ?? true;
      this.useproxy       = opts.proxy          ?? ctx.has.Proxy;
      this.enumerable     = opts.enumerable     ?? false;

      this.proxy = null;
    }

    add(prop, item)
    {
      if (isNil(item))
      {
        throw new TypeError("Cannot assign an undefined or null value");
      }

      if (!doesDescriptor(item))
      { // The item passed is not a descriptor, so it's a value.
        item = {value: item, configurable: true, enumerable: this.enumerable}
      }

      //console.debug("Wrapper.add", prop, item, this.obj, this);

      if (this.obj[prop] !== undefined)
      { // An existing property was found as well.
        const backupName = Lum.$backupName(prop);
        if (this.defs[backupName] === undefined)
        { // Let's make a backup of the original property.
          const existing = getProperty(this.obj, prop);
          if (notNil(existing))
          {
            if (!existing.configurable)
            {
              if (this.warn || this.fatal)
              {
                console.error("Existing property is not configurable", 
                  existing, arguments, this);
              }
              if (this.fatal)
              {
                throw new Error(`Cannot configure ${prop}`);
              }
            }

            // Okay, assign the backup copy.
            this.defs[backupName] = existing;
            if (!this.useproxy)
            { // Add the backup to the object itself as well.
              Lum.prop(this.obj, backupName, null, existing);
            }
          }
          else
          {
            if (this.warn || this.fatal)
            {
              console.error("No property descriptor found", arguments, this);
            }
    
            if (this.fatal)
            {
              throw new Error(`Cannot overwrite/shadow property ${prop}`);
            }
          }
        }
      }

      this.defs[prop] = item;
      if (!this.useproxy)
      { // Add it directly to the object as well.
        Lum.prop(this.obj, prop, null, item);
      }

    } // add()

    del(prop)
    {
      if (this.defs[prop] === undefined)
      {
        const msg = `No ${prop} was found in this wrapper`;
        if (this.warn)
        {
          console.error(msg);
        }
        else if (this.fatal)
        {
          throw new Error(msg);
        } 
      }
    
      // Bye bye.
      delete(this.defs[prop]);

      const backupName = Lum.$backupName(prop);
      if (this.defs[backupName] !== undefined)
      { // A backup of the original was found.
        if (!this.useproxy)
        { // Restore the original property.
          prop(this.obj, prop, null, this.defs[backupName]);          
          // Remove the backup property from the object.
          delete(this.obj[backupName]);
        }
        // And remove the backup def.
        delete(this.defs[backupName]);
      }
      else if (!this.useproxy)
      { // No backup to restore, so just remove the property.
        delete(this.obj[prop]);
      }
    }

    wrap()
    {
      if (!this.useproxy)
      { // Nothing to proxy.
        return this.obj;
      }

      if (notNil(this.proxy))
      { // Already created a Proxy.
        return this.proxy;
      }

      const hasValue = prop => 
        typeof this.defs[prop] === O && this.defs[prop].value !== undefined;

      const getValue = prop => this.defs[prop].value;

      const hasGetter = prop =>
        typeof this.defs[prop] === O && typeof this.defs[prop].get === F; 

      const getGetter = prop => this.defs[prop].get;

      const hasSetter = prop =>
        typeof this.defs[prop] === O && typeof this.defs[prop].set === F;

      const getSetter = prop => this.defs[prop].set

      let proxy = new Proxy(this.obj, 
      { 
        // Getter trap.
        get(target, prop, receiver)
        {
          if (hasValue(prop))
          { // A static value, send it along.
            return getValue(prop);
          }
          else if (hasGetter(prop))
          { // A getter method, pass through.
            return getGetter(prop).call(target);
          }
          else if (prop in target)
          { // It exists in the target.
            return target[prop];
          }
        },
        // Setter trap.
        set(target, prop, value, receiver)
        {
          if (hasSetter(prop))
          { // A setter method, pass through.
            return getSetter(prop).call(target, value);
          }
          else
          { // Try direct assignment instead.
            target[prop] = value;
            return true;
          }
        },
      }); // new Proxy

      // Cache the Proxy.
      this.proxy = proxy;

      return proxy;

    } // wrap()

    get length()
    {
      return Object.keys(this.defs).length;
    }

  } // Lum.Wrapper

  // And assign it to it's external name.
  prop(Lum, 'Wrapper', LumWrapper);

  // Default options for Wrapper.getWrapper() method.
  // This is the recommended method to get a Wrapper library.
  Lum.Wrapper.getWrapperOpts = {fatal: true};

  // Default options for Wrapper() constructor.
  // This is not recommended for direct use, use getWrapper() instead.
  Lum.Wrapper.constructorOpts = {warn: true};

  // A wrapper instance for Lum itself.

  //--- End of Wrapper class definition.

  //--- Wrapped compatibility methods.

  loaded.on('wrapper', function ()
  {
    console.debug("loaded::on<wrapper>", arguments, this);

    const wrap = Lum.Wrapper.getWrapper();

    wrap.add('registerNamespace', Lum.ns.add);
    wrap.add('getNamespace', Lum.ns.get);
    wrap.add('hasNamespace', Lum.ns.has);
    wrap.add('needNamespaces', Lum.ns.need);
    wrap.add('needNamespace',  Lum.ns.need);
    wrap.add('exportNamespace', Lum.ns.export);

    wrap.add('markLib', Lum.lib.mark);
    wrap.add('hasLib', Lum.lib.has);
    wrap.add('checkLibs', Lum.lib.check);
    wrap.add('needLibs', Lum.lib.need);
    wrap.add('needLib', Lum.lib.need);
    wrap.add('wantLibs', Lum.lib.want);

    wrap.add('checkJq', Lum.jq.check);
    wrap.add('needJq', Lum.jq.need);
    wrap.add('wantJq', Lum.jq.want);
  });

  // We haven't moved the wrapper library yet, so mark it now.
  loaded.mark('wrapper');

//-- core/wrapper --//