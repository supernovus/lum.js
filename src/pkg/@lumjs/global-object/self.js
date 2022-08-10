const core = require('@lumjs/core');

const {isObj,def} = core.types;

/**
 * The core Lum namespace.
 *
 * @namespace Lum
 *
 * Has a bunch of properties defined to be used with the various methods.
 *
 * @property {boolean} $ourselfUnwrapped - Whether `ourself()` returns the
 *                                         raw `Lum` object, or the wrapped
 *                                         `Proxy` instance. Default: `true`;
 *
 * @property {boolean} $nsSelfUnwrapped - Whether `Lum.ns.$self()` uses the
 *                                        raw or wrapped `Lum` object when
 *                                        exporting global variables.
 *                                        Default: `false`;
 * 
 */
const Lum = 
{
  $ourselfUnwrapped: true,
  $nsSelfUnwrapped:  false,
  $jqPluginSuffix:   '.jq',
};

exports.Lum = Lum;

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

exports.ourself = ourself;

/**
 * @property Lum.self
 *
 * A read-only accessor that returns the output of {@link Lum._.ourself}
 */
def(Lum, 'self', {get: ourself});
