(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Luminaryn core");
  }

  Nano.needLibs('tests','css');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('css');

  testSet.setHandler(function (test)
  {
    test.plan(2);
    var elem1 = $('#navbar li').first(); // Should be #tab_coreutils.
    var elem2 = document.getElementById('tab_css');  // Should be .active tab.

    var css = new Nano.CSS();
    var rules1 = css.findRules(elem1);
    var rules2 = css.findRules(elem2);

    test.is(rules1.length, 1, 'findRules returned proper length for jQuery element');
    test.is(rules2.length, 2, 'findRules returned proper length for DOM element');
  });

})(window.Luminaryn);
