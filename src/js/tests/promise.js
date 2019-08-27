(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.Promise === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('promise');

  testSet.setHandler(function (test)
  {
    test.plan(0);

    // TODO: write some tests.

  });

})();