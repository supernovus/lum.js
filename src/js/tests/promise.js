(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','promise');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('promise');

  testSet.setHandler(function (test)
  {
    test.plan(2);

    let promise1 = new Nano.Promise(true);
    let t1 = 'Nano.Promise 1 (jQuery) finished';
    promise1.done(function (msg,t,p)
    {
      test.pass(t1, msg);
    }).fail(function (p,t,err)
    {
      test.fail(t1, err);
    });
    
    let promise2 = new Nano.Promise(false);
    let t2 = 'Nano.Promise 2 (internal) finished';
    promise2.done(function (msg,t,p)
    {
      test.pass(t2, msg);
      promise1.resolve(msg);
    }).fail(function (p,t,err)
    {
      test.fail(t2, err);
      promise1.reject(p, t, err);
    });

    promise1.deferFail('promise 1 deferred failure', null, undefined, 400);
    promise2.deferFail('promise 2 deferred failure', null, undefined, 200);
    promise2.deferDone('promise 2 deferred success', null, undefined, 100);

    // TODO: more tests here.

    return promise1;
  });

})(window.Lum);