(function($)
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.format === undefined || Nano.format.xml === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('format_xml');

  testSet.setHandler(function (test)
  {
    test.plan(3);

    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    let source = '<test><hello name="world"/><goodbye><i>galaxy</i><i>universe</i></goodbye></test>';
    let wanted = escapeXml("<test>\n  <hello name=\"world\"/>\n  <goodbye>\n    <i>galaxy</i>\n    <i>universe</i>\n  </goodbye>\n</test>\n");
    let got = escapeXml(Nano.format.xml(source));
    test.is(got, wanted, 'format_xml works');

    let el = $('<textarea></textarea>');
    el.val(source);
    got = escapeXml(el.formatXML().val());
    test.is(got, wanted, '$.formatXML works on textarea');

    el = $('<pre></pre>');
    el.text(source);
    got = escapeXml(el.formatXML().text());
    test.is(got, wanted, '$.formatXML works on pre');

  });

})(jQuery);