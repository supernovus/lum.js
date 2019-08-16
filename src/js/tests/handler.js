(function($)
{
  "use strict";

  if (window.Nano === undefined || window.Nano.Tests === undefined)
  {
    throw new Error("Missing required libraries");
  }

  var h = Nano.Tests.Handler = {};
  
  h.loadScript = function (url)
  {
    $.ajax({async: false, url: url, dataType: 'script'});
  }

  h.loadScripts = function (urls)
  {
    for (let u in urls)
    {
      var url = urls[u];
      h.loadScript(url);
    }
  }

  h.registerEvents = function (listEl, outputEl)
  {
    listEl.on('click', 'li', function (e)
    {
      var tab = $(this);
      tab.toggleClass('active');
      var tabId = tab.prop('id').replace('tab_','test_');
      outputEl.find('#'+tabId).toggle();
    });
  }

  h.runTests = function (listEl, outputEl)
  {
    let tests = Nano.Tests.getInstance().getSets();
    for (let t in tests)
    {
      var test = tests[t];
      var listItem = $('<li id="tab_'+t+'">'+test.name+'</li>');
      listEl.append(listItem);
      var testResults = test.run();
      var testOutput = $('<div class="output" id="test_'+t+'"><h2>'+test.name+'</h2><pre>'+testResults.tap()+'</pre></div>');
      outputEl.append(testOutput);
    }
  }

})(jQuery);