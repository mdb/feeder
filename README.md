[![generate-feeds](https://github.com/mdb/ig-feed/actions/workflows/generate-feeds.yaml/badge.svg)](https://github.com/mdb/ig-feed/actions/workflows/generate-feeds.yaml) [![refresh-ig-access-token](https://github.com/mdb/ig-feed/actions/workflows/refresh-ig-token.yaml/badge.svg)](https://github.com/mdb/ig-feed/actions/workflows/refresh-ig-token.yaml)

# feeds

Use [GitHub Actions](https://github.com/mdb/ig-feed/actions/workflows/generate-feeds.yaml) to periodically...

* fetch recent media JSON and images from `graph.instagram.com` and publish the
  JSON as a GitHub pages endpoint at [mdb.github.io/ig-feed/feeds/instagram-media.json](https://mdb.github.io/ig-feed/feeds/instagram-media.json).
* fetch a list of all public GitHub repositories I've contributed to and publish
  the JSON as an endpoint at [mdb.github.io/ig-feed/feeds/github-contributions.json](https://mdb.github.io/ig-feed/feeds/github-contributions.json)

The JSON endpoints are used by [mikeball.info](http://mikeball.info).

Use another [GitHub Action](https://github.com/mdb/ig-feed/actions/workflows/generate-ig-feed.yaml) to periodically refresh the Instagram access token used and update the corresponding `IG_ACCESS_TOKEN` GitHub secret prior to the token's expiration.
