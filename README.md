[![generate-ig-feed-json](https://github.com/mdb/ig-feed/actions/workflows/generate-ig-json.yaml/badge.svg)](https://github.com/mdb/ig-feed/actions/workflows/generate-ig-json.yaml) [![refresh-ig-access-token](https://github.com/mdb/ig-feed/actions/workflows/refresh-ig-token.yaml/badge.svg)](https://github.com/mdb/ig-feed/actions/workflows/refresh-ig-token.yaml)

# ig-feed

Use [GitHub Actions](https://github.com/mdb/ig-feed/actions/workflows/generate-ig-json.yaml) to periodically fetch recent media JSON from `graph.instagram.com` and publish the JSON as a GitHub pages endpoint at [mdb.github.io/ig-feed/ig/media.json](https://mdb.github.io/ig-feed/ig/media.json).

The JSON endpoint powers the Instagram feed at [mikeball.info](http://mikeball.info).

Use another [GitHub Action](https://github.com/mdb/ig-feed/actions/workflows/generate-ig-json.yaml) to periodically refresh the Instagram access token used and update the corresponding `IG_ACCESS_TOKEN` GitHub secret prior to the token's expiration.

`ig-feed` is a faster, simpler, fault tolerant, and more scalable successor to [gram](https://github.com/mdb/gram).
