Lum.lib('momental', function(Lum)
{
  "use strict";

  const {S,N,is_obj} = Lum._;
  const dt = luxon.DateTime;

  /**
   * A very limited wrapper for the old 'moment' library using luxon.
   *
   * Does not support much functionality, and is not meant for long term
   * use, but just as a quick compatibility wrapper until I can update all
   * my code to use the new luxon APIs directly.
   */
  function moment(input)
  {
    if (new.target === undefined)
    { // Called as a function not a constructor.
      const instance = new moment();
      const it = typeof input;

      if (it === S)
      { // This only supports ISO style strings.
        instance.dt = dt.fromISO(input);
      }
      else if (it === N)
      { // This is milliseconds.
        instance.dt = dt.fromMillis(input);
      }
      else if (is_obj(O) && input instanceof Date)
      { // A JS Date object.
        instance.dt = dt.fromJSDate(input);
      }

      return instance;
    }

    console.warn("moment has been replaced by luxon; update your code");
  }

  moment.unix = function (input)
  {
    const instance = new moment();
    instance.dt = dt.fromSeconds(input);
    return instance;
  }

  moment.prototype.format = function(format)
  {
    if (!is_obj(this.dt))
    {
      throw new Error("No DateTime instance initialized");
    }

    if (format === undefined)
    { // ISO output, that's what I used 99% of the time anyway.
      return this.dt.toISO();
    }
    else
    { 
      throw new Error("Momental does not support custom formats");
    }
  }

  moment.prototype.toString = function()
  {
    return this.dt.toString();
  }

  Lum.ns.add('moment', moment);

});