const axios = require('axios');
const core = require('@actions/core');
const fs = require('fs');
const fsPromises = fs.promises;

const handleAxiosError = (error) => {
  if (error.response) {
    const {
      data: {
        error: { message },
      },
      status,
    } = error.response;

    return `${status} ${message}`;
  }

  if (error.request) {
    return 'No response received';
  }

  return error.message;
};

async function getRecentMedia() {
  //await fsPromises.writeFile('media.json', JSON.stringify(result.data.data));

  try {
    const accessToken = core.getInput('access_token', { required: true });

    core.info('Fetching recent media.');

    const {
      data: recentMedia,
    } = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        access_token: accessToken,
        fields: [
          'media_url',
          'permalink'
        ]
      }
    });

    core.info('Successfully fetched recent media.');

    core.setOutput('recent_media', recentMedia);
  } catch (error) {
    core.setFailed(handleAxiosError(error));
  }
};

if (process.env.NODE_ENV !== 'test') {
  getRecentMedia();
}

module.exports = getRecentMedia;
