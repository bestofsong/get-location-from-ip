#! /usr/bin/env node
var program = require('commander');
var walk = require('directory-traverser');
var fs = require('fs');
var parser = require('ua-parser-js');

program
  .option('-d, --dir [string]', '发布的根目录')
  .parse(process.argv);

var PROVINCES = {
  beijing: '北京',
  tianjin: '天津',
  shanghai: '上海',
  chongqing: '重庆',
  hebei: '河北',
  henan: '河南',
  yunnan: '云南',
  liaoning: '辽宁',
  heilongjiang: '黑龙江',
  hunan: '湖南',
  anhui: '安徽',
  shandong: '山东',
  xinjiang: '新疆',
  jiangsu: '江苏',
  zhejiang: '浙江',
  jiangxi: '江西',
  hubei: '湖北',
  guangxi: '广西',
  gansu: '甘肃',
  shanxi: '山西',
  'nei mongol': '内蒙古',
  shaanxi: '陕西',
  jilin: '吉林',
  fujian: '福建',
  guizhou: '贵州',
  guangdong: '广东',
  qinghai: '青海',
  xizang: '西藏',
  sichuan: '四川',
  ningxia: '宁夏',
  hainan: '海南',
  taiwan: '台湾',
  'hong kong (sar)': '香港',
  macau: '澳门',
};

var dir = program.dir;
var perProvince = {};
var abspath;
var stat;
var fileContent;
var lines;
var tmp;
var sample;
var occurance;

var walkRet = walk(dir, (path) => !path.match(/\.$/) && !path.match(/\.\.$/), function(dir, filenames) {
  filenames && filenames.forEach(function (filename, fileii) {
    if (filename.match(/^\./)) {
      return;
    }
    abspath = dir + '/' + filename;
    stat = fs.statSync(abspath);
    if (!stat || !stat.isFile()) {
      return;
    }
    try {
      fileContent = fs.readFileSync(abspath, { encoding: 'utf-8' });
      lines = fileContent && fileContent.split('\n') || [];
      lines.forEach((it) => {
        it = it.replace(/^\s+/, '').replace(/\s+$/, '');
        if (!it || !it.length) {
          console.error('invalid line, type: ', typeof it, it);
          return;
        }
        try {
          tmp = JSON.parse(it);
          sample = extractFromItem(tmp);
          if (sample && sample.province) {
            occurance = perProvince[sample.province] || {}; perProvince[sample.province] = occurance;
            sample.inc.forEach((criteria) => {
              occurance[criteria] = 1 + (occurance[criteria] || 0);
            });
          }
        } catch (e) {
          console.log('error JSON.parse line: ' + it + '\n\n\n\n\n');
        }
      });
    } catch(e) {
      console.error('failed to read file: ', abspath);
    }
  });
}, { verbose: true });

console.log(perProvince);

function isValidField(field) {
  return (
    field !== null &&
    field !== undefined && 
    (typeof field !== 'string' || !field.match(/^\s*-\s*$/) && !field.match(/^\s*\?\s*$/))
  );
}

function extractFromItem(item) {
  if (!item || !isValidField(item.region)) {
    return null;
  }
  var regionLow = item.region.toLowerCase();
  var province = PROVINCES[regionLow];
  if (!province) {
    if (item.region) {
      console.log('no matched province for region: ', regionLow);
    }
    return null;
  }

  var inc = ['count'];
  var ua = item.userAgent; 
  if (ua && isValidField(ua)) {
    var uaObj = parser(ua);

    var os = uaObj && uaObj.os && uaObj.os.name;
    if (os && os.match(/ios/i)) {
      inc.push('iOS');
    } else if (os && os.match(/android/i)) {
      inc.push('Android');
    } else {
      inc.push('PC');
    }

    // var browser = uaObj && uaObj.browser && uaObj.browser.name;
    // if (browser && browser.match(/safari/i)) {
    //   inc.push('Safari');
    // } else if (browser && browser.match(/Chromium/i) || browser && browser.match(/chrome/i)) {
    //   inc.push('Chrome');// Firefox
    // } else if (browser && browser.match(/firefox/i)) {
    //   inc.push('Firefox');
    // } else {
    //   inc.push('Browser');
    // }
  }

  return {
    province,
    inc,
  };
}
