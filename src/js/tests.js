(function($)
{
  "use strict";

  if (window.Nano === undefined || Nano.Test === undefined || Nano.Hash === undefined || $ === undefined)
  {
    throw new Error("Missing required libraries");
  }

  var testsInstance; // Private storage for the "global" Tests instance.

  /**
   * A class representing a Test Suite.
   *
   * Handles loading the scripts using jQuery.ajax(), and rendering them
   * on the page. Has an internal child class called TestSet that represents
   * each set of tests that can be run.
   */
  Nano.Tests = class
  {
    /**
     * Create a new instance.
     *
     * @param object options   A set of named options.
     *
     *  appRoot:     Set the appRoot to this path.
     *  scriptRoot:  Set the scriptRoot to this path.
     *  htmlRoot:    Set the htmlRoot to this path.
     *
     * Not generally called manually. See createInstance() static method.
     */
    constructor (options)
    {
      this.testSets = {};
      this.appRoot = options.appRoot;
      this.scriptRoot = options.scriptRoot;
      this.htmlRoot = options.htmlRoot;
    }

    /**
     * Initialize the Tests.
     *
     * @param jQuery listEl     The element to use for a list of tests.
     * @param jQuery outputEl   The element to use for test output.
     *
     * This should be ran after adding all available test sets.
     *
     * It will call renderTests() automatically, and register an event
     * handler for clicking on the test names in the list, which will 
     * show the test output (it will ensure the tests are ran first.)
     */
    initialize (listEl, outputEl)
    {
      if (listEl === undefined || outputEl === undefined)
      {
        throw new Error("initialize() needs list and output elements");
      }
      this.listEl = listEl;
      this.outputEl = outputEl;

      var testSuite = this;

      var urlHash = new Nano.Hash();
      $(window).on('hashchange', function (e)
      {
        var testId = urlHash.getOpt('test');
        if (testId)
        {
          testSuite.showTest(testId);
        }
        else
        {
          testSuite.resetPage();
        }
      });

      listEl.on('click', 'li', function (e)
      {
        var id = $(this).prop('id').replace('tab_','');
        urlHash.update({test: id});
      });

      this.renderTests(listEl);

      $(window).trigger('hashchange'); // Show current test if set.
    }

    resetPage ()
    {
      this.listEl.find('li').removeClass('active');
      this.outputEl.find('.output').removeClass('active');
    }

    /**
     * Show a test page, will run the test if it hasn't been run yet.
     */
    showTest (setId)
    {
      var tab = this.listEl.find('#tab_'+setId);
      if (tab.length == 0) return; // No tab found.
      if (tab.hasClass('active')) return; // Already the active tab.

      this.resetPage();

      tab.addClass('active');

      var outputId = '#output_'+setId;
      var outputDiv = this.outputEl.find(outputId);
      if (outputDiv.length == 0)
      { // We haven't run the test yet.
        var testSet = this.getSet(setId);
        testSet.run(this.outputEl);
        outputDiv = this.outputEl.find(outputId);
        if (outputDiv.length == 0)
        { // Still something wrong.
          throw new Error("Could not find output div for test: "+setId);
        }
      }

      outputDiv.addClass('active');
    }

    /**
     * Add a Test Set.
     *
     * @param string id      The id of the test set, must be unique.
     * @param string name    A friendly name for the test set.
     * @param array scripts  An array of scripts to be loaded (in given order.)
     *
     * @return TestSet       The TestSet instance.
     *
     * See the loadScripts() method for details on the 'scripts' parameter.
     */
    addSet (id, name, scripts)
    {
      var test = new TestSet(id, name, this, scripts);
      this.testSets[id] = test;
      return test;
    }

    /**
     * Get a Test Set.
     *
     * @param string id   The id of the set we want to get.
     *
     * @return TestSet    The TestSet instance.
     */
    getSet (id)
    {
      return this.testSets[id];
    }

    /**
     * Load a Javascript resource.
     *
     * @param string url          The URL for the script to load.
     * @param function callback   A callback (optional).
     *
     * If the callback parameter is specified, the call with be asynchronous,
     * otherwise it will be synchronous.
     *
     * The URL string can use the following replacement strings:
     *
     *  '@@'  The appRoot (if set.)
     *  '@'   The scriptRoot (if set.)
     *
     */
    loadScript (url, callback)
    {
      if (this.appRoot)
      {
        url = url.replace('@@', this.appRoot);
      }
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

    /**
     * Load a bunch of scripts.
     *
     * @param array urls   An array of URLs and/or TestSet instances to load.
     *
     * For each of the items in the array, if it's a string, it's passed to
     * the loadScript() method. If it's a TestSet, we call it's loadScripts()
     * method. This is the method used by TestSet.loadScripts() to perform
     * the actual loading.
     */
    loadScripts (urls)
    { // Load a set of scripts synchronously.
      for (let u in urls)
      {
        var url = urls[u];
        if (typeof url === 'string')
        {
          this.loadScript(url);
        }
        else if (url instanceof TestSet)
        {
          url.loadScripts();
        }
        else
        {
          throw new Error("Unknown URL passed to loadScripts()");
        }
      }
    }

    /**
     * Load an HTML resource.
     *
     * @param string url          The URL for the script to load.
     * @param function callback   A callback (optional).
     *
     * If the callback parameter is specified, the call with be asynchronous,
     * otherwise it will be synchronous.
     *
     * The URL string can use the following replacement strings:
     *
     *  '@@'  The appRoot (if set.)
     *  '@'   The htmlRoot (if set.)
     *
     */
    loadHTML (url, callback)
    {
      if (this.appRoot)
      {
        url = url.replace('@@', this.appRoot);
      }
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

    /**
     * Render the lists.
     *
     * @param jQuery listEl    The list element (optional).
     *
     * You probably don't need to call this, and if you do, you probably
     * don't need to specify the listEl manually (it should have been set
     * by the initialize() method.)
     */
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

    /**
     * Get the current instance of the test suite.
     *
     * Will throw an Error if createInstance() has not been called.
     *
     * @return Tests   The current instance of the Tests.
     */
    static getInstance ()
    {
      if (testsInstance === undefined)
      {
        throw new Error("Tests instance not created yet");
      }
      return testsInstance;
    }

    /**
     * Create an instance of the test suite.
     *
     * Will throw an error if you try to call it more than once.
     *
     * @param object options   Options to pass to the constructor.
     * @return Tests           The created instance.
     */
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

  /**
   * A class representing a set of tests to run.
   *
   * Each has a unique id, a friendly name, and a list of scripts to load.
   * It also has an internal testInstance property which is an instance of
   * the Nano.Test class used to perform the actual tests.
   */
  class TestSet
  {
    /**
     * Create a TestSet instance.
     *
     * @param string id         The id of the test set.
     * @param string name       The friendly name for display.
     * @param Tests tests       The parent Tests instance.
     * @param array scripts     The scripts to load for this test set.
     *
     * See the loadScripts() method for details on the 'scripts' parameter.
     */
    constructor (id, name, tests, scripts)
    {
      this.parent = tests;
      this.id = id;
      this.name = name;
      this.scripts = scripts;
      this.testInstance = new Nano.Test();
    }

    /**
     * Set the handler function that will actually run the tests.
     *
     * @param function func    The function to handle the tests.
     *
     * The function will be passed the Nano.Test instance as it's only
     * parameter. It can then do whatever is needed to run the tests.
     *
     * This should be called by the primary test script, which must be
     * included as the last child of the scripts array in the constructor.
     */
    setHandler (func)
    {
      this.testFunction = func;
    }

    /**
     * Load the scripts associated with this test set.
     *
     * See Tests.loadScripts() for details.
     */
    loadScripts ()
    {
      this.parent.loadScripts(this.scripts);
    }

    /**
     * Run the tests.
     *
     * @param jQuery outputEl   The output element (optional.)
     *
     * Checks to see if the setHandler() method has been run, and if not,
     * it calls loadScripts() automatically.
     *
     * Then it will run the test handler, passing it the Nano.Test instance.
     * Finally, it takes the output from the Nano.Test instance, and renders
     * it into a new div within the output element.
     *
     * You probably will never have to run this manually, and if you do,
     * you probably don't have to pass the outputEl parameter, as it will
     * default to the parent Tests instance's outputEl property.
     */
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