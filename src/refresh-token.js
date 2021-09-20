const core = require('@actions/core');
const axios = require('axios');
const handleError = require('./handle-error');

const refreshToken = async () => {
  try {
    const accessToken = core.getInput('access_token', { required: true });

    core.info('Requesting new access token.');

    const {
      data: { access_token: refreshedAccessToken },
    } = await axios.get('https://graph.instagram.com/refresh_access_token', {
      params: {
        access_token: accessToken,
        grant_type: 'ig_refresh_token',
      },
    });

    core.info('New access token received.');
    core.setSecret(refreshedAccessToken);
    core.setOutput('access_token', refreshedAccessToken);
  } catch (error) {
    core.setFailed(handleError(error));
  }
};

if (process.env.NODE_ENV !== 'test') {
  refreshToken();
}

module.exports = refreshToken;
