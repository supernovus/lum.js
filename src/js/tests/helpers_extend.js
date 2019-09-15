(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('helpers','tests');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('helpers_extend');

  testSet.setHandler(function (test)
  {
    test.plan(4);

    let c1 = function (name)
    {
      this.name = name;
    }
    c1.prototype.hi = function (person)
    {
      return this.name + ' says hi to ' + person.name;
    }
    c1.prototype.bye = function (person)
    {
      return this.name + ' says bye to ' + person.name;
    }
    let c2 = Nano.extend(c1);
    c2.prototype.bye = function (person)
    {
      return this.name + ' says farewell to ' + person.name;
    }
    let i1 = new c1('Bob');
    let i2 = new c2('Lisa');
    test.is(i1.hi(i2), 'Bob says hi to Lisa', 'extend test 1');
    test.is(i2.hi(i1), 'Lisa says hi to Bob', 'extend test 2');
    test.is(i1.bye(i2), 'Bob says bye to Lisa', 'extend test 3');
    test.is(i2.bye(i1), 'Lisa says farewell to Bob', 'extend test 4');
    // TODO: more tests

  });

})(window.Lum);