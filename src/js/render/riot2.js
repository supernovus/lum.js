
Lum.lib(
{
  name: ['render/riot2', 'render.riot2', 'riot.tmpl'],
  ns:    {ns: 'render', subProp: '_ns'},
}, 
function (Lum, ns) 
{ 
  const rns = ns._ns('riot');
  const {tmpl,brackets} = require('riot-tmpl');

  ns._add('riot2', tmpl);
  rns._add('tmpl', tmpl);
  rns._add('brackets', brackets);
}); // eslint-disable-line

