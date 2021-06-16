"use strict";

const fetch = require('node-fetch');
const { createWriteStream, existsSync, realpathSync } = require('fs');
const { join, resolve } = require('path');
const { createCanvas, registerFont } = require('canvas');

function nodeFontLoader(fonts, moozCanvasConfigs) {
  const promises = [];
  fonts.forEach(({ family, fontFileUrl }) => {
    const fontFileName = `${family}.ttf`;
    const fontFilePath = resolve(
      join(
        (moozCanvasConfigs === null || moozCanvasConfigs === void 0 ? void 0 : moozCanvasConfigs.baseWritePath)
          ? moozCanvasConfigs === null || moozCanvasConfigs === void 0
            ? void 0
            : moozCanvasConfigs.baseWritePath
          : __dirname,
        `/${fontFileName}`
      )
    );
    console.log(fontFilePath, '66', moozCanvasConfigs === null || moozCanvasConfigs === void 0 ? void 0 : moozCanvasConfigs.baseWritePath);

    const promise = fetch(fontFileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('failed to fetch font');
        }
        return new Promise((resolve, reject) => {
          if (existsSync(fontFilePath)) {
            console.log(`font at path ${fontFilePath} already exists`);
            resolve(null);
          }
          const dest = createWriteStream(fontFilePath, {});
          response.body.pipe(dest);
          response.body.on('end', () => resolve('it worked'));
          dest.on('error', (error) => {
            console.log('FAILED TO WRITE FONTS TO FOLDER');
            reject(error);
          });
        });
      })
      .then(() => canvasRegisterFont(fontFilePath, { family }, 1))
      .catch((error) => {
        console.log(error);
        throw new Error('failed to fetch font ' + family);
      });
    promises.push(promise);
  });
  return Promise.all(promises);
}
function canvasRegisterFont(fontFilePath, { family }, tryNumber = 1) {
  try {
    console.log('REGISTERING FONT.....');
    console.log(realpathSync(fontFilePath));
    registerFont(fontFilePath, { family });
    console.log('REGISTERED FONT.....');
  } catch (error) {
    if (tryNumber < 3) {
      console.log(error);
      console.log(`try number ${tryNumber} for registering the font has failed has failed, trying again....`);
      return canvasRegisterFont(fontFilePath, { family }, tryNumber + 1);
    }
  }
}



function run(font) {
  const testText = 'عبدالعزيز الحربي';
  return nodeFontLoader([font], { baseWritePath: '/temp' }).then(() => {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.font = `30px ${font.family}`;
    ctx.fillText(testText, 250, 250);

    return canvas.toDataURL('image/jpeg', 0.5);
  });
}


module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v2.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};


module.exports.createImage = async (event) => {

  if (!event.body) {
    return buildError(`BAD REQUEST: missing arguments, received arguments ${JSON.stringify(event.body)}`);
  }

  const {font} = JSON.parse(event.body);
  if(!font){
    return buildError('font was not found in body')
  }

  return run(font).then(dataUrl=>{
    return {
      statusCode: 200,
      body: dataUrl
    };
  })


};

function buildError(error) {
  return {
    statusCode: 400,
    body: JSON.stringify({
        error,
      },
      null,
      2
    ),
  };
}


// console.log("hello");
// console.log(module.exports.createImage({body:JSON.stringify({font:{
//   family: 'myriad_arabic_regular',
//   fontFileUrl: 'https://mooz-cms-bucket.s3.me-south-1.amazonaws.com/myriad_arabic_regular_c645fa1a53_839786aed1.ttf',
// }})}));
