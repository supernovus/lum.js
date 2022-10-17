  const F = 'function';
  const S = 'string';
  const O = 'object';

  class Lib
  {
    constructor(env, pkg, mod, path)
    {
      this.env = env;
      this.pkg = pkg;
      this.mod = mod;
      this.path = path;
      this.$func = null;
      this.$cached = null;
    }

    register(func)
    {
      if (typeof func !== F)
      {
        throw new TypeError("Invalid registration function");
      }
      this.$register = func;
      return this;
    }

    load()
    {
      if (typeof this.$register !== F)
      {
        throw new TypeError("No library registration function found");
      }

      if (!this.$cached)
      {
        const module = 
        {
          exports: {},
          id: `${this.pkg}/${this.mod}`,
          filename: this.path,
          require: this.createRequire(),
          createRequire: Lib.$createRequire,
          $lib: this,
        };
        this.$cached = module;
        this.$register(module);
      }

      return this.$cached.exports;
    }

    createRequire()
    {
      const plib = this;
      return function(id)
      {
        const clib = plib.env.get(id, plib);
        return clib.load();
      }
    }

    static $createRequire(rlib)
    {
      const mlib = this.$lib;
      const env  = mlib.env;

      if (typeof rlib === S)
      { // Load a requested module.
        rlib = env.get(rlib, mlib);
      }
      else if (typeof rlib !== O || rlib === null)
      { // Use the current module.
        rlib = mlib;
      }

      return rlib.createRequire();
    }

  } // Lib class

