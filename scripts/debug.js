/**
 * Debugging Helpers.
 *
 * Requires: jquery, JSON, json.jq, exists.jq and format_json.
 */

"use strict";

if (window.Nano === undefined)
{
  window.Nano = {};
}

Nano.debug = {};

Nano.debug.log = function ()
{
  for (var a in arguments)
  {
    var arg = arguments[a];
    if (typeof arg == "string")
    {
      console.log(arg);
    }
    else
    {
      console.log(format_json(JSON.stringify(arg)));
    }
  }
}

Nano.debug.field = function (obj, toel)
{
  if (toel === undefined)
  {
    toel = '#debug';
  }
  var el = $(toel);
  if (el.exists())
  {
    el.JSON(obj).formatJSON();
  }
}

Nano.debug.element = function (fromel, toel)
{
  if (toel === undefined)
  {
    toel = '#debug';
  }
  var to   = $(toel);
  var from = $(fromel);
  if (to.exists() && from.exists())
  {
    to.val(from.val()).formatJSON();
  }
}

/**
 * Debugging buttons made easy.
 *
 * If the source is a closure, it's expected to return a Javascript
 * object, which will be processed using the debug.field() method.
 *
 * If the source is a string, it's the name of a source element to use
 * with the debug.element() method.
 *
 * If the source is undefined, we assume an element with an id
 * of the fieldname.
 */
Nano.debug.button = function (fieldname, source, prefix, target)
{
  if (prefix === undefined)
  {
    prefix = '#debug_';
  }

  var elname = prefix + fieldname;
  var handler;
  var stype = typeof source;
  if (stype == "function")
  {
    handler = function ()
    {
      Nano.debug.field(source(), target);
    };
  }
  else
  {
    if (stype == "undefined")
    {
      source = '#' + fieldname;
    }
    else if (stype != "string")
    {
      console.log("invalid source");
      return;
    }
    handler = function ()
    {
      Nano.debug.element(source, target);
    }
  }
  $(elname).on('click', handler);
}

