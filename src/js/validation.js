/**
 * Simple form Validation object.
 */

"use strict";

import $ from 'jquery';

var VALID_NS = "validation";

var VALID_MSG =
{
  invalid:  "invalid form",
  notEmpty: "field is empty",
  isInt:    "field is not integer",
  isFloat:  "field is not number",
  isAlpha:  "field is not alpha",
  isAlnum:  "field is not alphanumeric",
  isIdent:  "field is not identifier",
  regex:    "field does not match regex",
};

export default class Validation
{
  constructor (conf)
  {
    if (conf === undefined || conf === null) conf = {};
    if ('status' in conf)
    {
      this.status = conf.status;
    }
    this.events = 'actions' in conf ? conf.actions : {};
    this.valid = true;
    this.tests = [];
  }
  
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
      for (var key in opts)
      {
        test[key] = opts[key];
      }
    }
  
    this.tests.push(test);
  }
  
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
  
  fail (msg, params)
  {
    this.valid = false;
    if (this.status !== undefined)
    {
      this.status.msg(msg, VALID_NS, params);
    }
    else
    {
      alert("The form is not complete, or contains invalid data.\nPlease check all fields and try again.");
      console.log("validation error", msg, params);
    }
  }
  
  reset ()
  {
    this.valid = true;
    if (this.status !== undefined)
    {
      this.status.clear(VALID_NS);
    }
  }
  
  validate ()
  {
    var self = this;
  
    var testTypes =
    {
      isInt:   /^[-+]?\d+$/,             // integer
      isFloat: /^[-+]?\d*\.?\d+$/,       // floating point number
      isAlpha: /^[A-Za-z]+$/,            // alphabetic
      isAlnum: /^[A-Za-z0-9]+$/,         // alphanumeric
      isIdent: /^\w+$/,                  // valid identifier (word character)
    };
  
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
  
  activate ()
  {
    var self = this;
    $('form').on('submit', function () { self.reset(); return self.validate(); });
  }
  
} // class Validation

