Lum.lib(
{
  name: 'whenreceived',
  assign: 'WhenReceived',
},
function(Lum)
{
  "use strict";

  const {F} = Lum._;
 
  return class WhenReceived extends Lum.AbstractClass
  {
    construct(delay, attempts)
    {
      this.repeatDelay = delay;
      this.attemptsLeft = attempts;
    }

    /**
     * Implement this method to request the data.
     *
     * @return {jqXHR|Promise} - The async request for data.
     */
    request()
    {
      this.$abstract('request');
    }

    /**
     * Implement this to validate the data received to see if it's correct.
     *
     * @param {object} data - The data received.
     * @return {boolean} - If the data was valid.
     */
    validate(data)
    {
      this.$abstract('validate');
    }

    /**
     * Implement this for when the operation is complete.
     *
     * This is called either when the data has finally been received
     * successfully (the `validate()` method returned true) or the
     * maximum number of attempts has been made and we're not going to
     * try again.
     *
     * @param {object|null} data - The data if successful, `null` if not.
     */
    done(data)
    {
      this.$abstract('done');
    }

    clear()
    {
      clearTimeout(this.taskId);
    }

    run(delay)
    {
      if (--this.attemptsLeft > 0)
      {
        this.taskId = setTimeout(() => this.check(), delay)
      }
      else
      {
        this.done(null);
      }
    }

    retry()
    {
      this.run(this.repeatDelay);
    }

    check()
    {
      const self = this;

      function onComplete(data)
      {
        if (self.validate(data))
        { // We finished, yay.
          self.done(data);
          self.clear(); // Shouldn't be necessary, but just in case.
        }
        else
        { // Try again after a certain delay.
          self.retry();
        }
      }

      const res = this.request();

      if (typeof res.done === F && typeof res.fail === F)
      { // Assuming this is a jqXHR instance returned by $.ajax();
        res.done(onComplete).fail(function()
        {
          console.debug("jQuery AJAX error occurred", arguments);
          self.retry();
        });
      }
      else if (res instanceof Promise)
      { // Promise instances are just as simple.
        res.then(onComplete).catch(function()
        {
          console.debug("Promise error occurred", arguments);
          self.retry();
        });
      }
      else
      {
        throw new Error("The request() method did not return a valid value");
      }
    }

  } // class WhenReceived

});