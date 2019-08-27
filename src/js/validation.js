(function($)
{
// Now in script namespace.

"use strict";

if (window.Nano === undefined)
{
  window.Nano = {};
}

const VALID_NS = "validation";

const VALID_MSG =
{
  invalid:  "invalid form",
  notEmpty: "field is empty",
  isEmpty:  "field is not empty",
  isInt:    "field is not integer",
  isFloat:  "field is not number",
  isAlpha:  "field is not alpha",
  isAlnum:  "field is not alphanumeric",
  isIdent:  "field is not identifier",
  regex:    "field does not match regex",
};

const BUILT_INS =
{
  isInt:   /^[-+]?\d+$/,             // integer
  isFloat: /^[-+]?\d*\.?\d+$/,       // floating point number
  isAlpha: /^[A-Za-z]+$/,            // alphabetic
  isAlnum: /^[A-Za-z0-9]+$/,         // alphanumeric
  isIdent: /^\w+$/,                  // valid identifier (word character)
};

/**
 * Simple form Validation object.
 *
 * Built-in test types:
 *
 * | Test name | Description                       |
 * | --------- | --------------------------------- |
 * | notEmpty  | The field is not empty.           |
 * | isEmpty   | The field must be empty.          |
 * | isInt     | The field value is an integer.    |
 * | isFloat   | The field value is a float.       |
 * | isAlpha   | The field value is alphabetic.    |
 * | isAlnum   | The field value is alpha-numeric. |
 * | isIdent   | The field value is an identifier. |
 *
 */
Nano.Validation = class
{
  /**
   * Create a Validation object.
   *
   * @param {object} [options] Options to build the object
   * @param {Nano.Notifications} [options.status] A Nano.Notifications instance.
   *  If used, validation errors will be output to the Notifiations instance
   *  rather than displaying an alert box.
   * @param {object} [options.events] A map of events that may be called.
   * Any test name may have an event mapped to it. If no event specific to
   * the test is found, then one called 'onFail' is checked for. Events are
   * entirely optional. The event must return true if the element that failed
   * should be focused, or false if it shouldn't be focused.
   */
  constructor (conf={})
  {
    if ('status' in conf)
    {
      this.status = conf.status;
    }
    this.disabled = false;
    this.events = 'actions' in conf ? conf.actions : {};
    this.valid = true;
    this.tests = [];
  }

  /**
   * Add a field.
   *
   * @param {string} selector - The jQuery selector used to match the element(s).
   * @param {(boolean|function|string|object)} [opts] - Options, may be in a few formats.
   *
   * A boolean true will set the 'notEmpty' test to true.
   * A function will be applied as the test method, and passed the element.
   * A string will set a test by that name to true.
   * A RegExp will be set to the 'regex' property, and the value must match it.
   * An object can be used to set test properties directly.
   */
  addField (selector, opts)
  {
    var test = {selector: selector};
  
    var otype = typeof opts;
  
    if (otype === "boolean")
    {
      if (opts)
      {
        test.notEmpty = true;
      }
    }
    else if (otype === "function")
    {
      test.method = opts;
    }
    else if (otype === "string")
    {
      test[opts] = true;
    }
    else if (otype === "object")
    {
      if (opts instanceof RegExp)
      {
        test.regex = opts;
      }
      else
      {
        for (var key in opts)
        {
          test[key] = opts[key];
        }
      }
    }
  
    this.tests.push(test);
  }
 
  /**
   * Add a custom test without a selector/element.
   *
   * It will have the Validation instance set as 'this' when ran.
   *
   * @param {function} test  The test to run (must be self contained.)
   *
   */
  addCustom (test)
  {
    if (typeof test === "function")
    {
      this.tests.push({method: test});
    }
    else
    {
      console.log("invalid custom test passed to Validation.addCustom()");
    }
  }
  
  /**
   * Something failed.
   *
   * If the 'status' property is set, uses it to send the failure message.
   * Otherwise will display an alert() box, and use the console log.
   *
   * You probably don't have to call this, it's an internal method.
   *
   * @param {string} msg  The message to be displayed.
   * @param {object} [params] Parameters for the message (used by 'status'.)
   */
  fail (msg, params)
  {
    this.valid = false;
    if (this.status !== undefined)
    {
      this.status.msg(msg, {tag: VALID_NS, reps: params});
    }
    else
    {
      alert("The form is not complete, or contains invalid data.\nPlease check all fields and try again.");
      console.log("validation error", msg, params);
    }
  }
  
  /**
   * Reset the form.
   *
   * Marks the form as good, and if 'status' was used, clears any messages.
   */
  reset ()
  {
    this.valid = true;
    if (this.status !== undefined)
    {
      this.status.clear(VALID_NS);
    }
  }
  
  /**
   * Runs the validation.
   */
  validate ()
  {
    var self = this;
  
    if (this.disabled) return true;
  
    var testTypes = Nano.Validation.TestTypes;
  
    for (var t in this.tests)
    {
      var test = this.tests[t];
  
      if ('selector' in test)
      {
        $(test.selector).each(function ()
        {
          if (self.valid)
          {
            var element = $(this);
            if (typeof test.method === "function")
            {
              var ok = test.method.call(self, element);
              if (ok === false)
              {
                return self.fail(VALID_MSG.invalid);
              }
            } // end method
            if (test.notEmpty)
            {
              var val = $.trim(element.val());
              if (val == '')
              {
                return self.failEvent('notEmpty', element);
              }
            } // end notEmpty
            if (test.isEmpty)
            {
              var val = $.trim(element.val());
              if (val !== '')
              {
                return self.failEvent('isEmpty', element);
              }
            }
            if (test.regex !== undefined)
            {
              if (!test.regex.test(element.val()))
              {
                return self.failEvent('regex', element);
              }
            } // end regex
            for (var testName in testTypes)
            {
              if (test[testName])
              {
                var regex = testTypes[testName];
                if (!regex.test(element.val()))
                {
                  return self.failEvent(testName, element);
                }
              }
            } // end various regex based tests.
          }
        });
      }
      else
      {
        if (typeof test.method === "function")
        {
          var ok = test.method.call(self);
          if (ok === false)
          {
            self.fail(VALID_MSG.invalid);
          }
        }
      }
      
      if (!this.valid) { break; } // We cannot continue.
  
    }
  
    return this.valid;
  }
  
  /**
   * A failure event for a built-in test was triggered.
   *
   * You'll never have to run this, it's an internal method.
   *
   * @param {string} eventName  The built in test that failed.
   * @param {jQuery} element    The jQuery object representing the element(s).
   */
  failEvent (eventName, element)
  {
    var focus;
  
    if (this.events[eventName] !== undefined)
    {
      focus = this.events[eventName](element);
    }
    else if (this.events.onFail !== undefined)
    {
      focus = this.events.onFail(element);
    }
    
    if (focus !== false)
    {
      element.focus();
    }
  
    this.fail(VALID_MSG[eventName]);
  }
  
  /**
   * Activate the validation on form submission.
   *
   * Any attempt to submit the form will run reset() then validate().
   * It won't actually submit unless validate() returns true.
   */
  activate ()
  {
    var self = this;
    $('form').on('submit', function () { self.reset(); return self.validate(); });
  }

} // class Nano.Validation

Nano.Validation.TestTypes = BUILT_INS;

// End of script namespace.
})(jQuery);
