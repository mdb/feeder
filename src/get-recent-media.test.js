const core = require('@actions/core');
const msw = require('msw');
const setupServer = require('msw/node').setupServer;
const getRecentMedia = require('./get-recent-media');
const helpers = require('./test-helpers');

const inputToken = helpers.INPUT_TOKEN;

const recentMediaJson = [{
  media_url: 'http://media_url',
  permalink: 'http://permalink'
}];

const server = helpers.mockServer(
  'https://graph.instagram.com/me/media',
  recentMediaJson
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

    helpers.setInputs();
  });

  afterEach(() => {
    server.resetHandlers();

    helpers.unsetInputs();
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
      helpers.unsetInputs();
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
      helpers.unsetInputs();
      helpers.setInputs({ access_token: 'bad-token' });
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
