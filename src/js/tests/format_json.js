(function(Nano, $)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','format_json');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('format_json');

  testSet.setHandler(function (test)
  {
    test.plan(3);

    let source = '{"hello":{"name":"world"},"goodbye":["galaxy","universe"]}';
    let wanted = "{\n  \"hello\":{\n    \"name\":\"world\"\n  },\n  \"goodbye\":[\n    \"galaxy\",\n    \"universe\"\n  ]\n}";
    test.is(Nano.format.json(source), wanted, 'format_json works');

    let el = $('<textarea>'+source+'</textarea>');
    test.is(el.formatJSON().val(), wanted, '$.formatJSON works on textarea');

    el = $('<pre>'+source+'</pre>');
    test.is(el.formatJSON().text(), wanted, '$.formatJSON works on pre');

  });

})(window.Lum, window.jQuery);