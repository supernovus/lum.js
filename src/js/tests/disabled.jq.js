(function($)
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || $.fn.disabled === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('disabled');

  testSet.setHandler(function (test)
  {
    test.plan(8);

    let el = $('<input type="text" />');
    test.is(el.attr('type'), 'text', 'Non-disabled element has correct type');
    test.is(el.enabled(), true, '$.enabled returns true on non-disabled element')
    test.is(el.disabled(), false, '$.disabled returns false on non-disabled element');
    test.is(el.disable().disabled(), true, '$.disable disables the element');

    el = $('<input type="button" disabled="disabled" />');
    test.is(el.attr('type'), 'button', 'Disabled element has correct type');
    test.is(el.enabled(), false, '$.enabled returns false on disabled element');
    test.is(el.disabled(), true, '$.disabled returns true on disabled element');
    test.is(el.enable().enabled(), true, '$.enable enables the element');

  });

})(jQuery);