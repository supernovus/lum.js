//++ core/lum-self ++//

  /**
   * The core Lum namespace.
   *
   * @namespace Lum
   *
   * Has a bunch of properties defined to be used with the various methods.
   *
   * @property {boolean} $ourselfUnwrapped - Whether `ourself()` returns the
   *                                         raw `Lum` object, or the wrapped
   *                                         `Proxy` instance. 
   *                                         Default: `false`;
   *
   * @property {boolean} $nsSelfUnwrapped - Whether `Lum.ns.$self()` uses the
   *                                        raw or wrapped `Lum` object when
   *                                        exporting global variables.
   *                                        Default: `false`;
   */
   const Lum = 
   {
     $ourselfUnwrapped: false,
     $nsSelfUnwrapped:  false,
     $jqPluginSuffix:   '.jq',
     $wrapBackupPrefix: 'orig$',
   };

  // Pass `this` here to see if it's considered unbound.
  function unbound(whatIsThis, lumIsUnbound=false, rootIsUnbound=true)
  {
    if (whatIsThis === undefined || whatIsThis === null) return true;
    if (rootIsUnbound && whatIsThis === root) return true;
    if (lumIsUnbound && whatIsThis === Lum) return true;

    // Nothing considered unbound was `this` so we're good.
    return false;
  }

    // The very first use of prop() is to add it to Lum as a method.
    prop(Lum, 'prop', prop);
  
    // Now we wrap up the descriptor related methods for use outside here.
    prop(DESC, 'make', descriptor);
    prop(DESC, 'is',   DESC_ID.isFunction());
    prop(DESC, 'get',  getDescriptor);
    prop(DESC, 'does', doesDescriptor);
    prop(DESC, 'ADD',  DESC_ADD);
  
    // And add the CLONE enum to the clone function as the MODE property.
    prop(clone, 'MODE', CLONE);
  
    // And a test for Enums.
    prop(Enum, 'is', ENUM_ID.isFunction());

  /**
   * If `Lum.Wrapper` is loaded, get wrapper for `Lum`.
   * 
   * @returns {Lum.Wrapper|undefined}
   */
   prop(Lum, 'getWrapper', function()
   {
     if (typeof Lum.Wrapper === F)
     {
       return Lum.Wrapper.getWrapper(Lum);
     }
   });

  /**
   * Return the Lum object itself.
   *
   * @param {boolean} [raw=Lum.$ourselfUnwrapped] Use the unwrapped Lum object?
   *
   * If false, this will return the Proxy wrapped object (if available.)
   *
   * @return object - Either the Lum object, or a Proxy of the Lum object.
   *
   * @method Lum._.ourself
   * 
   */
   function ourself(raw=Lum.$ourselfUnwrapped)
   {
     if (raw) return Lum;
     const wrapper = Lum.getWrapper();
     return (isObj(wrapper)) ? wrapper.wrap() : Lum;
   }
 
   /**
    * @property Lum.self
    *
    * A read-only accessor that returns the output of {@link Lum._.ourself}
    */
   prop(Lum, 'self', ourself, null, DESC.CONF);

//-- core/lum-self --//
