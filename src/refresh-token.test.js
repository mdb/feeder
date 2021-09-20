const core = require('@actions/core');
const refreshToken = require('./refresh-token');
const helpers = require('./test-helpers');

const inputToken = helpers.INPUT_TOKEN;
const outputToken = 'xyz789';

const server = helpers.mockServer(
  'https://graph.instagram.com/refresh_access_token',
  { access_token: outputToken }
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

    helpers.setInputs();
  });

  afterEach(() => {
    server.resetHandlers();

    helpers.unsetInputs();
  });

  afterAll(() => server.close());

  it('runs', async () => {
    await expect(refreshToken()).resolves.not.toThrow();
  });

  describe('when a valid access token is provided', () => {
    beforeEach(async () => {
      await refreshToken();
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
      helpers.unsetInputs();
      await refreshToken();
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
      helpers.unsetInputs();
      helpers.setInputs({ access_token: 'bad-token' });
      await refreshToken();
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
