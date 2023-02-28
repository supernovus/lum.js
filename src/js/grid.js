Lum.lib(
{
  name: 'grid',
},
function(Lum)
{
  "use strict";

  const def = require('@lumjs/core');

  // Assign the Grid class to Lum.Grid
  def(Lum, 'Grid', require('@lumjs/grid'));

  // Assign the DisplayGrid class to Lum.Grid.Display
  def(Lum.Grid, 'Display', require('@lumjs/web-grid'));

  // Everything past here requires jQuery UI to be loaded.
  if ($ === undefined || $.ui === undefined)
  {
    console.log("No jQuery UI, skipping Grid.UI class registration.");
    return;
  }

  Lum.lib.mark('grid.ui');

  // Assign the UIGrid class to Lum.Grid.UI
  prop(Lum.Grid, 'UI', require('@lumjs/jquery-ui-grid'));

});
