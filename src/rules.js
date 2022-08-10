// Build rules.
module.exports =
{
  global: '$$LUM_V5$$',   // Global variable for the loader environment.
  tmpl:
  {
    'var': 'theTemplate', // Variable name for Template instances.
    'dir': './src/tmpl',  // Folder for our templates.
  },
  scripts:
  {
    source: './src/js',       // Folder for our scripts source files.
    output: './scripts/nano', // Folder for our compiled scripts.
    prepend:                  // Items to prepend to every script.
    [
      {file: './node_modules/@ungap/global-this/index.js'},
    ],

    // The rest of the entries in here are individual script files.

    'core.js':
    { // The core.js will include the bootstrap, and all core libraries.
      prepend: 
      [
        {tmpl: 'boot.js'},
      ],
      deps: 
      { // List each top-level package.
        'path':
        { // We're using `path-browserify` to replace `path` calls.
          use: 'path-browserify',
          package: true
        },
        '@lumjs/core':
        {
          package: true,
          anon: 
          [
            './lib/objectid.js',
            './lib/lazy.js',
            './lib/obj/clone.js',
            './lib/obj/copyall.js',
            './lib/obj/copyprops.js',
            './lib/obj/getproperty.js',
            './lib/obj/lock.js',
            './lib/obj/merge.js',
            './lib/obj/ns.js',
            './lib/types/basics.js',
            './lib/types/def.js',
            './lib/types/isa.js',
            './lib/types/js.js',
            './lib/types/needs.js',
            './lib/types/root.js',
            './lib/types/stringify.js',
            './lib/types/typelist.js',
          ],
        },
        '@lumjs/compat':
        {
          package: false,
          exports:
          {
            './v4-meta': './lib/v4-meta.js',
          },
          anon:
          [
            './lib/descriptors.js',
            './lib/prop.js',
          ],
        },
        '@lumjs/wrapper':
        {
          package: true,
        },
        '@lumjs/simple-loader':
        {
          package: true,
        },
        '@lumjs/global-object':
        {
          root: './src/pkg',
          package: false,
          exports: {'.':'./index.js'},
          anon:
          [
            './jq.js',
            './lib.js',
            './loadtracker.js',
            './ns.js',
            './opt.js',
            './self.js',
            './utils.js',
            './wrapper.js',
          ],
        },
      },
    }, // core.js

    // TODO: the rest of the scripts here.

  }, // scripts
}; // module.exports
