// The original render() method from riot.js v1.
// Modified to be a Lum library only.
// This is extremely limited (but extremely small).
// Check out riot.tmpl (the rendering engine from riot.js v2).

Lum.lib('render/riot1', 
{
  alias: ['render.riot1', 'riot.render'],
  ns:    {ns: 'render', subProp: '_ns'},
}, 
function(Lum, ns)
{
  "use strict";

  const rns = ns._ns('riot');

  var FN = {}, // Precompiled templates (JavaScript functions)
  template_escape = {"\\": "\\\\", "\n": "\\n", "\r": "\\r", "'": "\\'"},
  render_escape = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'};

  function default_escape_fn(str, key) {
    return str == null ? '' : (str+'').replace(/[&\"<>]/g, function(char) {
      return render_escape[char];
    });
  }

  function render(tmpl, data, escape_fn) {
    if (escape_fn === true) escape_fn = default_escape_fn;
    tmpl = tmpl || '';

    return (FN[tmpl] = FN[tmpl] || new Function("_", "e", "return '" +
      tmpl.replace(/[\\\n\r']/g, function(char) {
        return template_escape[char];
      }).replace(/{\s*([\w\.]+)\s*}/g, "' + (e?e(_.$-1,'$1'):_.$1||(_.$1==null?'':_.$1)) + '") + "'")
    )(data, escape_fn);
  }

  ns._add('riot1', render);
  rns._add('render', render);
  
});
