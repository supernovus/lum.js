(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Luminaryn core");
  }

  Nano.needLibs('tests','foo');
  //Nano.needJq('bar');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('foo');

  testSet.setHandler(function (test)
  {
    test.plan(0);

    // Add your tests here.

  });

})(window.Luminaryn);