const axios = require('axios');
const core = require('@actions/core');

refreshIgToken = async () => {
  const result = await axios({
    url: 'https://graph.instagram.com/refresh_access_token',
    params: {
      grant_type: 'ig_refresh_token',
      access_token: process.env.IG_ACCESS_TOKEN
    }
  });

  const token = result.data.access_token;
  core.setSecret(token);

  // test use of the new token & throw error before updating the GHA secret if
  // its use fails.
  await axios({
    url: 'https://graph.instagram.com/v21.0/28395689843380207/media',
    params: {
      access_token: token,
      fields: 'media_url,caption,permalink'
    }
  });

  core.setOutput('ig-access-token', token);
};

(async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    await refreshIgToken();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
