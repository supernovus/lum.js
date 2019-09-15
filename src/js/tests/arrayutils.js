(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('arrayutils','tests');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('arrayutils');

  testSet.setHandler(function (test)
  {
    test.plan(9); // from outer space

    var A = Nano.array;

    { // First off some simple tests.
      let a = ['hello','world','how','are','you?'];
      test.is(A.indexOf(a, 'how'), 2, 'indexOf finds child');
      test.is(A.indexOf(a, 'nope'), -1, 'indexOf returns -1 if no match');
      test.is(A.contains(a, 'how'), true, 'contains works');
      test.is(A.contains(a, 'nope'), false, 'contains with no match works');
    }

    { // Now a powerset.
      let a = ['hello','goodbye','world'];
      let b = A.powerset(a);
      let c = [[],['hello'],['goodbye'],['hello','goodbye'],['world'],['hello','world'],['goodbye','world'],['hello','goodbye','world']];
      test.isJSON(b, c, 'powerset works');
    }

    { // Now get a random element from an array.
      let a = ['hello','world','goodbye','universe'];
      let b = A.random(a);
      test.is((typeof b), 'string', 'random returns proper type');
      test.ok(A.contains(a, b), 'random returned a child');
    }

    { // Finally, if it's available, test the array.extend() method.
      let names =
      [
        'extend adds method',
        'extended method works',
      ];
      if (typeof A.extend === 'function')
      {
        let a = ['hello','world'];
        A.extend(a, 'contains');
        test.is((typeof a.contains), 'function', names[0]);
        let b;
        try
        {
          b = a.contains('world');
        }
        catch (e)
        {
          b = false;
        }
        test.ok(b, names[1]);
      }
      else
      {
        let reason = 'Nano core not loaded';
        test.skip(names[0], reason);
        test.skip(names[1], reason);
      }
    }

  });

})(window.Lum);