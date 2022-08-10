const fs = require('fs');
const path = require('path');

const core = require('@lumjs/core');
const {S,needObj,needType} = core.types;

const {loadFile} = require('./sources');

const E_CONF = 'conf must be an object';
const E_SCOPE = 'scope must be an object';
const E_FILE  = 'file must be a string';

/**
 * A custom template parser.
 *
 * It's pretty basic and doesn't have too many features.
 * The general gist is that the templates are Javascript files,
 * and the template commands look like standard JS method calls, but
 * instead the result of the call is put into the template.
 */
class Template
{
  /**
   * Build a new Template instance.
   */
  constructor(conf, scope={})
  {
    needObj(conf, E_CONF);
    needObj(scope, E_SCOPE);

    needObj(conf.tmpl, 'conf.tmpl must be an object');
    needType(S, conf.tmpl.var, 'conf.tmpl.var must be a string');
    needType(S, conf.tmpl.dir, 'conf.tmpl.dir must be a string');

    this.conf  = conf;
    this.scope = scope;
    this.var = conf.tmpl.var;
    this.dir = conf.tmpl.dir;
  }

  /**
   * The main entry point into the template parser.
   */
  parseFile(file)
  {
    const filename = path.join(this.dir, file);
    const tmpl = loadFile(filename);
    
    const self = this;
    const re = new RegExp(this.var + '\\..*?\\);?', 'g');
    return tmpl.replaceAll(re, function(match)
    {
      //console.debug('parseFile', {file, match, arguments, self});
      const replacer = new Function(self.var, 'return '+match);
      //console.debug('parseFile:replacer', replacer.toString());
      const parsed = replacer(self);
      //console.debug('parseFile:parsed = ', parsed);
      return parsed;
    });
  }

  /**
   * Get a nested template.
   */
  getTemplate(file, scope={}, wantObj=false)
  {
    needObj(scope, E_SCOPE);
    needType(S, file, E_FILE);
    for (const key in this.scope)
    {
      if (scope[key] === undefined)
      { // Template variable not found.
        scope[key] = this.scope[key];
      }
    }
    const tmpl = new Template(this.conf, scope);
    return wantObj ? tmpl : tmpl.parseFile(file);
  }

  getConf(name, raw=false)
  {
    const val = core.obj.getObjectPath(this.conf, name);
    return raw ? val : JSON.stringify(val);
  }

  getVar(name, raw=false)
  {
    const val = core.obj.getObjectPath(this.scope, name);
    return raw ? val : JSON.stringify(val);
  }

  setVar(name, val)
  {
    this.scope[name] = val;
    return this;
  }

}

module.exports = Template;