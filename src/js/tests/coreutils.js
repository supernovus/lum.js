(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.addProperty === undefined || Nano.Tests === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('coreutils');

  testSet.setHandler(function (test)
  {
    test.plan(44);

    { // Nano.copyProperties()
      let c1 = {name: 'Bob', job: {type:'IT',position:'developer'}};
      let c2 = {name: 'Lisa'};
      Nano.copyProperties(c1, c2);
      test.is((typeof c2.job), 'object', 'copyProperties copied object');
      test.is(c2.name, 'Lisa', 'copyProperties did not overwrite existing');
      let c3 = {name: 'Robert', age: 40};
      Nano.copyProperties(c1, c3, {default: true, overwrite: true});
      test.is(c3.name, 'Bob', 'copyProperties overwrote when asked');
      test.is(c3.age, 40, 'copyProperties left unique properties alone');
      // TODO: add more tests.
    }

    { // Nano.copyInto()
      let c1 = {name: 'Bob', age: 40};
      let c2 = {job: {type: 'IT', position: 'Developer'}, age: 42};
      let c3 = {name: 'Robert', notes: ['ADHD','Canadian']};
      Nano.copyInto(c1, c2, true, c3);
      test.is((typeof c1.job), 'object', 'copyInto copied object');
      test.is(c1.age, 40, 'copyInto did not overwrite existing');
      test.is(c1.name, 'Robert', 'copyInto overwrote when asked');
      test.is(c1.notes.length, 2, 'copyInto copied array');
    }

    { // Nano.extend()
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
    }

    { // Nano.addProperty()
      let c1 = {name: 'Bob', age: 40};
      Nano.addProperty(c1, 'birthYear', function ()
      { // For the sake of this test, it's always 2019.
        return 2019 - this.age;
      });
      test.is(Object.keys(c1).length, 2, 'addProperty makes non-iterable by default');
      test.is((typeof c1.birthYear), 'function', 'addProperty added function');
      test.is(c1.birthYear(), 1979, 'function added by addProperty works');
    }

    { // Nano.addAccessor()
      let c1 = {name: 'Bob', age: 40};
      Nano.addAccessor(c1, 'birthYear', function ()
      {
        return 2019 - this.age;
      },
      function (newYear)
      {
        this.age = 2019 - newYear;
      });
      test.is(Object.keys(c1).length, 2, 'addAccessor makes non-iterable by default');
      test.is(c1.birthYear, 1979, 'addAccessor get function works');
      c1.birthYear = 1983;
      test.is(c1.age, 36, 'addAccessor set function works');
    }

    { // Nano.addMetaHelpers()
      let c1 = {name: 'Bob', age: 40};
      Nano.addMetaHelpers(c1);
      test.is((typeof c1.addProperty), 'function', 'addMetaHelper adds addProperty method');
      test.is((typeof c1.addAccessor), 'function', 'addMetaHelper adds addAccessor property');
      c1.addProperty('canRetire', function ()
      {
        return this.age >= 65 ? 0 : 65 - this.age;
      });
      c1.addAccessor('birthYear', function ()
      {
        return 2019 - this.age;
      },
      function (newYear)
      {
        this.age = 2019 - newYear;
      });
      test.is(c1.canRetire(), 25, 'Meta addProperty method');
      test.is(c1.birthYear, 1979, 'Meta addAccessor get method');
      c1.birthYear = 1944;
      test.is(c1.age, 75, 'Meta addAccessor set method');
      test.is(c1.canRetire(), 0, 'addAccessor final test');
    }

    { // Nano.clone()
      let c1 = {name: 'Lisa'};
      let c2 = {name: 'Bob', spouse: c1};
      let c3 = {name: 'Bob', spouse: c1};
      test.ok((c2 !== c3), 'Two objects are not the same');
      test.ok((c2.spouse === c3.spouse), 'Object references are the same');
      let c4 = Nano.clone(c2);
      test.ok((c4 !== c2), 'Cloned object is not the same as original');
      test.ok((c4.spouse !== c2.spouse), 'Cloned internal object is not the same as original');
      let c5 = Nano.clone(c2, {props: ['spouse'], overwrite: true});
      test.ok((c5 !== c2), 'Cloned object with copyProperties is not the same as original');
      test.ok((c5.spouse === c2.spouse), 'Cloned internal object reference is the same as original');
    }

    { // Nano.registerNamespace()
      Nano.registerNamespace('Nano.Tests.ThisIsA.Test');
      test.is((typeof Nano.Tests.ThisIsA), 'object', 'registerNamespace added to existing namespace');
      test.is((typeof Nano.Tests.ThisIsA.Test), 'object', 'registerNamespace added nested tree');
    }

    { // Nano hasNamespace()
      test.is(Nano.hasNamespace('Nano.Tests'), true, 'hasNamespace recognized globally available namespace');
      test.is(Nano.hasNamespace('Nano.Tests.ThisIsA.Test'), true, 'hasNamespace recognized namespace added in registerNamespace test');
      test.is(Nano.hasNamespace('Some.Completely.Bogus.Namespace'), false, 'hasNamespace returns false for non-existent global namespace');
    }

    { // Nano.getDef()
      let opt1 = 'foo';
      let opt2 = null;
      let opt3 = undefined;
      test.is(Nano.getDef(opt1, 'bar'), 'foo', 'getDef works with defined value');
      test.is(Nano.getDef(opt2, 'bar'), 'bar', 'getDef works with null value');
      test.is(Nano.getDef(opt3, 'bar'), 'bar', 'getDef works with undefined value');
    }

    { // Nano.getOpt()
      let opts =
      {
        first: 'foo',
        second: null,
        third: undefined,
      };
      test.is(Nano.getOpt(opts, 'first', 'bar'), 'foo', 'getOpt works with defined value');
      test.is(Nano.getOpt(opts, 'second', 'bar'), null, 'getOpt works with null value');
      test.is(Nano.getOpt(opts, 'third', 'bar'), 'bar', 'getOpt works with explicitly undefined value');
      test.is(Nano.getOpt(opts, 'fourth', 'bar'), 'bar', 'getOpt works with implicitly undefined value');
    }

    { // Nano.getNested()
      let doc =
      {
        hello: 'world',
        goodbye:
        {
          name: 'Bob',
          job:
          {
            type: 'IT',
            position: 'developer',
          }
        }
      };
      let q1 = Nano.getNested(doc, 'hello');
      test.is(q1, 'world', 'getNested with single level works');
      let q2 = Nano.getNested(doc, 'goodbye.job.position');
      test.is(q2, 'developer', 'getNested with more depth works');
    }

  });

})();