const core = require('@actions/core');
const axios = require('axios');

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

const run = async () => {
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
    core.setFailed(handleAxiosError(error));
  }
};

if (process.env.NODE_ENV !== 'test') {
  run();
}

module.exports = run;
