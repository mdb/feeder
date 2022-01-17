const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

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

    await fsPromises.writeFile('media.json', JSON.stringify(recentMedia));
  } catch (error) {
    throw error;
  }
};

const saveRecentMedia = async () => {
  try {
    const media = await fsPromises.readFile('media.json');

    await Promise.all(JSON.parse(media).map(async (m) => {
      return downloadFile(m.media_url, m.id);
    }));
  } catch(error) {
    throw error;
  }
};

const downloadFile = async (url, id) => {
  try {
    const mediaFile = await axios({
      url: url,
      responseType: 'stream'
    });

    await pipeline(mediaFile.data, fs.createWriteStream(path.join(__dirname, `${id}.jpg`)));
  } catch(error) {
    throw error;
  }
};

(async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    await getRecentMedia();
    await saveRecentMedia();
  } catch(error) {
    console.error(message);
    process.exit(1);
  }
})();

module.exports.getRecentMedia = getRecentMedia;
module.exports.saveRecentMedia = saveRecentMedia;
