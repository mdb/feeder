const core = require('@actions/core');
const msw = require('msw');
const setupServer = require('msw/node').setupServer;
const getRecentMedia = require('./get-recent-media');

const inputToken = 'abc123';

const DEFAULT_INPUTS = {
  access_token: inputToken,
};

const setInputs = (inputs) => {
  Object.entries({ ...DEFAULT_INPUTS, ...inputs }).forEach(([key, value]) => {
    process.env[`INPUT_${key.toUpperCase()}`] = value;
  });
};

const unsetInputs = (inputKeys = []) => {
  [...Object.keys(DEFAULT_INPUTS), ...inputKeys].forEach((keys) => {
    delete process.env[`INPUT_${keys.toUpperCase()}`];
  });
};

const recentMediaJson = [{
  media_url: 'http://media_url',
  permalink: 'http://permalink'
}];

const server = setupServer(
  msw.rest.get(
    'https://graph.instagram.com/me/media',
    (req, res, ctx) => {
      const accessToken = req.url.searchParams.get('access_token');

      if (accessToken === inputToken) {
        return res(ctx.json(recentMediaJson));
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

describe('getRecentMedia', () => {
  beforeAll(() => {
    server.listen();

    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'setOutput').mockImplementation(jest.fn());
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn());
  });

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();

    setInputs();
  });

  afterEach(() => {
    server.resetHandlers();

    unsetInputs();
  });

  afterAll(() => server.close());

  it('runs', async () => {
    await expect(getRecentMedia()).resolves.not.toThrow();
  });

  describe('when a valid access token is provided', () => {
    beforeEach(async () => {
      await getRecentMedia();
    });

    it('logs info', async () => {
      expect(core.info).toHaveBeenCalledWith('Fetching recent media.');
      expect(core.info).toHaveBeenCalledWith('Successfully fetched recent media.');
    });

    it('sets the new `recent_media` as output', () => {
      expect(core.setOutput).toHaveBeenCalledWith('recent_media', recentMediaJson);
    });
  });

  describe('when no `access_token` input is provided', () => {
    beforeEach(async () => {
      unsetInputs();
      await getRecentMedia();
    });

    it('fails with an informative message', () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        'Input required and not supplied: access_token',
      );
    });

    it('does not log info about fetching recent media', () => {
      expect(core.info).not.toHaveBeenCalledWith('Fetching recent media.');
      expect(core.info).not.toHaveBeenCalledWith('Successfully fetched recent media.');
    });

    it('does not set output', () => {
      expect(core.setOutput).not.toHaveBeenCalled();
    });
  });

  describe('when an invalid `access_token` input is provided', () => {
    beforeEach(async () => {
      unsetInputs();
      setInputs({ access_token: 'bad-token' });
      await getRecentMedia();
    });

    it('logs info', async () => {
      expect(core.info).toHaveBeenCalledWith('Fetching recent media.');
    });

    it('fails with an error from the upstream Instagram API', async () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        '400 Invalid OAuth access token',
      );
    });

    it('does not log info that recent media has been fetched', async () => {
      expect(core.info).not.toHaveBeenCalledWith('Successfully fetched recent media.');
    });

    it('does not set output', async () => {
      expect(core.setOutput).not.toHaveBeenCalled();
    });
  });
});
