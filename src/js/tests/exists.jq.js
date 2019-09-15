(function(Nano, $)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests');
  Nano.needJq('exists');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('exists_jq');

  testSet.setHandler(function (test)
  {
    test.plan(2);

    test.is($('#navbar').exists(), true, '$.exists returns true on existing element');
    test.is($('#totallyFake').exists(), false, '$.exists returns false on non-existing element');

  });

})(window.Lum, window.jQuery);