const core = require('@actions/core');
const refreshToken = require('./refresh-token');
const getRecentMedia = require('./get-recent-media');
const helpers = require('./test-helpers');
const run = require('./index');

jest.mock('./get-recent-media', () => jest.fn());
jest.mock('./refresh-token', () => jest.fn());

describe('run', () => {
  beforeAll(() => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn());
  });

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();

    helpers.setInputs();
  });

  afterEach(() => {
    helpers.unsetInputs();
  });

  describe('when no `access_token` input is provided', () => {
    beforeEach(async () => {
      helpers.unsetInputs();
      await run();
    });

    it('fails with an informative message', () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        'Input required and not supplied: access_token',
      );
    });

    it('does not log any info', () => {
      expect(core.info).not.toHaveBeenCalled();
    });

    it('does not attempt to refresh the token', () => {
      expect(refreshToken).not.toHaveBeenCalled();
    });

    it('does not attempt to fetch recent media', () => {
      expect(getRecentMedia).not.toHaveBeenCalled();
    });
  });

  describe('when no `action` input is provided', () => {
    beforeEach(async () => {
      helpers.unsetInputs();
      helpers.setInputs({ access_token: 'token' });

      await run();
    });

    it('fails with an informative message', () => {
      expect(core.setFailed).toHaveBeenCalledWith(
        'Input required and not supplied: action',
      );
    });

    it('does not log any info', () => {
      expect(core.info).not.toHaveBeenCalled();
    });

    it('does not attempt to refresh the token', () => {
      expect(refreshToken).not.toHaveBeenCalled();
    });

    it('does not attempt to fetch recent media', () => {
      expect(getRecentMedia).not.toHaveBeenCalled();
    });
  });

  describe('when the `action` input is `refresh_token`', () => {
    beforeEach(async () => {
      helpers.setInputs({ action: 'refresh_token' });

      await run();
    });

    it('logs info', () => {
      expect(core.info).toHaveBeenCalledWith('Running refresh_token.');
    });

    it('does attempts to refresh the token', () => {
      expect(refreshToken).toHaveBeenCalled();
    });

    it('does not attempt to fetch recent media', () => {
      expect(getRecentMedia).not.toHaveBeenCalled();
    });
  });

  describe('when the `action` input is `get_recent_media`', () => {
    beforeEach(async () => {
      helpers.setInputs({ action: 'get_recent_media' });

      await run();
    });

    it('logs info', () => {
      expect(core.info).toHaveBeenCalledWith('Running get_recent_media.');
    });

    it('does not attempt to refresh the token', () => {
      expect(refreshToken).not.toHaveBeenCalled();
    });

    it('does attempts to fetch recent media', () => {
      expect(getRecentMedia).toHaveBeenCalled();
    });
  });
});
