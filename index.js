const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;

const handleError = (error) => {
  if (error.response) {
    const {
      data: {
        error: { message },
      },
      status,
    } = error.response;

    return `${error.message}: ${message}`;
  }

  return error.message;
};

module.exports.error = (message) => {
  console.error(message);
  process.exit(1);
};

const getRecentMedia = async () => {
  try {
    const accessToken = process.env.IG_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Missing required environment variable "IG_ACCESS_TOKEN."');
    }

    const {
      data: {
        data: recentMedia
      }
    } = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        access_token: accessToken,
        fields: 'media_url,permalink'
      }
    });

    await fsPromises.writeFile(path.join(__dirname, 'media.json'), JSON.stringify(recentMedia));
  } catch (err) {
    module.exports.error(handleError(err));
  }
};

const downloadRecentMedia = async () => {
  const media = await fsPromises.readFile('media.json');

  JSON.parse(media).forEach(async (m) => {
    const fileToSave = await axios({
      url: m.media_url,
      responseType: 'stream',
    });
    const download = fs.createWriteStream(path.join(__dirname, `${m.id}.jpg`));
    await new Promise((resolve, reject)=> {
      fileToSave.data.pipe(download);
      download.on("close", resolve);
      download.on("error", console.error);
    });
  });
};

const writeFile = async (media) => {
  const response = await axios.get(media.media_url);
  await fsPromises.writeFile(`${media.id}.jpg`, response.data);
};

if (process.env.NODE_ENV !== 'test') {
  downloadRecentMedia();
}

module.exports.getRecentMedia = getRecentMedia;
