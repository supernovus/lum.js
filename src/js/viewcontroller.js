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
      self.calls = [];
  }

  Nano.ViewController.prototype.add = function (func)
  {
    if (this.calls)
    {
      this.calls.push(func);
    }
    else
    {
      this.on("ready", func);
    }
  }

  Nano.ViewController.prototype.start = function (api)
  { // Register all of our functions. Make sure the page is loaded first.
    var self = this;
    $(function()
    {
      if (this.calls)
      {
        for (var c in this.calls)
        {
          var call = this.calls[c];
          call(api);
        }
      }
      else
      {
        self.trigger("ready", api);
      }
    });
  }

  Nano.ViewController.makeGUI = function ()
  {
    var self = this;
    var newGUI = function ()
    {
      self.call(this);
    }
    Nano.extend(self, newGUI);
    return newGUI;
  }

})(jQuery,                       // jQuery is always required. 
window.riot 
  ? window.riot.observable       // If 'riot' exists, use it.
  : window.Nano.observable       // Nano may contain the observable trait.
);
