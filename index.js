const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fsPromises = fs.promises;
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const MEDIA_FILE = 'instagram-media.json';

const fetchAllMediaPages = async (nextUrl, nextParams, nextPageIndex) => {
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

  const page = nextPageIndex || 0;
  const result = await axios.get(url, params);
  const data = result.data;

  await Promise.all(data.data.map(async (m, i) => {
    data.data[i].github_media_url = `https://mdb.github.io/feeder/feeds/${m.id}.jpg`;

    return downloadFile(m.media_url, m.id);
  }));

  const fileName = `instagram-media-${page}.json`;
  if (data.paging.next) {
    data.paging.next_gh_url = `https://mdb.github.io/feeder/feeds/instagram-media-${page + 1}.json`;
  }

  await fsPromises.writeFile(fileName, JSON.stringify(data));

  if (data.paging.next) {
    await fetchAllMediaPages(result.data.paging.next, {}, page + 1)
  }
};

const saveRecentMedia = async () => {
  const media = await fsPromises.readFile(MEDIA_FILE);

  await Promise.all(JSON.parse(media).data.map(async (m) => {
    return downloadFile(m.media_url, m.id);
  }));
};

const addGitHubUrlsToMediaJson = async () => {
  const media = await fsPromises.readFile(MEDIA_FILE);
  const newMedia = JSON.parse(media).data.map(m => {
    // the IG API formats JSON properties in snake case
    m.github_media_url = `https://mdb.github.io/feeder/feeds/${m.id}.jpg`;

    return m;
  });

  await fsPromises.writeFile(MEDIA_FILE, JSON.stringify({
    data: newMedia,
    paging: media.paging
  }));
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
    await fetchAllMediaPages();
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();

module.exports.fetchAllMediaPages = fetchAllMediaPages;
module.exports.saveRecentMedia = saveRecentMedia;
module.exports.addGitHubUrlsToMediaJson = addGitHubUrlsToMediaJson;
module.exports.MEDIA_FILE = MEDIA_FILE;
