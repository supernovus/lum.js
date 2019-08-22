(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.Foo === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('foo');

  testSet.setHandler(function (test)
  {
    test.plan(0);

    // Add your tests here.

  });

})();