(function($)
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || $.fn.exists === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('exists');

  testSet.setHandler(function (test)
  {
    test.plan(2);

    test.is($('#navbar').exists(), true, '$.exists returns true on existing element');
    test.is($('#totallyFake').exists(), false, '$.exists returns false on non-existing element');

  });

})(jQuery);