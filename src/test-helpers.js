const msw = require('msw');
const setupServer = require('msw/node').setupServer;

const inputToken = 'abc123';
module.exports.INPUT_TOKEN = inputToken;

const defaultInputs = {
  access_token: inputToken
};
module.exports.DEFAULT_INPUTS = defaultInputs;

module.exports.setInputs = (inputs) => {
  Object.entries({ ...defaultInputs, ...inputs }).forEach(([key, value]) => {
    process.env[`INPUT_${key.toUpperCase()}`] = value;
  });
};

module.exports.unsetInputs = (inputKeys = []) => {
  [...Object.keys(defaultInputs), ...inputKeys].forEach((keys) => {
    delete process.env[`INPUT_${keys.toUpperCase()}`];
  });
};

module.exports.mockServer = (url, response) => {
  return setupServer(
    msw.rest.get(
      url,
      (req, res, ctx) => {
        const accessToken = req.url.searchParams.get('access_token');

        if (accessToken === inputToken) {
          return res(ctx.json(response));
        }

        return res(
          ctx.status(400),
          ctx.json({
            error: {
              message: 'Invalid OAuth access token',
              type: 'OAuthException',
              code: 190,
            }
          })
        )
      }
    )
  );
};
