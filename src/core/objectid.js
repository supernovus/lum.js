//++ core/objectid ++//

class InternalObjectId
{
  constructor(propname)
  {
    if (typeof propname !== S)
    {
      throw new TypeError("Property name must be a string");
    }

    this.id = Math.floor(Math.random() * Date.now());
    this.propertyName = propname;
  }

  tag(obj)
  {
    const desc = {configurable: true, value: this.id};
    return Object.defineProperty(obj, this.propertyName, desc);
  }

  is(obj)
  {
    return (isComplex(obj) && obj[this.propertyName] === this.id)
  }

  isFunction()
  {
    const oid = this;
    return function(obj) { return oid.is(obj); }
  }

} // InternalObjectId

//-- core/objectid --//