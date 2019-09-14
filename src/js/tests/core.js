(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Luminaryn core");
  }

  Nano.needLibs('helpers');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('core');

  testSet.setHandler(function (test)
  {
    test.plan(5);

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

    // TODO: all the new core functions.

  });

})(window.Luminaryn);