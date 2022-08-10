const Wrapper = require('@lumjs/wrapper');
const {Lum, ourself} = require('./self');

exports.Wrapper = Wrapper;

/**
 * Get a `Wrapper` instance for the `Lum` object.
 * @returns {Wrapper}
 */
function getWrapper() 
{ 
  return Wrapper.getWrapper(Lum); 
}
exports.getWrapper = getWrapper;

/**
 * Initialize full Lum.js v4 compatibility layer.
 */
function initWrapper()
{
  const wrap = getWrapper();

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
  
  return ourself();
}
exports.initWrapper = initWrapper;
