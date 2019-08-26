(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.observable === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('observable');

  testSet.setHandler(function (test)
  {
    test.plan(10);

    let obs1 = Nano.observable();
    test.is(typeof obs1.on, 'function', 'observable added on method');
    test.is(typeof obs1.off, 'function', 'observable added off method');
    test.is(typeof obs1.one, 'function', 'observable added one method');
    test.is(typeof obs1.trigger, 'function', 'observable added trigger method');

    var lastTriggered = null;
    var triggerCount = 0;
    
    function triggerTest (val)
    {
      lastTriggered = val;
      triggerCount++;
    }

    obs1.on('foo', triggerTest);
    obs1.trigger('foo', 'bar');
    test.is(lastTriggered, 'bar', 'on and trigger worked');
    test.is(triggerCount, 1, 'count is correct after on/trigger test');

    obs1.off('foo');
    obs1.trigger('foo', 'baz');
    test.is(lastTriggered, 'bar', 'off worked');
    test.is(triggerCount, 1, 'count is correct after off test');

    obs1.one('onlyOnce', triggerTest);
    obs1.trigger('onlyOnce', 'hello');
    obs1.trigger('onlyOnce', 'world');

    test.is(lastTriggered, 'hello', 'one call value correct');
    test.is(triggerCount, 2, 'one call count correct');

  });

})();