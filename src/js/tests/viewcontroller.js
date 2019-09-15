(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','viewcontroller');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('viewcontroller');
  let modelSet = testSuite.getSet('modelapi');

  testSet.setHandler(function (test)
  {
    test.plan(5);

    let promiseSet = testSet.useDeferred({useNested: true});
    let promise1 = promiseSet.addPromise();
    let promise2 = promiseSet.addPromise();

    let Model = modelSet.createModelClass();
    let peopleEl = modelSet.makePeopleElement(true, {withReferences: true});

    let modelConf =
    {
      sources:
      {
        people:
        {
          type: 'json',
          element: '#modelapi_test_people',
        }
      }
    }

    const tn =
    [
      'api instance is correct',
      'api model data is object',
      'api model data has correct length',
      'api model data objects seem right',
    ];

    let viewc = new Nano.ViewController();

    // We're going to run a bunch of tests conditionally. 
    // If any of them throw an exception, the rest will fail.
    let condTest1 = testSet.tryTests(tn,
    { 
      timeout: 1000,
      promise: promise1,
    });

    // A timeout for the event listener test.
    let timeout2 = testSet.makeTimeout(500, function ()
    {
      test.fail('event listener', 'timed out');
      promise2.reject();
    });

    viewc.add(function (api)
    { // First handler, this is the main one.
      console.debug("In primary test handler for ViewController");

      let state = {};
      function finish (set)
      {
        state[set] = true;
      }

      function condFunc1 (t)  
      {
        test.ok(api instanceof Nano.ModelAPI, t.next());
        test.is(typeof api.model.people, 'object', t.next());
        test.is(api.model.people.length, 4, t.next());
        test.is(api.model.people[0].kids.length, 2, t.next());
      }
      condTest1.run(condFunc1);
      
      // Let's register an event listener.
      this.on('magicEvent', function (data)
      {
        timeout2.clear();
        test.is(data, 'hello world', 'event listener');
        promise2.resolve();
      });

      // Clean up anything we added.
      peopleEl.remove();
    });

    viewc.add(function (api)
    { // A second handler. Doesn't do as much.
      console.debug("In secondary test handler for ViewController");
      this.trigger('magicEvent', 'hello world');
    });

    viewc.start(Model, modelConf);
  });

})(window.Lum);