#!/usr/bin/env node
// Custom build script.

const info = require('./package.json');
const rules = require('./src/rules.js');
const Assembler = require('./src/build/assembler.js');

const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
  .option('v', {desc: 'Enable more verbose output', count: true})
  .option('q', {desc: 'Disable all output', boolean: true})
  .help()
  .argv;

let verbose = argv.q ? 0 : (argv.v + 1);

const ass = new Assembler(rules);
ass.compile({verbose});

