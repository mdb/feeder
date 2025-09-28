import { jest } from '@jest/globals'
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import * as fs from 'fs';
import {
  igApiUrl,
  fetchAllMediaPages,
  saveRecentMedia,
  addGitHubUrlsToMediaJson,
  MEDIA_FILE,
} from './index';

const fsPromises = fs.promises;

describe('main', () => {
  describe('fetchAllMediaPages', () => {
    const igApiUrlTwo = `${igApiUrl}-2`;
    const validToken = 'abc123';

    const recentMediaJsonOne = {
      data: [{
        media_url: 'http://media_url',
        permalink: 'http://permalink',
        caption: 'caption',
        id: '1'
      }],
      paging: {
        next: `${igApiUrlTwo}?fields=media_url,caption,permalink&access_token=${validToken}`
      }
    };

    const recentMediaJsonTwo = {
      data: [{
        media_url: 'http://media_url_2',
        permalink: 'http://permalink_2',
        caption: 'caption_2',
        id: '2'
      }],
      paging: {}
    };

    const mockServer = () => {
      const data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const mediaDownloadReqBody = Buffer.from(data, 'base64');

      return setupServer(
        http.get(
          igApiUrl,
          (req) => {
            const url = new URL(req.request.url);
            const accessToken = url.searchParams.get('access_token');
            const fields = url.searchParams.get('fields');

            if (accessToken !== validToken && fields) {
              return new HttpResponse({
                error: {
                  message: 'Invalid OAuth access token',
                  type: 'OAuthException',
                  code: 190
                }
              }, { status: 400 });
            }

            if (!fields.includes('media_url') || !fields.includes('permalink')) {
              return new HttpResponse({
                error: {
                  message: 'Invalid fields'
                }
              }, { status: 500 });
            }

            return HttpResponse.json(recentMediaJsonOne);
          }
        ),
        http.get(
          igApiUrlTwo,
          (req) => {
            const url = new URL(req.request.url);
            const accessToken = url.searchParams.get('access_token');
            const fields = url.searchParams.get('fields');

            if (accessToken !== validToken && fields) {
              return new HttpResponse({
                error: {
                  message: 'Invalid OAuth access token',
                  type: 'OAuthException',
                  code: 190
                }
              }, { status: 400 });
            }

            if (!fields.includes('media_url') || !fields.includes('permalink') || !fields.includes('caption')) {
              return new HttpResponse({
                error: {
                  message: 'Invalid fields'
                }
              }, { status: 500 });
            }

            return HttpResponse.json(recentMediaJsonTwo);
          }
        ),
        http.get(
          recentMediaJsonOne.data[0].media_url,
          () => {
            return new HttpResponse(mediaDownloadReqBody, {
              status: 200,
            });
          }
        ),
        http.get(
          recentMediaJsonTwo.data[0].media_url,
          () => {
            return new HttpResponse(mediaDownloadReqBody, {
              status: 200,
            });
          }
        )
      );
    };

    let server;

    beforeAll(() => {
      server = mockServer();
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
        await fetchAllMediaPages();
      });

      afterEach(async () => {
        await fsPromises.unlink('1.jpg');
        await fsPromises.unlink('2.jpg');
      });

      it('writes the Instagram API response JSON to a "media.json" file', async () => {
        const mediaOne = recentMediaJsonOne;
        mediaOne.data[0].github_media_url = 'https://mdb.github.io/feeder/feeds/1.jpg';
        mediaOne.paging.next = 'https://mdb.github.io/feeder/feeds/instagram-media-1.json';

        const mediaTwo = recentMediaJsonTwo;
        mediaTwo.data[0].github_media_url = 'https://mdb.github.io/feeder/feeds/2.jpg';
        mediaTwo.paging = {};

        expect(fs.promises.writeFile.mock.calls).toEqual([
          ['instagram-media-0.json', JSON.stringify(mediaOne)],
          ['instagram-media-1.json', JSON.stringify(mediaTwo)],
        ]);
      });
    });

    describe('when no IG_ACCESS_TOKEN environment variable is provided', () => {
      it('errors with an informative message', async () => {
        try {
          await fetchAllMediaPages();
        } catch (error) {
          expect(error.message).toEqual('Missing required environment variable "IG_ACCESS_TOKEN."');
        }
      });
    });

    describe('when an invalid IG_ACCESS_TOKEN environment variable is provided', () => {
      it('errors with the relevant message from the upstream Instagram API', async () => {
        process.env.IG_ACCESS_TOKEN = 'bad-token';

        try {
          await fetchAllMediaPages();
        } catch (error) {
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
        http.get(
          url,
          () => {
            const buffer = Buffer.from(data, 'base64');
            const body = status === 200 ? buffer : {
              error: {
                message: `error: ${status}`
              }
            };

            return new HttpResponse(body, {
              status,
            });
          }
        )
      );
    };

    beforeEach(async () => {
      await fsPromises.writeFile(MEDIA_FILE, JSON.stringify({
        data: [{
          media_url: mediaUrl,
          id: id,
        }]
      }));
    });

    describe('when the upstream server experiences no errors serving the images', () => {
      let server;

      beforeEach(async () => {
        server = mockServer(mediaUrl);
        server.listen();
      });

      afterEach(async () => {
        await fsPromises.unlink(MEDIA_FILE);
        await fsPromises.unlink(`${id}.jpg`);
      });

      afterAll(() => server.close());

      it('downloads each the image whose URL is declared in the media.json file and saves it to a ${id}.jpg file', async () => {
        await saveRecentMedia();

        const contents = await fsPromises.readFile(`${id}.jpg`);

        expect(contents.toString('base64')).toEqual(data);
      });
    });

    describe('when the upstream server returns an error serving the images', () => {
      const status = 404;
      let server;

      beforeEach(async () => {
        server = mockServer(mediaUrl, status);
        server.listen();
      });

      afterEach(async () => {
        await fsPromises.unlink(MEDIA_FILE);
      });

      afterAll(() => server.close());

      it('throws an error', async () => {
        try {
          await saveRecentMedia();
        } catch (error) {
          expect(error.message).toEqual(`Request failed with status code ${status}`);
        }
      });
    });
  });

  describe('addGitHubUrlsToMediaJson', () => {
    beforeEach(async () => {
      await fsPromises.writeFile(MEDIA_FILE, JSON.stringify({
        data: [{
          media_url: 'https://foo',
          id: '1'
        }, {
          media_url: 'https://bar',
          id: '1'
        }],
        paging: {
          next: 'https://next',
          next_gh_url: 'https://next'
        }
      }));
    });

    afterEach(async () => {
      await fsPromises.unlink(MEDIA_FILE);
    });

    it('adds the correct "github_media_url" property to each item in the "media.json" file', async () => {
      await addGitHubUrlsToMediaJson();

      const media = await fsPromises.readFile(MEDIA_FILE);

      JSON.parse(media).data.forEach(m => {
        expect(m.github_media_url).toEqual(`https://mdb.github.io/feeder/feeds/${m.id}.jpg`);
      });
    });
  });
});
