/**
 * See stackoverflow.com/questions/8584098/ for a bunch of other
 * versions of the same function. I think my version is the most optimized,
 * and offers a few more features than most.
 */

Lum.jq('change_type',
function(Lum, $) 
{
  require('@lumjs/jquery-plugins/plugin/change-type').enable($);
}); //(self.jQuery);
