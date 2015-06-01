/*
 * A jQuery plugin that adds 'enable()' and 'disable()' methods to
 * elements, which makes dynamic disabling and re-enabling of UI elements
 * much easier.
 */

"use strict";

import $ from 'ext/jquery';

$.fn.enable = function ()
{
  //return this.removeAttr('disabled');
  return this.prop('disabled', false);
};
$.fn.disable = function ()
{
  //return this.attr('disabled','disabled');
  return this.prop('disabled', true);
};

