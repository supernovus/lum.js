(function()
{
  "use strict";

  if (window.Nano === undefined || window.Nano.Test === undefined)
  {
    throw new Error("Need to load test.js before tests.js");
  }

  var testsInstance;

  Nano.Tests = class
  {
    constructor (options)
    {
      this.testSets = [];
    }

    addSet (name, func)
    {
      var test = new TestSet(name, func);
      this.testSets.push(test);
      return test;
    }

    getSets ()
    {
      return this.testSets;
    }

    static getInstance ()
    {
      if (testsInstance === undefined)
        testsInstance = new Nano.Tests();
      return testsInstance;
    }

  }

  class TestSet
  {
    constructor (name, func)
    {
      this.name = name;
      this.testInstance = new Nano.Test();
      if (typeof func === 'function')
      {
        this.testFunction = func;
      }
    }

    setHandler (func)
    {
      this.testFunction = func;
    }

    run ()
    {
      if (typeof this.testFunction === 'function')
      {
        this.testFunction(this.testInstance);
        return this.testInstance;
      }
    }
  }

})();