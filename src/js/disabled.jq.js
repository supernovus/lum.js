/*
 * A jQuery plugin that adds 'enable()' and 'disable()' methods to
 * elements, which makes dynamic disabling and re-enabling of UI elements
 * much easier.
 */

Lum.jq('disabled',
function(Lum, $) 
{
  require('@lumjs/jquery-plugins/plugin/disabled').enable($);
});

