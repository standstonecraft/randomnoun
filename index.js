import * as fs from 'fs';
import * as readline from 'readline';

const jpMinLength = 2;
const outDir = './output/';
const jsonFileName = 'words.json';
const csvFileName = 'words.csv';
const listJpFileName = 'listJp.txt';
const listEnFileName = 'listEn.txt';

function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  // Streamを準備
  const stream = fs.createReadStream('./rawdata.txt', {
    encoding: 'utf8', // 文字コード
    highWaterMark: 1024, // 一度に取得するbyte数
  });

  // readlineにStreamを渡す
  const reader = readline.createInterface({ input: stream });

  const loaded = [];
  reader.on('line', data => {
    // *{{l|ja|いも}}、{{l|ja|芋}} – yam, potato, taro (''imo'')
    const regJp = /\{\{l\|ja\|([^}]+)\}\}/g;
    const regEn = /([\w\s]+)(?:, )?/g;
    if (!data || data == '==Nouns==' || data.match(/^===+\w/)) {
      // skip
    } else if (data.match(/^==\w/)) {
      // terminate
      reader.close();
      reader.removeAllListeners();
    } else {
      const [jp, en] = data.split(' – ');
      let m;
      const hitJp = (m = regJp.exec(jp)) ? m[1] : null;
      const hitEn = (m = regEn.exec(en)) ? m[1].trim() : null;
      if (hitJp && hitEn && hitJp.length > jpMinLength) {
        // console.log(`${hitJp}, ${hitEn}`);
        loaded.push({ jp: hitJp, en: hitEn });
      }
    }
  });
  reader.on('close', () => {
    const outData = [...new Map(loaded.reverse().map(l => [l.en, l])).values()];

    const json = JSON.stringify(outData, null, '  ');
    fs.writeFile(outDir + jsonFileName, json, err => {
      if (err) throw err;
      console.log('json export has done.');
    });

    const listJp = outData.map(d => d.jp).join('\r\n');
    fs.writeFile(outDir + listJpFileName, listJp, err => {
      if (err) throw err;
      console.log('listJp export has done.');
    });

    const listEn = outData.map(d => d.en).join('\r\n');
    fs.writeFile(outDir + listEnFileName, listEn, err => {
      if (err) throw err;
      console.log('listEn export has done.');
    });

    const csv = '"jp","en"\r\n' + outData.map(d => `"${d.jp}","${d.en}"`).join('\r\n');
    fs.writeFile(outDir + csvFileName, csv, err => {
      if (err) throw err;
      console.log('csv export has done.');
    });
  });
}

main();
