// The original render() method from riot.js v1.
// Modified to be a Lum library only.
// This is extremely limited (but extremely small).
// Check out riot.tmpl (the rendering engine from riot.js v2).
;(function()
{
  "use strict";

  if (window.Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.markLib('riot.render');
  Lum.markLib('render.riot1');

  Lum.registerNamespace('Lum.render.riot');

  const ns = Lum.render;

  var FN = {}, // Precompiled templates (JavaScript functions)
  template_escape = {"\\": "\\\\", "\n": "\\n", "\r": "\\r", "'": "\\'"},
  render_escape = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'};

  function default_escape_fn(str, key) {
    return str == null ? '' : (str+'').replace(/[&\"<>]/g, function(char) {
      return render_escape[char];
    });
  }

  ns.riot1 = ns.riot.render = function(tmpl, data, escape_fn) {
    if (escape_fn === true) escape_fn = default_escape_fn;
    tmpl = tmpl || '';

    return (FN[tmpl] = FN[tmpl] || new Function("_", "e", "return '" +
      tmpl.replace(/[\\\n\r']/g, function(char) {
        return template_escape[char];
      }).replace(/{\s*([\w\.]+)\s*}/g, "' + (e?e(_.$1,'$1'):_.$1||(_.$1==null?'':_.$1)) + '") + "'")
    )(data, escape_fn);
  }

})();

