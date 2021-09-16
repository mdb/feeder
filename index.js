const axios = require('axios')
const fs = require('fs')
const fsPromises = fs.promises
const accessToken = process.env.IG_ACCESS_TOKEN

if (!accessToken) {
  // TODO
}

async function getRecentMedia() {
  const result = await axios({
    url: `https://graph.instagram.com/me/media?fields=media_url,permalink&access_token=${accessToken}`
  })

  await fsPromises.writeFile('instagram.json', JSON.stringify(result.data.data));
}

getRecentMedia();
