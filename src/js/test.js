(function()
{
  "use strict";

  if (window.Nano === undefined)
  {
    window.Nano = {};
  }

  /**
   * A simple testing library with TAP support.
   */
  Nano.Test = class
  {
    constructor (plan)
    {
      this.failed = 0;
      this.skipped = 0;
      this.planned = 0;
      this.log = [];
      if (plan)
      {
        this.plan(plan);
      }
    }

    plan (num)
    {
      if (typeof num === 'number')
      {
        this.planned = num;
      }
      else if (num === false)
      {
        this.planned = 0;
      }
      else
      {
        throw new Error("Invalid value passed to plan()");
      }
    }

    // The base method that everything else uses.
    ok (test, desc, directive)
    {
      var log = new Log();
      if (test)
      {
        log.ok = true;
      }
      else
      {
        this.failed++;
      }
  
      if (typeof desc === 'string')
      {
        log.desc = desc;
      }
  
      if (typeof directive === 'string')
      {
        log.directive = directive;
      }
  
      this.log.push(log);
      return log;
    }

    is (got, want, desc, stringify)
    {
      if (stringify === undefined)
        stringify = true;
      var test = (got === want);
      var log = this.ok(test, desc);
      if (!test)
      {
        log.details.got = got;
        log.details.wanted = want;
        log.details.stringify = stringify
      }
      return log;
    }

    isJSON (got, want, desc)
    {
      got = JSON.stringify(got);
      want = JSON.stringify(want);
      return this.is(got, want, desc, false);
    }

    skip (reason, desc)
    {
      var log = this.ok(true, desc);
      log.skipped = true;
      if (typeof reason === 'string')
        log.skippedReason = reason;
      this.skipped++;
      return log;
    }

    diag (msg)
    {
      this.log.push(msg);
    }

    tap ()
    {
      var out = '';
      if (this.planned > 0)
      {
        out += '1..'+this.planned+"\n";
      }
      var t = 1;
      for (var i = 0; i < this.log.length; i++)
      {
        var log = this.log[i];
        if (log instanceof Log)
        {
          out += log.tap(t++);
        }
        else
        { // A comment.
          out += '# ' + (typeof log === 'string' ? log : JSON.strinfify(log)) + "\n";
        }
      }
      if (this.skipped)
      {
        out += '# Skipped '+this.skipped+" tests\n";
      }
      if (this.failed)
      {
        out += '# Failed '+this.failed+(this.failed>1?' tests':' test');
        if (this.planned)
          out += ' out of '+this.planned;
        out += "\n";
      }
      return out;
    }

  } // class Nano.Test

  class Log 
  {
    constructor ()
    {
      this.ok = false;
      this.skipped = false;
      this.skippedReason = '';
      this.desc = null;
      this.directive = null;
      this.details = {};
    }

    tap (num)
    {
      var out;
      if (this.ok)
        out = 'ok ';
      else
        out = 'not ok ';
  
      out += num;
  
      if (typeof this.desc === 'string')
        out += ' - ' + this.desc;
  
      if (typeof this.directive === 'string')
        out += ' # ' + this.directive;
      else if (this.skipped)
        out += ' # SKIP ' + this.skippedReason;
  
      out += "\n";
  
      if ('got' in this.details && 'wanted' in this.details)
      {
        var got = this.details.got;
        var want = this.details.wanted;
        if (this.details.stringify)
        {
          got = JSON.stringify(got);
          want = JSON.stringify(want);
        }
        out += '#       got: ' + got + "\n";
        out += '#  expected: ' + want + "\n";
      }

      return out;
    } // Log.tap()

  } // class Log

})();