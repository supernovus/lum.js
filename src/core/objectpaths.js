//++ core/objectpaths ++//

function SOA(name, err=true)
{
  const msg = (typeof name === S) 
    ? name + ' ' + this.message 
    : this.message;
  return err ? (new TypeError(msg)) : msg;
}
SOA.message = "must be a string or non-empty array";
Object.defineProperty(SOA, 'toString',
{
  configurable: true,
  value: function() { return this.message; }
});

function nsString(ns, name='Namespace')
{
  if (nonEmptyArray(ns))
  {
    return ns.join('.');
  }
  else if (typeof ns !== S)
  {
    throw SOA(name);
  }
  return ns;
}

function nsArray(ns, name='Namespace')
{
  if (typeof ns === S)
  {
    return ns.split('.');
  }
  else if (!nonEmptyArray(ns)) 
  {
    throw SOA(name);
  }
  return ns;
}

// Used internally, and exported as `Lum.opt.getPath`
function getObjectPath(obj, proppath, opts={})
{
  needObj(obj);

  if (typeof opts === B)
    opts = {log: opts};
  else if (!isObj(opts))
    opts = {};

  proppath = nsArray(proppath);

  for (let p = 0; p < proppath.length; p++)
  {
    const propname = proppath[p];
    if (obj[propname] === undefined)
    { // End of search, sorry.
      if (opts.log)
      {
        console.error("Object property path not found", 
          propname, p, proppath, obj);
      }
      return opts.default;
    }
    obj = obj[propname];
  }

  return obj;
}

// Used internally, and exported as `Lum.ns.get`
function getNamespace(namespaces, opts={})
{
  return getObjectPath(root, namespaces, opts);
}

//-- core/objectpaths --//
