(function(Nano, $)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests');
  Nano.needJq('JSON');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('json_jq');

  testSet.setHandler(function (test)
  {
    test.plan(2);

    let struct = {hello: ["world","universe"]};
    let json = JSON.stringify(struct);

    let el = $('<input type="text" />');
    el.val(json);
    test.isJSON(el.JSON(), struct, '$.JSON() returns proper value');

    struct = {goodbye: "Bob"};
    json = JSON.stringify(struct);
    el.JSON(struct);
    test.is(el.val(), json, '$.JSON(obj) sets proper value');

  });

})(window.Lum, window.jQuery);