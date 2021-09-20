const core = require('@actions/core');
const refreshToken = require('./refresh-token');
const getRecentMedia = require('./get-recent-media');
const handleError = require('./handle-error');

const run = async () => {
  try {
    const accessToken = core.getInput('access_token', { required: true });
    const action = core.getInput('action', { required: true });

    core.info(`Running ${action}.`);

    if (action === 'get_recent_media') {
      await getRecentMedia();
      return;
    }

    if (action === 'refresh_token') {
      await refreshToken();
      return;
    }

    core.setFailed(`${action} is not a supported action.`);
  } catch(error) {
    core.setFailed(handleError(error));
  }
};

if (process.env.NODE_ENV !== 'test') {
  run();
}

module.exports = run;
