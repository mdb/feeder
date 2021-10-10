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

const saveRecentMedia = async () => {
  const media = await fsPromises.readFile('media.json');
  const recentMediaJson = JSON.parse(media).map(async (m) => {
    const mediaFile = await axios({
      url: m.media_url,
      responseType: 'stream'
    });
    const download = fs.createWriteStream(path.join(__dirname, `${m.id}.jpg`));

    await mediaFile.data.pipe(download);
  });
};

(async () => {
  if (process.env.NODE_ENV !== 'test') {
    await getRecentMedia();
    await saveRecentMedia();
  }
})();

module.exports.getRecentMedia = getRecentMedia;
