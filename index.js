const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const MEDIA_FILE = 'instagram-media.json';

const fetchAllMedia = async (nextUrl, nextParams) => {
  const accessToken = process.env.IG_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Missing required environment variable "IG_ACCESS_TOKEN."');
  }

  const url = nextUrl || 'https://graph.instagram.com/me/media';

  const params = {
    params: nextParams || {
      access_token: accessToken,
      fields: 'media_url,permalink'
    }
  };

  const result = await axios.get(url, params);
  const data = result.data.data;

  if (result.data.paging.next) {
    return data.concat(await fetchAllMedia(result.data.paging.next, {}));
  }

  return data;
};

const getRecentMedia = async (nextUrl) => {
  const media = await fetchAllMedia();

  await fsPromises.writeFile(MEDIA_FILE, JSON.stringify(media));
};

const saveRecentMedia = async () => {
  const media = await fsPromises.readFile(MEDIA_FILE);

  await Promise.all(JSON.parse(media).map(async (m) => {
    return downloadFile(m.media_url, m.id);
  }));
};

const addGitHubUrlsToMediaJson = async () => {
  const media = await fsPromises.readFile(MEDIA_FILE);
  const newMedia = JSON.parse(media).map(m => {
    // the IG API formats JSON properties in snake case
    m.github_media_url = `https://mdb.github.io/feeder/feeds/${m.id}.jpg`;

    return m;
  });

  await fsPromises.writeFile(MEDIA_FILE, JSON.stringify(newMedia));
};

const downloadFile = async (url, id) => {
  const mediaFile = await axios({
    url: url,
    responseType: 'stream'
  });

  await pipeline(mediaFile.data, fs.createWriteStream(path.join(__dirname, `${id}.jpg`)));
};

(async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    await getRecentMedia();
    await saveRecentMedia();
    await addGitHubUrlsToMediaJson();
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();

module.exports.getRecentMedia = getRecentMedia;
module.exports.saveRecentMedia = saveRecentMedia;
module.exports.addGitHubUrlsToMediaJson = addGitHubUrlsToMediaJson;
module.exports.MEDIA_FILE = MEDIA_FILE;
