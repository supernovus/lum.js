Lum.lib('deprecated',
function(Lum)
{
  "use strict";

  /**
   * Mark a function/method/property as deprecated.
   *
   * Adds a warning to the Console that the method is deprecated.
   *
   * It can also optionally give example replacement code, and run a function 
   * that will call the replacement code automatically.
   *
   * @param {string} name  The name of the deprecated method/property/etc.
   *
   *   This should actually be the full method signature, or at least the
   *   signature matching what a call to the deprecated method made.
   *
   *   So rather than 'someOldMethod', use 'MyClass.someOldMethod(foo, bar)'
   *   as a more detailed name. This is only used in the Console warning.
   *
   *   This is the only mandatory parameter.
   *
   * @param {mixed} [replace={}]  Replacement options.
   * 
   *   If this is a {string}, it is the same as passing an {object} with
   *   the following options specified:
   *
   *     ```{msg: replace}```
   *
   *   If it is a {function}, it is the same as passing an {object} with
   *   the following options specified:
   *
   *     ```{exec: replace, msg: true, strip: true}```
   *
   *   If it is an {object}, then it will be a set of options:
   *
   *     "exec" {function}
   *
   *       If specified, this function will be called and the value returned.
   *       No paramters are passed to the function, so it should be a simple 
   *       anonymous closure which simply calls the actual replacement code.
   *
   *     "msg" {string|boolean}
   *
   *       If this is a {string} it will be added to the warning output.
   *
   *       If this is `true` and `exec` is set, we will extract the function
   *       text using `exec.toString()` and add it to the warning output.
   *
   *       In any other cases, no replacement message will be appended.
   *
   *     "strip" {boolean}
   *
   *       If this is `true`, then we will strip `'function() { return '`
   *       from the start of the function text (whitespace ignored), as well
   *       as stripping '}' from the very end of the function text.
   *
   *       This is only applicable if `exec` is set, and `msg` is `true`.
   *
   *   If the `replace` value is none of the above, it will be ignored.
   *
   * @return {mixed}  The output is dependent on the parameters passed.
   *
   * If `replace` is a function or an object with 
   *
   * In any other case the return value will be undefined.
   *
   * @method Lum.deprecated
   */
  Lum.prop(Lum, 'deprecated', function (name, replace={})
  {
    const DEP_MSG = ':Deprecated =>';
    const REP_MSG = ':replaceWith =>';

    if (typeof replace === S)
    { // A string replacement example only.
      replace = {msg: replace};
    }
    else if (typeof replace === F)
    { // A function replacement.
      replace = {exec: replace, msg: true, strip: true};
    }
    else if (!is_obj(replace))
    { // Not an object, that's not valid.
      replace = {};
    }

    const msgs = [DEP_MSG, name];
    const exec = (typeof replace.exec === F) 
      ? replace.exec
      : null;

    if (exec && replace.msg === true)
    { // Extract the function text.
      const strip = (typeof replace.strip === B)
        ? replace.strip
        : false;

      let methtext = replace.exec.toString();

      if (strip)
      { // Remove wrapping anonymous closure function.
        methtext = methtext.replace(/^function\(\)\s*\{\s*(return\s*)?/, '');
        methtext = methtext.replace(/\s*\}$/, '');
        // Also support arrow function version.
        methtext = methtext.replace(/^\(\)\s*\=\>\s*/, '');
      }

      // Set the replacement msg to the method text.
      replace.msg = methtext;
    }

    if (typeof replace.msg === 'string')
    { // A replacement message.
      msgs.push(REP_MSG, replace.msg);
    }

    // Show the messages.
    console.warn(...msgs);

    // Finally, call the replacement function if it was defined.
    if (exec)
    {
      return exec();
    }
  });

});