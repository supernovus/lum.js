/**
 * A simple JS and CSS loader that doesn't use jQuery, RequireJS, or yepnope.
 */
(function (Lum)
{
  "use strict";

  if (Lum === undefined)
  {
    throw new Error("Missing Lum core");
  }

  Lum.markLib('load');

  Lum.load = function (options)
  {
    if (typeof options !== 'object')
    {
      throw new Error("Lum.load() had no options passed");
    }
    
    let defloc = ('loc' in options) ? options.loc : null;

    if (typeof options.js === 'object' && options.js !== null)
    { // Some JS files to load.
      for (let o in options.js)
      {
        let js = options.js[o];
        let url = undefined;
        let func = undefined;
        let loc = defloc;
        if (typeof js === 'string')
        { // A string is assumed to be just a URL.
          url = js;
        }
        else if (typeof js === 'object')
        { // This can take two forms.
          if (typeof js[0] === 'string')
          { // Array style definition.
            url = js[0];

            if (typeof js[1] === 'function')
            {
              func = js[1];
            }
            if (typeof js[2] === 'object')
            {
              loc = js[2];
            }
          }
          else if (typeof js.url === 'string')
          { // Object style definition.
            url = js.url;

            if (typeof js.func === 'function')
            {
              func = js.func;
            }
            if (typeof js.loc === 'object')
            {
              loc = js.loc;
            }
          }
        }
        if (url === undefined)
        {
          throw new Error("Could not find a URL in the js definition", js);
        }
        Lum.load.js(url, func, loc);
      } // for options.js
    } // if options.js

    if (typeof options.css === 'object' && options.css !== null)
    { // Some CSS files to load.
      for (let o in options.css)
      {
        let css = options.css[o];
        let url = undefined;
        let loc = defloc;
        if (typeof css === 'string')
        { // A string is assumed to be just a URL.
          url = css;
        }
        else if (typeof css === 'object')
        { // This can take two forms.
          if (typeof css[0] === 'string')
          { // Array style definition.
            url = css[0];

            if (typeof css[1] === 'object')
            {
              loc = css[1];
            }
          }
          else if (typeof css.url === 'string')
          { // Object style definition.
            url = css.url;

            if (typeof css.loc === 'object')
            {
              loc = css.loc;
            }
          }
        }
        if (url === undefined)
        {
          throw new Error("Could not find a URL in the css definition", css);
        }
        Lum.load.css(url, loc);
      } // for options.css
    } // if options.css

  }

  Lum.load.js = function (url, func, loc=null)
  {
    if (Lum.context.isBrowser)
    {
      loc = loc || document.head;
      var script = document.createElement('script');
      script.src = url;
      if (typeof func === 'function')
      {
        script.onload = func;
        script.onreadystatechange = func;
      }
      loc.appendChild(script);
    }
    else if (Lum.context.isWorker)
    {
      self.importScripts(url);
      func();
    }
  }

  Lum.load.css = function (url, loc=null)
  {
    if (Lum.context.isBrowser)
    {
      loc = loc || document.head;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      loc.appendChild(link);
    }
  }

})(self.Lum);