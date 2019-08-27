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
        Nano.addProperty(person, 'addChild', function (child)
        {
          this.kids.push(child);
          if (!child.parents.includes(this))
          {
            child.parents.push(this);
          }
        });
        Nano.addProperty(person, 'addParent', function (parent)
        {
          this.parents.push(parent);
          if (!parent.kids.includes(this))
          {
            parent.kids.push(this);
          }
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
      }
    }

    ModelClass.prototype.post_init.extendPeople = function (conf)
    {
      if (this.model.people === undefined) return; // No people.
      for (let p in this.model.people)
      {
        var person = this.model.people[p];
        this.extendPerson(person);
      }
    }

    return ModelClass;
  }

  testSet.makePeopleElement = function (addToBody=false, registerMore=false)
  {
    var peopleSrc = testSuite.makePeople(registerMore);

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

    test.is((typeof i1.model.people), 'object', 'model source loaded');
    test.is(i1.model.people.length, 4, 'correct number of people parsed');
    var bob = i1.getPersonByName('Bob');
    test.is(typeof bob, 'object', 'model method returned proper value');
    test.is(bob.age, 40, 'object had proper properties');
    test.is(bob.birthYear, 1979, 'extended object post_init call worked');
    bob.birthYear = 1977;
    test.is(bob.age, 42, 'second post_init added assignment worked');

    var over20 = i1.getPeopleOlderThan(20);
    test.is(over20.length, 2, 'model matching method 1 worked');
    var before93 = i1.getPeopleBornBefore(2002);
    test.is(before93.length, 3, 'model matching method 2 worked');

    let Model2 = Model1.makeAPI();
    test.is(typeof Model2.prototype.addSource, 'function', 'makeAPI added instance methods');
    test.is(typeof Model2.makeAPI, 'function', 'makeAPI added static methods');

    peopleEl.remove(); // Take it out of the DOM again.

  });

})();