const msw = require('msw');
const setupServer = require('msw/node').setupServer;
const main = require('./index');
const fs = require('fs');
const fsPromises = fs.promises;

describe('main', () => {
  describe('getRecentMedia', () => {
    const validToken = 'abc123';

    const recentMediaJson = {
      data: [{
        media_url: 'http://media_url',
        permalink: 'http://permalink'
      }]
    };

    const mockServer = (url, response) => {
      return setupServer(
        msw.rest.get(
          url,
          (req, res, ctx) => {
            const accessToken = req.url.searchParams.get('access_token');
            const fields = req.url.searchParams.get('fields');

            if (accessToken !== validToken && fields) {
              return res(
                ctx.status(400),
                ctx.json({
                  error: {
                    message: 'Invalid OAuth access token',
                    type: 'OAuthException',
                    code: 190
                  }
                })
              );
            }

            if (!fields.includes('media_url') || !fields.includes('permalink')) {
              return res(
                ctx.status(500),
                ctx.json({
                  error: {
                    message: 'Invalid fields'
                  }
                })
              );
            }

            return res(ctx.json(response));
          }
        )
      );
    };

    let server;

    beforeAll(() => {
      server = mockServer(
        'https://graph.instagram.com/me/media',
        recentMediaJson
      );

      server.listen();
    });

    beforeEach(() => {
      jest.spyOn(fs.promises, 'writeFile').mockImplementation(jest.fn());
    });

    afterEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
      server.resetHandlers();
      delete process.env.IG_ACCESS_TOKEN;
    });

    afterAll(() => server.close());

    describe('when a valid IG_ACCESS_TOKEN environment variable is provided', () => {
      beforeEach(async () => {
        process.env.IG_ACCESS_TOKEN = validToken;
        await main.getRecentMedia();
      });

      it('writes the Instagram API response JSON to a "media.json" file', async () => {
        expect(fs.promises.writeFile).toHaveBeenCalledWith(
          main.MEDIA_FILE,
          JSON.stringify(recentMediaJson.data)
        );
      });
    });

    describe('when no IG_ACCESS_TOKEN environment variable is provided', () => {
      it('errors with an informative message', async () => {
        try {
          await main.getRecentMedia();
        } catch(error) {
          expect(error.message).toEqual('Missing required environment variable "IG_ACCESS_TOKEN."');
        }
      });
    });

    describe('when an invalid IG_ACCESS_TOKEN environment variable is provided', () => {
      it('errors with the relevant message from the upstream Instagram API', async () => {
        process.env.IG_ACCESS_TOKEN = 'bad-token';

        try {
          await main.getRecentMedia();
        } catch(error) {
          expect(error.message).toEqual('Request failed with status code 400');
        }
      });
    });
  });

  describe('saveRecentMedia', () => {
    const data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const id = '1';
    const mediaUrl = 'http://foo.com/bar.jpg';

    const mockServer = (url, status) => {
      status = status || 200;

      return setupServer(
        msw.rest.get(
          url,
          (_, res, ctx) => {
            const buffer = Buffer.from(data, 'base64');

            return res(
              ctx.status(status),
              ctx.set('Content-Length', buffer.byteLength.toString()),
              ctx.set('Content-Type', 'image/jpeg'),
              (status === 200 ? ctx.body(buffer) : ctx.json({
                error: {
                  message: `error: ${status}`
                }
              })),
            );
          }
        )
      );
    };

    beforeEach(async () => {
      await fsPromises.writeFile(main.MEDIA_FILE, JSON.stringify([{
        media_url: mediaUrl,
        id: id,
      }]));
    });

    describe('when the upstream server experiencing no errors serving the images', () => {
      beforeEach(async () => {
        server = mockServer(mediaUrl);

        server.listen();
      });

      afterEach(async () => {
        await fsPromises.unlink(main.MEDIA_FILE);
      });

      afterAll(() => server.close());

      it('downloads each the image whose URL is declared in the media.json file and saves it to a ${id}.jpg file', async () => {
        await main.saveRecentMedia();

        const contents = await fsPromises.readFile(`${id}.jpg`);

        expect(contents.toString('base64')).toEqual(data);
      });
    });

    describe('when the upstream server returns an error serving the images', () => {
      const status = 404;

      beforeEach(async () => {
        server = mockServer(mediaUrl, status);

        server.listen();
      });

      afterEach(async () => {
        await fsPromises.unlink(main.MEDIA_FILE);
        await fsPromises.unlink(`${id}.jpg`);
      });

      afterAll(() => server.close());

      it('throws an error', async () => {
        try {
          await main.saveRecentMedia();
        } catch(error) {
          expect(error.message).toEqual(`Request failed with status code ${status}`);
        }
      });
    });
  });

  describe('addGitHubUrlsToMediaJson', () => {
    beforeEach(async () => {
      await fsPromises.writeFile(main.MEDIA_FILE, JSON.stringify([{
        media_url: 'https://foo',
        id: '1'
      }, {
        media_url: 'https://bar',
        id: '1'
      }]));
    });

    afterEach(async () => {
      await fsPromises.unlink(main.MEDIA_FILE);
    });

    it('adds the correct "github_media_url" property to each item in the "media.json" file', async () => {
      await main.addGitHubUrlsToMediaJson();

      const media = await fsPromises.readFile(main.MEDIA_FILE);

      JSON.parse(media).forEach(m => {
        expect(m.github_media_url).toEqual(`https://mdb.github.io/ig-feed/ig/${m.id}.jpg`);
      });
    });
  });
});
