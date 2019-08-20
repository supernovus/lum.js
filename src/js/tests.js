(function($)
{
  "use strict";

  if (window.Nano === undefined || window.Nano.Test === undefined || $ === undefined)
  {
    throw new Error("Missing required libraries");
  }

  var testsInstance;

  Nano.Tests = class
  {
    constructor (options)
    {
      this.testSets = {};
      this.scriptRoot = options.scriptRoot;
      this.htmlRoot = options.htmlRoot;
      if (options.initialize)
      {
        this.initialize(options.listElement, options.outputElement);
      }
    }

    initialize (listEl, outputEl)
    {
      if (listEl === undefined || outputEl === undefined)
      {
        throw new Error("initialize() needs list and output elements");
      }
      this.listEl = listEl;
      this.outputEl = outputEl;

      var testSuite = this;

      listEl.on('click', 'li', function (e)
      {
        var tab = $(this);
        if (tab.hasClass('active')) return; // Already the active tab.

        listEl.find('li').removeClass('active');
        outputEl.find('.output').removeClass('active');

        tab.addClass('active');

        var setId = tab.prop('id').replace('tab_', '');
        var outputId = '#output_'+setId;
        var outputDiv = outputEl.find(outputId);
        if (outputDiv.length == 0)
        { // We haven't run the test yet.
          var testSet = testSuite.getSet(setId);
          testSet.run(outputEl);
          outputDiv = outputEl.find(outputId);
          if (outputDiv.length == 0)
          { // Still something wrong.
            throw new Error("Could not find output div for test: "+setId);
          }
        }

        outputDiv.addClass('active');
      });

      this.renderTests(listEl);
    }

    /**
     * Add a Test Set.
     *
     * @param string id      The id of the test set, must be unique.
     * @param string name    A friendly name for the test set.
     * @param array scripts  An array of scripts to be loaded (in proper order.)
     */
    addSet (id, name, scripts)
    {
      var test = new TestSet(id, name, this, scripts);
      this.testSets[id] = test;
      return test;
    }

    getSet (id)
    {
      return this.testSets[id];
    }

    loadScript (url, callback)
    {
      if (this.scriptRoot)
      {
        url = url.replace('@', this.scriptRoot);
      }
      var ajaxOpts = {url: url, dataType: 'script'};
      if (typeof callback === 'function')
      {
        ajaxOpts.success = callback;
      }
      else
      {
        ajaxOpts.async = false;
      }
      return $.ajax(ajaxOpts); 
    }

    loadScripts (urls)
    { // Load a set of scripts synchronously.
      for (let u in urls)
      {
        var url = urls[u];
        if (typeof url === 'string')
        {
          this.loadScript(url);
        }
        else
        {
          throw new Error("Unknown URL passed to loadScripts()");
        }
      }
    }

    loadHTML (url, callback)
    {
      if (this.htmlRoot)
      {
        url = url.replace('@', this.htmlRoot);
      }
      var ajaxOpts = {url: url, dataType: 'html'};
      if (typeof callback === 'function')
      {
        ajaxOpts.success = callback;
      }
      else
      {
        ajaxOpts.async = false;
      }
      return $.ajax(ajaxOpts);
    }

    renderTests (listEl)
    {
      listEl = listEl || this.listEl;
      if (listEl === undefined)
      {
        throw new Error("No list element specified");
      }
      listEl.empty();
      for (let id in this.testSets)
      {
        var test = this.testSets[id];
        var listItem = $('<li id="tab_'+id+'">'+test.name+'</li>');
        listEl.append(listItem);
      }
    }

    static getInstance (options)
    {
      if (testsInstance === undefined)
      {
        throw new Error("Tests instance not created yet");
      }
      return testsInstance;
    }

    static createInstance (options)
    {
      if (testsInstance !== undefined)
      {
        throw new Error("Tests instance already exists");
      }
      testsInstance = new Nano.Tests(options);
      return testsInstance;
    }

  }

  class TestSet
  {
    constructor (id, name, tests, scripts)
    {
      this.parent = tests;
      this.id = id;
      this.name = name;
      this.scripts = scripts;
      this.testInstance = new Nano.Test();
    }

    setHandler (func)
    {
      this.testFunction = func;
    }

    loadScripts ()
    {
      this.parent.loadScripts(this.scripts);
    }

    run (outputEl)
    {
      outputEl = outputEl || this.parent.outputEl;
      if (this.testFunction === undefined)
      { // We need to load the test scripts first.
        this.loadScripts();
      }
      if (typeof this.testFunction === 'function')
      {
        this.testFunction(this.testInstance);
        if (outputEl)
        {
          var testOutput = $('<div class="output" id="output_'+this.id+'"><h2>'+this.name+'</h2><pre>'+this.testInstance.tap()+'</pre></div>');
          outputEl.append(testOutput);
        }
      }
      else
      {
        throw new Error("No test handler was set");
      }
      return this.testInstance;
    }
  }

})(jQuery);