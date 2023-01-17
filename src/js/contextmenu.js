/**
 * A quick Lum library for making Context menus.
 * Replaces the older menu.jq.js, this will override that if used.
 */
Lum.lib(
{
  name: 'contextmenu',
  assign: 'ContextMenu',
},
function()
{
  return require('@lumjs/web-context-menu');
});
