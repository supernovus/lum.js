{ // A module alias.
  globalThis[theTemplate.getConf('global')].define(
    theTemplate.getVar('pkg'),
    theTemplate.getVar('mod'),
    theTemplate.getVar('path'),
  );
}