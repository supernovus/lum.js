#!/usr/bin/node

/**
 * This will be loaded in the Gruntfile.js, and registered as 'download'.
 */
  var sources = require('./conf/sources.json');
  
  var exec = require('child_process').exec;
  var UglifyJS = require('uglify-js');
  var http = require('http-request');
  var fs = require('fs');
  var path = require('path');
  
  var scriptroot = 'scripts/';
  var deproot = scriptroot+'ext/';
  
  function mkdir (path)
  {
    try
    {
      fs.mkdirSync(path);
    }
    catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }
 
  function download_deps ()
  { 
    mkdir(scriptroot);
    mkdir(deproot);
    
    // TODO: actually care about the versions.
    //
    // The 'version' property can be in three forms:
    //  1. A string. In which case it's considered the version.
    //  2. An object with a 'json' property. 
    //     This should be a URL to a package.json file containing a 'version'.
    //  3. An object with 'regex' and 'match' properties.
    //     The regex searches through the source file, and the match will be
    //     the version if found.
    //
    // We'll record the versions in conf/current.json which will be in the
    // .gitignore file.
    
    function make_handler (source, dest)
    {
      return function (err, res)
      {
        console.log("Downloaded "+dest);
        if (err)
        {
          console.log(err);
          return;
        }
        var file = fs.createWriteStream(dest);
        if (source.uglify)
        {
          var string = res.buffer.toString();
    //      console.log('string>>>'+string);
          var output = UglifyJS.minify(string, {fromString:true});
          if (output && output.code)
          {
//            console.log('minified>>>'+output.code);
            console.log(" writing minified file.");
            file.write(output.code);
          }
        }
        else
        {
          console.log(" writing downloaded file.");
          file.write(res.buffer);
        }
        file.close();
      }
    }
    
    for (var sfile in sources)
    {
      var source = sources[sfile];
      var dest = deproot+sfile;
      console.log("Checking for "+dest);
      var exists = false;
      try
      {
        var stat = fs.lstatSync(dest);
        exists = stat.isFile();
      }
      catch (e) {}
      if (!exists)
      {
        console.log(" --> Downloading "+source.url);
        //http.get(source.url, make_handler(source, dest));
        http.get(
        {
          url: source.url,
/*          progress: function (current, total)
          {
            console.log('downloaded %d bytes from %d', current, total);
          }
*/
        }, make_handler(source, dest));
      }
    }
  } // function download_deps()

download_deps();

