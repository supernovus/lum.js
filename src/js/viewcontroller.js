(function($, observable)
{
  if (window.Nano === undefined)
  {
    console.log("fatal error: missing Nano global namespace");
    return;
  }

  Nano.ViewController = function ()
  {
    /**
     * A reference to ourself. If observable() is found, we apply it.
     */
    var self;
    if (observable !== undefined)
      self = observable(this);
    else
      self = this;

    self.api = null;
    if (observable === undefined)
      self.readyHandlers = [];
  }

  Nano.ViewController.prototype.add = function (func)
  {
    if (this.readyHandlers)
    {
      this.readyHandlers.push(func);
    }
    else
    {
      this.on("ready", func);
    }
  }

  Nano.ViewController.prototype.start = function (modelclass, conf)
  { // Register all of our functions. Make sure the page is loaded first.
    var self = this;
    $(function()
    {
      var api = self.apiInstance = new modelclass(conf);
      if (self.readyHandlers)
      {
        for (var c in self.readyHandlers)
        {
          var handler = self.readyHandlers[c];
          handler.call(self, api);
        }
      }
      else
      {
        self.trigger("ready", api);
      }
    });
  }

  Nano.ViewController.prototype.getHook = function (hookname)
  {
    if (this.readyHandlers)
    {
      Nano.warn("getHook requires 'observable' library to be loaded.");
      return;
    }
    var self = this;
    var hook = function (evnt)
    {
      var element = $(this);
      self.trigger(hookname, element, evnt);
    }
    return hook;
  }

  Nano.ViewController.makeGUI = function (replicate)
  {
    return Nano.extend(this, null, replicate);
  }

})(
  jQuery,                        // jQuery is always required. 
  window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
);

