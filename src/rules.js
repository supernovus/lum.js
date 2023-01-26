// This is the main configuration file for the custom build system.

// First we'll import a few helper functions.
const 
{ 
  npm, lum, jqplugin, v4compat,
  globalPackageInfo, cryptoJS,
} = require('./build/rule-fun');

// @lumjs modules bundled in the core script.
// This list is simply for the global-object metadata.
const bundled = 
[
  'core', 'compat', 'wrapper', 'simple-loader',
  'jquery-plugins', 'dom',
];

// Now we define the rules themselves.
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

            './lib/obj/clone.js',
            './lib/obj/copyall.js',
            './lib/obj/copyprops.js',
            './lib/obj/getproperty.js',
            './lib/obj/lock.js',
            './lib/obj/merge.js',
            './lib/obj/ns.js',

            './lib/types/basics.js',
            './lib/types/console.js',
            './lib/types/def.js',
            './lib/types/dt.js',
            './lib/types/isa.js',
            './lib/types/js.js',
            './lib/types/lazy.js',
            './lib/types/needs.js',
            './lib/types/root.js',
            './lib/types/stringify.js',
            './lib/types/typelist.js',
          ],
        },
        '@lumjs/compat':
        { // Bits of the compat library used by the global object.
          exports:
          {
            './v4': './lib/v4/index.js',
            './v4-meta': './lib/v4/index.js',
            './v4/meta': './lib/v4/index.js',
            './v4/loadtracker': './lib/v4/loadtracker.js',
            './v4/descriptors': './lib/v4/descriptors.js',
            './v4/prop': './lib/v4/prop.js',
          },
        },
        '@lumjs/wrapper':
        {
          package: true,
        },
        '@lumjs/simple-loader':
        {
          package: true,
        },
        '@lumjs/jquery-plugins':
        { // Just the core bits of this, individual plugins not included.
          exports:
          {
            '.': './lib/index.js',
            './util': './lib/util.js',
            './plugin': './lib/plugin/index.js',
          },
          anon:
          [
            './lib/jqerror.js',
          ],
        },
        '@lumjs/dom':
        {
          package: true,
        },
        '@lumjs/global-object':
        { // An internal package, not found in npm.
          root: './src/pkg',
          package: {info: globalPackageInfo(bundled)},
          exports: {'.':'./index.js'},
          anon:
          [
            './jq.js',
            './lib.js',
            './ns.js',
            './opt.js',
            './self.js',
            './utils.js',
            './wrapper.js',
          ],
        },
        'jquery':
        { // Will be provided by bower
          external: {ns: 'jQuery'},
        },
      },
    }, // core.js

    'arrayutils.js': {},
    'change_type.jq.js': jqplugin('change-type'),
    //'contextmenu.js': lum('web-context-menu'),
    'css.js': lum('web-css'),
    'debug.js': lum('web-debug').lum('debug'),
    'deprecated.js': v4compat('deprecated'),
    'disabled.jq.js': jqplugin('disabled'),
    'editor.js': {},
    //'elementeditor.js': lum('web-element-editor'),
    'encode.js': lum('encode', 
    { // @lumjs/encode dep info
      anon:
      [
        './lib/safe64/common.js',
        './lib/safe64/settings.js',
      ],
    },
    { // The rest of the CryptoJS dependencies
      deps: cryptoJS(
        { // First the regular list of dependencies.
          '@shelacek/ubjson':
          {
            package: true,
          },
          'php-serialize':
          {
            exports: {'.': './lib/cjs/index.js'},
            anon:
            [
              './lib/cjs/helpers.js',
              './lib/cjs/isSerialized.js',
              './lib/cjs/parser.js',
              './lib/cjs/serialize.js',
              './lib/cjs/unserialize.js',
            ],
          },
        },
        { // Now the list of crytoJS modules. Load them externally.
          // The only ones we use explicitly are marked with //*
          'aes': '.AES',
          'cipher-core': '',
          'core': '', //*
          'crypto-js': '',
          'enc-base64': '.enc.Base64', //*
          'enc-latin1': '.enc.Latin1',
          'enc-hex': '.enc.Hex',
          'enc-utf8': '.enc.Utf8', //*
          'enc-utf16': '.enc.Utf16',
          'evpkdf': '.EvpKDF',
          'format-hex': '.format.Hex',
          'format-openssl': '.format.OpenSSL',
          'hmac': '',
          'hmac-md5': '.HmacMD5',
          'hmac-ripemd160': '.HmacRIPEMD160',
          'hmac-sha1': '.HmacSHA1',
          'hmac-sha224': '.HmacSHA224',
          'hmac-sha256': '.HmacSHA256',
          'hmac-sha384': '.HmacSHA384',
          'hmac-sha3': '.HmacSHA3',
          'hmac-sha512': '.HmacSHA512',
          'index': '',
          'lib-typedarrays': '.lib.WordArray',
          'md5': '.MD5',
          'mode-cfb': '.mode.CFB',
          'mode-ctr-gladman': '.mode.CTRGladman',
          'mode-ctr': '.mode.CTR',
          'mode-ecb': '.mode.ECB',
          'mode-ofb': '.mode.OFB',
          'pad-ansix923': '.pad.Ansix923',
          'pad-iso10126': '.pad.Iso10126',
          'pad-iso97971': '.pad.Iso97971',
          'pad-nopadding': '.pad.NoPadding',
          'pad-pkcs7': '.pad.Pkcs7',
          'pad-zeropadding': '.pad.ZeroPadding',
          'pbkdf2': '.PBKDF2',
          'rabbit': '.Rabbit',
          'rabbit-legacy': '.RabbitLegacy',
          'rc4': '.RC4',
          'ripemd160': '.RIPEMD160',
          'sha1': '.SHA1',
          'sha224': '.SHA224',
          'sha256': '.SHA256', //*
          'sha384': '.SHA384',
          'sha3': '.SHA3',
          'sha512': '.SHA512',
          'tripledes': '.TripleDES',
          'x64-core': '',
        }),
    }),
    'exists.jq.js': jqplugin('exists'),
    //'expression.js': lum('expressions'),
    //'format_json.js': lum('format-json'),
    //'format_xml.js': lum('format-xml'),
    /*
    'grid.js':
    {
      deps:
      {
        '@lumjs/grid': {package: true},
        '@lumjs/web-grid': {package: true},
        '@lumjs/jquery-ui-grid': {package: true},
      }
    },
    */
    'hash.js': lum('web-url-hash'),
    'helpers.js': v4compat('object-helpers'),
    'helpers/extend.js': {},
    'json.jq.js': jqplugin('json-elements'),
    //'listing.js': lum('web-listing'),
    'load.js': {},
    //'modal.js': lum('web-modal'),
    //'modelapi.js': lum('model-base'),
    'modelapi/ws_model.js': {},
    'momental.js': {},
    //'notifications.js': lum('web-notifications'),
    'observable.js': {},
    'oquery.js': lum('oquery'),
    //'pager.js': lum('web-pager'),
    'promise.js': v4compat('promise'),
    'render/riot1.js': {},
    'render/riot2.js': npm('riot-tmpl'),
    'selectboxes.jq.js': jqplugin('select-boxes'),
    //'service_worker': lum('service-worker'),
    //'tabpanes.js': lum('web-tabs'),
    //'tax.js': lum('tax'),
    //'userdata.js': lum('web-user-data'),
    'uuid.js': npm('math.uuid'),
    //'validation.js': lum('web-input-validation'),
    //'viewcontroller.js': lum('web-view-controller'),
    //'webservice.js': lum('webservice'),
    'whenready.js': lum('when-events', 
    {
      package: false,
      exports: {'./ready':'./lib/ready.js'},
    }),
    'whenreceived.js': lum('when-events', 
    {
      package: false, 
      exports: {'./received':'./lib/received.js'},
    }),
    'xmlns.jq.js': {},
    'test.js': {}, // A script specific to the index.html in this repo.
  }, // scripts
}; // module.exports
