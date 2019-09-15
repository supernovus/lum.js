(function(Nano)
{
  "use strict";

  if (Nano === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Nano.needLibs('tests','hash');

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('hash');

  testSet.setHandler(function (test)
  {
    test.plan(33);

    // We're not using the real browser location.hash as that would
    // add a whole bunch of pages to the history. Instead we're using
    // a fake hash string stored in a private variable.

    let currentHash = '';

    let hashOpts =
    {
      getHash: function ()
      {
        return currentHash;
      },
      setHash: function (string)
      {
        currentHash = string;
      },
    }

    let hash = new Nano.Hash(hashOpts);

    // First off, we're going to test the getOpts and getOpt methods.

    function ghs (opts={})
    {
      return hash.getOpts(opts);
    }

    function gho (name, opts={})
    {
      return hash.getOpt(name, opts);
    }

    test.isJSON(ghs(), {}, 'getOpts with no hash');
    test.is(gho('page'), undefined, 'getOpt with no hash');
    currentHash = '#';
    test.isJSON(ghs(), {}, 'getOpts with empty hash');
    test.is(gho('page'), undefined, 'getOpt with empty hash');
    currentHash = '#page';
    test.isJSON(ghs(), {page:null}, 'getOpts with standalone option');
    test.is(gho('page'), null, 'getOpt with standalone option');
    currentHash = '#page=1';
    test.isJSON(ghs(), {page:'1'}, 'getOpts with specified option');
    test.is(gho('page'), '1', 'getOpt with specified option');
    currentHash = '#page=1;name=Bob';
    test.isJSON(Object.keys(ghs()), ['page','name'], 'getOpts with multiple options');
    test.is(gho('name'), 'Bob', 'getOpt with multiple options');
    currentHash = '#names=Bob=Lisa=Kevin=Michelle';
    test.is(ghs().names.length, 4, 'getOpts with multiple values');
    test.is(gho('names').length, 4, 'getOpt with multiple values');
    currentHash = '#1';
    test.is(gho('page'), undefined, 'getOpt with implit option value and shortOpt false');
    test.is(gho('page', {shortOpt: true}), '1', 'getOpt with implicit option value and shortOpt true');
    currentHash = '#def=[1,2,3,4]';
    hash.useJson('array');
    test.isJSON(gho('def', {json: 'array'}), [1,2,3,4], 'getOpt with JSON array value');
    currentHash = '#def={"hello":"world"}';
    hash.useJson('object');
    test.isJSON(gho('def'), {hello:'world'}, 'getOpt with JSON object value');
    hash.useJson(false);
    currentHash = '#first=true;second=false;third=yes;fourth=no';
    test.isJSON(ghs(), {first:true, second: false, third: true, fourth: false}, 'getOpts with true/false values');

    // Now we'll test the replace() method.

    hash.replace({name: 'Bob', hello: 'world', page: 1});
    test.is(currentHash, '#name=Bob;hello=world;page=1', 'replace serialized simple object');

    let arrOpts = {sections:['one','two',3]};
    let simpleArr = '#sections=one=two=3';
    let jsonArr = '#sections=["one","two",3]';
    hash.replace(arrOpts);
    test.is(currentHash, simpleArr, 'replace serialized simple array');
    hash.useJson('array');
    hash.replace(arrOpts);
    test.is(currentHash, simpleArr, 'replace serialized simple array with autoArray true');
    hash.replace(arrOpts, {autoArray: false});
    test.is(currentHash, jsonArr, 'replace serialized JSON array with autoArray false');
    arrOpts = {sections:['one','two',{hello:'world'}]};
    simpleArr = '#sections=one=two';
    jsonArr = '#sections=["one","two",{"hello":"world"}]';
    hash.replace(arrOpts);
    test.is(currentHash, jsonArr, 'replace serialized complex JSON array');
    hash.useJson(false);
    hash.replace(arrOpts);
    test.is(currentHash, simpleArr, 'replace serialized complex array without JSON, skipping non-serializable bits');
    test.dies(function ()
    {
      hash.replace({foo: {}});
    },
    'attempt to serialize object directly throws error');
    test.dies(function ()
    {
      hash.replace({foo: function () {return false}});
    },
    'attempt to serialize function throws error');

    // Test the update method.
    simpleArr = '#sections=one=two;hello=world';
    hash.update({hello: 'world'});
    test.is(currentHash, simpleArr, 'update added a value to the hash');
    hash.update({sections: undefined});
    test.is(currentHash, '#hello=world', 'update removed a value from the hash');

    // Next we'll test custom getter and setter values.

    let custGetters = 
    {
      separate: /\&|\:\:/,
      assign: ':',
      true: /^T$/,
      false: /^F$/,
    }
    hash.setGetters(custGetters);
    currentHash = '#first:true::second:false&third:T::fourth:F&fifth:[1,2,3]';
    let expected = 
    {
      first: 'true',
      second: 'false',
      third: true,
      fourth: false,
      fifth: "[1,2,3]"
    }
    test.isJSON(ghs(), expected, 'getOpts with custom parsing separators');

    let custSetters =
    {
      separate: '::',
      assign: '~',
      true: 'T',
      false: 'F',
    }
    hash.setSetters(custSetters);
    hash.replace(expected);
    expected = '#first~true::second~false::third~T::fourth~F::fifth~[1,2,3]';
    test.is(currentHash, expected, 'replace with custom serialization separators');

    // Finally, test the static class methods.
   
    currentHash = '#hello=world;goodbye=galaxy=universe';
    let staticOpts = Nano.Hash.getOpts({}, hashOpts);
    test.isJSON(staticOpts, {hello: 'world', goodbye: ['galaxy','universe']}, 'static Nano.Hash.getOpts() call works');

    staticOpts = Nano.Hash.getOpt('hello', {}, hashOpts);
    test.is(staticOpts, 'world', 'static Nano.Hash.getOpt() call works');

    staticOpts = {name: 'Bob', jobs: ['developer','admin']};
    expected = '#name=Bob;jobs=developer=admin';
    Nano.Hash.replace(staticOpts, {}, hashOpts);
    test.is(currentHash, expected, 'static Nano.Hash.replace() call works');

    Nano.Hash.update({name: 'Robert'},{},{},hashOpts);
    expected = '#name=Robert;jobs=developer=admin';
    test.is(currentHash, expected, 'static Nano.Hash.update() call works');

  });

})(window.Lum);