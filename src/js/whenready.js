Lum.lib(
{
  name: 'whenready', 
  assign: 'WhenReady',
},
function(Lum)
{
  "use strict";

  const {F,N} = Lum._;
 
  return class WhenReady
  {
    constructor(count, func, self)
    {
      if (typeof func !== F)
      {
        throw new Error("invalid function");
      }
      if (typeof count !== N)
      {
        throw new Error("invalid count");
      }

      this.self = self;
      this.func = func;
      this.count = count;
    }

    exec()
    {
      if (--this.count === 0)
      { // We've reached zero, let's do this!
        this.func.apply(this.self, arguments);
      }
    }

  } // class WhenReady

});