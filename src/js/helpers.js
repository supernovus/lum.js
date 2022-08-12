Lum.lib(
{
  name: ['helpers', 'compat/helpers','obj'],
  ns: 'obj',
},
function(Lum, objlib)
{
  "use strict";

  const {mixin,into,clone} = require('@lumjs/compat/v4/object-helpers');
  const {copyProps} = require('@lumjs/core/obj');

  objlib._add('mixin', mixin);
  objlib._add('into', into);
  objlib._add('clone', clone);
  objlib._add('copy', copyProps);

  Lum.lib.onLoad('wrapper', function()
  {
    const wrap   = Lum.getWrapper();
    const optlib = Lum.opt;

    //-- Compatibility wrappers for 'obj' library.

    /**
     * @method Lum.addTraits
     *
     * Alias for {@link Lum.obj.mixin}
     *
     * @deprecated Use the new name.
     */
    wrap.add('addTraits', objlib.mixin);

    /**
     * @method Lum.copyInto
     *
     * An alias to {@link Lum.obj.into}
     *
     * @deprecated Use the new name.
     */
    wrap.add('copyInto', objlib.into);

    /**
     * @method Lum.copyProperties
     *
     * An alias to {@link Lum.obj.copy}
     *
     * @deprecated Use the new name.
     */
    wrap.add('copyProperties', objlib.copy);

    /**
     * @method Lum.clone
     *
     * An alias to {@link Lum.obj.clone}
     *
     * @deprecated Use the new name; or use Lum._.clone directly.
     */
    wrap.add('clone', objlib.clone);

    /**
     * A wrapper around Object.defineProperty() that assigns a value to
     * the property.
     *
     * @deprecated Use {@link Lum.prop} from core.js instead.
     *
     * @param {object} object - The object we are adding a property to.
     * @param {string} name - The property name.
     * @param {*} val - The value we are assigning to the property.
     * @param {object|boolean} [opts] If boolean uses `{configurable: opts}`;
     *
     * @param {boolean} [opts.configurable=false] Property is configurable?
     * @param {boolean} [opts.enumerable=false] Property is enumerable?
     * @param {boolean} [opts.writable=false] Property is writable?
     *
     * @method Lum.addProperty
     */
    function addProperty (object, name, val, opts)
    {
      if (opts === true)
      {
        return Lum.prop(object, name, val, {configurable: true});
      }
      else
      { 
        return Lum.prop(object, name, val, opts);
      }
    }

    wrap.add('addProperty', addProperty);

    /**
     * A wrapper around Object.defineProperty() that assigns an accessor to
     * the property.
     *
     * @deprecated Use {@link Lum.prop} from core.js instead.
     *
     * @param {object} object - The object we are adding an accessor to.
     * @param {string} name - The property name for the accessor.
     * @param {function} getter - The getter function for the accessor.
     * @param {function} setter - The setter function for the accessor.
     * @param {object|boolean} [opts] If boolean uses `{configurable: opts}`;
     *
     * @param {boolean} [opts.configurable=false] Property is configurable?
     * @param {boolean} [opts.enumerable=false] Property is enumerable?
     *
     * @Lum.addAccessor
     *
     */
    function addAccessor (object, name, getter, setter, opts={})
    {
      if (opts === true)
      { 
        return Lum.prop(object, name, getter, setter, {configurable: true});
      }
      else
      { 
        return Lum.prop(object, name, getter, setter, opts);
      }
    }

    wrap.add('addAccessor', addAccessor);

    /**
     * Add 'addProperty' and 'addAccessor' helpers to the object directly.
     *
     * @deprecated See {@link Lum.prop} instead, it's just better.
     *
     * @method Lum.addMetaHelpers
     */
    function addMetaHelpers (object, conf={})
    {
      if (typeof conf === 'boolean')
        conf = {configurable: conf};

      Lum.prop(object, 'addProperty', addProperty.bind(Lum, object), conf);
      Lum.prop(object, 'addAccessor', addAccessor.bind(Lum, object), conf);
    }

    wrap.add('addMetaHelpers', addMetaHelpers);

    // Wrappers for stuff in the 'opt' core set now.

    /**
     * @method Lum.getDef
     *
     * An alias to {@link Lum.opt.val}
     *
     * @deprecated Use the new name.
     */
    wrap.add('getDef', optlib.val);

    /**
     * @method Lum.getOpt
     *
     * An alias to {@link Lum.opt.get}
     *
     * @deprecated Use the new name.
     */
    wrap.add('getOpt', optlib.get);

    /**
     * @method Lum.getNested
     *
     * An alias to {@link Lum.opt.getPath}
     *
     * @deprecated Use the new name.
     */
    wrap.add('getNested', optlib.getPath);

  }); // Lum.lib.onLoad:wrappers

});

