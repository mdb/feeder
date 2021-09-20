const core = require('@actions/core');
const refreshToken = require('./refresh-token');
const getRecentMedia = require('./get-recent-media');
const run = require('./index');

jest.mock('./get-recent-media', () => jest.fn());
jest.mock('./refresh-token', () => jest.fn());

const inputToken = 'abc123';

const DEFAULT_INPUTS = {
  access_token: inputToken
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

describe('run', () => {
  beforeAll(() => {
    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'setFailed').mockImplementation(jest.fn());
  });

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();

    setInputs();
  });

  afterEach(() => {
    unsetInputs();
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
      unsetInputs();
      setInputs({ access_token: 'token' });

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
      setInputs({ action: 'refresh_token' });

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
      setInputs({ action: 'get_recent_media' });

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
