const core = require('@actions/core');
const msw = require('msw');
const setupServer = require('msw/node').setupServer;
const run = require('./index');

const inputToken = 'abc123';
const outputToken = 'xyz789';

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

const server = setupServer(
  msw.rest.get(
    'https://graph.instagram.com/refresh_access_token',
    (req, res, ctx) => {
      const accessToken = req.url.searchParams.get('access_token');

      if (accessToken === inputToken) {
        return res(ctx.json({ access_token: outputToken }));
      }

      return res(
        ctx.status(400),
        ctx.json({
          error: {
            message: 'Invalid OAuth access token',
            type: 'OAuthException',
            code: 190,
          },
        }),
      );
    },
  ),
);

describe('refresh-token', () => {
  beforeAll(() => {
    server.listen();

    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'setOutput').mockImplementation(jest.fn());
    jest.spyOn(core, 'setSecret').mockImplementation(jest.fn());
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
    await expect(run()).resolves.not.toThrow();
  });

  describe('when a valid access token is provided', () => {
    beforeEach(async () => {
      await run();
    });

    it('logs info', async () => {
      expect(core.info).toHaveBeenCalledWith('Requesting new access token.');
      expect(core.info).toHaveBeenCalledWith('New access token received.');
    });

    it('sets the new `access_token` as output', () => {
      expect(core.setOutput).toHaveBeenCalledWith('access_token', outputToken);
    });

    it('sets the `access_token` output as secret', () => {
      expect(core.setSecret).toHaveBeenCalledWith(outputToken);
    });
  });

  describe('when no `access_token` input is provided', () => {
    beforeEach(async () => {
      unsetInputs();
      await run();
    });

    it('fails with an informative message', () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        'Input required and not supplied: access_token',
      );
    });

    it('does not log info about requesting a new token', () => {
      expect(core.info).not.toHaveBeenCalledWith('Requesting new access token.');
      expect(core.info).not.toHaveBeenCalledWith('New access token received.');
    });

    it('does not set output', () => {
      expect(core.setOutput).not.toHaveBeenCalled();
    });
  });

  describe('when an invalid `access_token` input is provided', () => {
    beforeEach(async () => {
      unsetInputs();
      setInputs({ access_token: 'bad-token' });
      await run();
    });

    it('logs info', async () => {
      expect(core.info).toHaveBeenCalledWith('Requesting new access token.');
    });

    it('fails with an error from the upstream Instagram API', async () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        '400 Invalid OAuth access token',
      );
    });

    it('does not log info that a new token has been received', async () => {
      expect(core.info).not.toHaveBeenCalledWith('New access token has been received.');
    });

    it('does not set output', async () => {
      expect(core.setOutput).not.toHaveBeenCalled();
    });
  });
});
