/*
 * A jQuery plugin that adds an exists() method to selectors, so you can
 * see if an element exists.
 */

"use strict";

import $ from 'ext/jquery';

$.fn.exists = function ()
{
  return this.length !== 0;
};

