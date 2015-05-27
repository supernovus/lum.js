/**
 * Debugging Helpers.
 *
 * Requires: jquery, JSON, json.jq, exists.jq and format_json.
 */

"use strict";

import $ from 'ext/jquery';
import 'nano/json.jq';
import 'nano/exists.jq';
import 'nano/format_json';

export function debug_field (obj, toel)
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

export function debug_element (fromel, toel)
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
 * object, which will be processed using the debug_field() function.
 *
 * If the source is a string, it's the name of a source element to use
 * with the debug_element() function.
 *
 * If the source is undefined, we assume an element with an id
 * of the fieldname.
 */
export function debug_button (fieldname, source, prefix, target)
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
      debug_field(source(), target);
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
      console.error("invalid source");
      return;
    }
    handler = function ()
    {
      debug_element(source, target);
    }
  }
  $(elname).on('click', handler);
}


