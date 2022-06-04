(function(Lum)
{
  "use strict";

  if (Lum === undefined) throw new Error("Lum core not found");

  const {F,N} = Lum._;
 
  Lum.WhenReady = class
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

})(self.Lum);