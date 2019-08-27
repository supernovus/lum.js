(function()
{
  "use strict";

  if (window.Nano === undefined || Nano.Tests === undefined || Nano.ModelAPI === undefined)
  {
    throw new Error("Missing required libraries");
  }

  let testSuite = Nano.Tests.getInstance();
  let testSet = testSuite.getSet('modelapi');

  testSet.createModelClass = function ()
  {
    let ModelClass = class extends Nano.ModelAPI
    {
      getPersonByName (name)
      {
        if (this.model.people === undefined) return undefined;
        for (let p in this.model.people)
        {
          var person = this.model.people[p];
          if (person.name === name)
          {
            return person;
          }
        }
      }

      getPeopleOlderThan (age)
      {
        if (this.model.people === undefined) return [];
        var matched = [];
        for (let p in this.model.people)
        {
          var person = this.model.people[p];
          if (person.age > age)
          {
            matched.push(person);
          }
        }
        return matched;
      }

      getPeopleBornBefore (year)
      {
        if (this.model.people === undefined) return [];
        var matched = [];
        for (let p in this.model.people)
        {
          var person = this.model.people[p];
          if (person.birthYear < year)
          {
            matched.push(person);
          }
        }
        return matched;
      }

      extendPerson (person)
      {
        if (typeof person.kids !== 'object')
        {
          person.kids = [];
        }
        if (typeof person.parents !== 'object')
        {
          person.parents = [];
        }

        Nano.addProperty(person, 'model', this);

        Nano.addAccessor(person, 'birthYear', function ()
        {
          return 2019 - this.age;
        },
        function (newYear)
        {
          if (newYear > 2019)
          {
            throw new Error("Cannot set a birth year greater than 2019");
          }
          this.age = 2019 - newYear;
        });

        Nano.addProperty(person, 'addChild', function (child, mutual=true)
        {
          this.kids.push(child);
          if (mututal && !child.parents.includes(this))
          {
            child.parents.push(this);
          }
        });

        Nano.addProperty(person, 'addParent', function (parent, mutual=true)
        {
          this.parents.push(parent);
          if (mututal && !parent.kids.includes(this))
          {
            parent.kids.push(this);
          }
        });

        Nano.addProperty(person, 'toJSON', function (jprop)
        {
          var struct =
          {
            name: this.name,
            age: this.age,
          }
          let person = this;
          let model = this.model;
          let mdata = model.model.people;
          function extractRefs (ref)
          {
            if (person[ref].length > 0)
            {
              struct[ref] = [];
              for (let k = 0; k < person[ref].length; k++)
              {
                let refobj = person[ref][k];
                if (model.useNames)
                { // Use the name.
                  struct.kids.push(refobj.name);
                }
                else
                { // Use the position in our parent model data.
                  let pos = mdata.indexOf(refobj);
                  if (pos !== -1)
                  {
                    struct[ref].push(pos);
                  }
                }
              }
            }
          }
          extractRefs('kids');
          extractRefs('parents');
          return struct;
        });

        // Should not be run manually, must be ran AFTER all people are loaded.
        Nano.addProperty(person, '_expand_refs', function ()
        {
          function need_oq ()
          {
            if (Nano.oQuery === undefined)
            {
              throw new Error("Nano.oQuery was requested but is not loaded");
            }
            return Nano.oQuery;
          }
          let person = this;
          let model = this.model;
          let mdata = model.model.people;
          function expandRefs (ref)
          {
            let rdata = person[ref];
            if (rdata.length === 0) return;
            for (var k = 0; k < rdata.length; k++)
            {
              let rk = rdata[k];
              let rt = typeof rk;
              if (rt === 'string')
              { // A name was specified.
                let oq = need_oq();
                let person = oq({name: rt}, mdata);
                if (person)
                { // Replace the reference with a person object.
                  rdata[k] = person;
                }
                else
                {
                  throw new Error("Name '"+rk+"' not found for '"+ref+"' reference");
                }
              }
              else if (rt === 'number')
              { // An array offset was specified.
                let person = mdata[rk];
                if (person)
                {
                  rdata[k] = person;
                }
                else
                {
                  throw new Error("Offset '"+rk+"' not found for '"+ref+"' reference");
                }
              }
            }
          }
          expandRefs('kids');
          expandRefs('parents');
        });

        return person;
      }

      addPerson (name, age, opts)
      {
        let person = this.extendPerson(
        {
          name: name,
          age: age,
          kids: opts.kids,
          parents: opts.parents,
        });
        this.model.people.push(person);
        person._expand_refs();
      }
    }

    ModelClass.prototype.post_init.extendPeople = function (conf)
    {
      console.debug(this.model);
      if (this.model.people === undefined) return; // No people.
      for (let p in this.model.people)
      { // First pass to extend the people objects.
        let person = this.model.people[p];
        this.extendPerson(person);
      }
      for (let p in this.model.people)
      { // Second pass to expand references.
        this.model.people[p]._expand_refs();
      }
    }

    return ModelClass;
  }

  testSet.makePeopleElement = function (addToBody=false, peopleOpts={})
  {
    var peopleSrc = testSuite.makePeople(peopleOpts);

    console.debug("peopleSrc", peopleSrc);

    var peopleEl = $('<input type="hidden" id="modelapi_test_people" />');
    peopleEl.val(JSON.stringify(peopleSrc));
    if (addToBody)
    {
      $('body').append(peopleEl);
    }
    return peopleEl;
  }

  testSet.setHandler(function (test)
  {
    test.plan(10);

    let Model1 = testSet.createModelClass();

    // TODO: add kids/parents for further tests.
    let peopleEl = testSet.makePeopleElement();

    let i1 = new Model1(
    {
      sources:
      {
        people:
        {
          type: 'json',
          element: peopleEl,
        },
        // TODO: add a 'ws' model and test with JSONPlaceholder.
      }
    });

    console.debug("modelapi instance 1", i1);

    const tn =
    [
      'model source loaded',
      'number of people parsed',
      'method method returned value',
      'object had proper properties',
      'post_init extended object',
      'extended object accessor assignment',
      'model matching method 1',
      'model matching method 2',
    ];

    // First set of tests are all conditional.
    testSet.tryTests(tn,
    {
      tests: function (t)
      {
        test.is((typeof i1.model.people), 'object', t.next());
        test.is(i1.model.people.length, 4, t.next());
        let bob = i1.getPersonByName('Bob');
        test.is(typeof bob, 'object', t.next());
        test.is(bob.age, 40, t.next());
        test.is(bob.birthYear, 1979, t.next());
        bob.birthYear = 1977;
        test.is(bob.age, 42, t.next());

        var over20 = i1.getPeopleOlderThan(20);
        test.is(over20.length, 2, t.next());
        var before93 = i1.getPeopleBornBefore(2002);
        test.is(before93.length, 3, t.next());
      }
    });

    let Model2 = Model1.makeAPI();
    test.is(typeof Model2.prototype.addSource, 'function', 'makeAPI added instance methods');
    test.is(typeof Model2.makeAPI, 'function', 'makeAPI added static methods');

  });

})();