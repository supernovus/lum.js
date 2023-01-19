/**
 * A module defining a Lum v4-style global object.
 * 
 * Despite the name, this module doesn't export the global object ourself.
 * Instead, you'll have to do that in whatever loads this. Honestly it's being
 * written specifically for a new `v5` release of my old `Lum.js` collection
 * of libraries. Any use outside of that is entirely unsupported.
 * 
 * @module @lumjs/global-object
 */

const {Lum} = require('./self');
const core = require('@lumjs/core');
const def = core.def;

const add = def(Lum, true);

// First off the def() and prop() methods.
add('def', def);
add('prop', require('@lumjs/compat/v4/meta').prop);

// A bunch of stuff from the core.
const fromCore = 
[
  'obj', 'context', 'AbstractClass', 'Functions', 'stacktrace', 'observable',
];
for (const coreMod of fromCore)
{
  add(coreMod, core[coreMod]);
}

// The rest of core because we can.
add('core', core);

// Now all the main modules.
add('LoadTracker', require('@lumjs/compat/v4/loadtracker'));
add('opt', require('./opt'));
add('ns', {value: require('./ns')});
add('lib', require('./lib'));
add('jq', require('./jq'));
add('_', {value: require('./utils')});

// Next the simple loader.
add('load', require('@lumjs/simple-loader/default'));

// Finally, the Wrapper stuff after the rest of the modules are loaded.
const wrap = require('./wrapper');
add('Wrapper',     wrap.Wrapper);
add('getWrapper',  wrap.getWrapper);
add('initWrapper', wrap.initWrapper);

// Now export the object.
module.exports = Lum;
