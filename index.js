#! /usr/bin/env node
 var program = require('commander');
 var walk = require('directory-traverser');
 var fs = require('fs');

var ip2loc = require("ip2location-nodejs");
ip2loc.IP2Location_init("./resource/IP2LOCATION-LITE-DB11.BIN");
 
var abspath = '';
var fileContent = '';
var jsons = [];
var dataDir = './resource/raw';
var loc = null;
var tmp = '';
var outputFile = './with-location'

var walkRet = walk(dataDir, (path) => !path.match(/\.$/) && !path.match(/\.\.$/), function(dir, filenames) {
  filenames && filenames.forEach(function (filename, fileii) {
    if (filename.match(/^\./)) {
      return;
    }
    abspath = dir + '/' + filename;
    var stat = fs.statSync(abspath);
    if (!stat || !stat.isFile()) {
      return;
    }
    try {
      fileContent = fs.readFileSync(abspath, { encoding: 'utf-8' });
      // console.log(typeof fileContent + ':    fileContent' +  '\n\n\n\n\n', fileContent);
      objects = fileContent && fileContent.split('\n') || [];
      jsons = objects.map((it) => {
        it = it.replace(/^\s+/, '').replace(/\s+$/, '');
        if (!it || !it.length) {
          console.error('invalid line, type: ', typeof it, it);
          return null;
        }
        try {
          tmp = JSON.parse(it);
        } catch (e) {
          console.log('error JSON.parse line: ' + it + '\n\n\n\n\n');
          tmp = null;
        }
        return tmp;
      });
      if (Array.isArray(jsons)) {
        fileContent = '';
        jsons.forEach((item, lineii) => {
          if (item && item.ip && item.ip.match(/\d+\.\d+\.\d+\.\d+/)) {
            loc =  ip2loc.IP2Location_get_all(item.ip);
          } else {
            loc = null;
          }
          if (item) {
            item.country_short = loc && loc.country_short && loc.country_short + '' || '';
            item.country_long = loc && loc.country_long && loc.country_long + '' || '';
            item.region = loc && loc.region && loc.region + '' || '';
            item.city = loc && loc.city && loc.city + '' || '';
            item.latitude = loc && loc.latitude && loc.latitude + '' || '';
            item.longitude = loc && loc.longitude && loc.longitude + '' || '';
            item.zipcode = loc && loc.zipcode && loc.zipcode + '' || '';
            fileContent += JSON.stringify(item) + '\n';
          }
        });
        console.log('writing file, ', abspath);
        fs.writeFileSync(outputFile + fileii + '.log', fileContent);
      }
    } catch (e) {
      console.error('failed to Json.parse whilte parse: ', e, objects);
    }
  });
}, { verbose: true });



//program
//  .option('-r, --root-dir [string]', '发布的根目录')
//  .option('-p, --prefix [string]', '从服务器根目录到发布的根目录（包含）的路径，\
//    以/作为起始字符，如果工作目录在服务器根目录或更上层，\
//    -p = /，如 generate -r ./some/path/to/webroot/then/to/the/published/static/dir -p /')
//  .option('--css-path [string]', '用于模版的css文件链接，如/css/base.css')
//  .option('-V, --verbose', '打印日志')
//  .parse(process.argv);
//
//function generate(root, prefix, htmlTemplate, options) {
//  root = trimTrailingSlash(root);
//  var pref = trimTrailingSlash(prefix);
//  var excludeDir = options && options.excludeDir;
//  var excludeFile = options && options.excludeFile;
//  var verbose = !!(options && options.verbose);
//  var dirFilter = function (path) {
//    var parts = path.split('/');
//    return !excludeDir || !stringMatch(parts[parts.length - 1], excludeDir);
//  };
//
//  return walk(root, dirFilter, function(dir, filenames) {
//    var html = htmlTemplate.replace(/\{title\}/, pref + dir.substr(root.length, dir.length - root.length));
//    var aTags = [];
//    filenames.forEach(function(filename) {
//      if (!excludeFile || (!stringMatch(filename, excludeFile) && !stringMatch(filename, excludeDir))) {
//        var abspath = dir + '/' + filename;
//        var stat = fs.statSync(abspath);
//        var name = stat && stat.isDirectory() ? (filename + '/') : filename;
//        var relpath = pref + abspath.substr(root.length, abspath.length - root.length);
//        aTags.push('<a href="' + relpath + '">' + name + '</a>');
//        aTags.push('<br/>');
//      } else {
//        verbose && console.log('ignoring file: ',filename);
//      }
//    });
//    var fullfilled = html.replace(/\{body\}/, aTags.join(' '));
//    var indexFile = dir + '/index.html';
//
//    if (!save(indexFile, fullfilled)) {
//      console.error('failed to save file to: ', indexFile);
//      return -1;
//    } else {
//      return 0;
//    }
//  }, { verbose: verbose });
//}
//