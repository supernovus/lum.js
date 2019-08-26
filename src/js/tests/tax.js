(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.Tax === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('tax');

  testSet.setHandler(function (test)
  {
    test.plan(0);

    const TR = [0.05, 0.07];
    const wantC = [112, 12, 5, 7];
    const wantE = [100, 12, 5, 7];

    let res = Nano.Tax.calculateTaxes(100, TR);
    test.isJSON(res, wantC, 'calculateTaxes static call');

    res = Nano.Tax.extractTaxes(112, TR);
    test.isJSON(res, wantE, 'extractTaxes static call');

    let tax = new Nano.Tax(TR);

    res = tax.calculateTaxes(100);
    test.isJSON(res, wantC, 'calculateTaxes instance call');

    res = tax.extractTaxes(112);
    test.isJSON(res, wantE, 'extractTaxes instance call');

  });

})();