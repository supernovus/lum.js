#!/usr/bin/env node
// Custom build script.

const info = require('../package.json');
const rules = require('./rules.js');
const Assembler = require('./build/assembler.js');

const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .option('v', {desc: 'Enable more verbose output', count: true})
  .option('q', {desc: 'Disable all output', boolean: true})
  .option('m', {desc: 'Minify with default settings', boolean: true})
  .option('M', {desc: 'Minify with custom settings', string: true})
  .help()
  .argv;

const verbose = argv.q ? 0 : (argv.v + 1);
let minify = argv.m ? {} : null;
if (argv.M)
{ // Must be the relative path to a settings file, JSON or JS format.
  minify = require(argv.M);
}

const ass = new Assembler(rules);
ass.compile({verbose, minify});

