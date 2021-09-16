const axios = require('axios')
const fs = require('fs')
const fsPromises = fs.promises
const accessToken = process.env.IG_ACCESS_TOKEN

if (!accessToken) {
  console.log(`IG_ACCESS_TOKEN environment variable must be set`)
  process.exit(1)
}

async function getRecentMedia() {
  const result = await axios({
    url: `https://graph.instagram.com/me/media?fields=media_url,permalink&access_token=${accessToken}`
  })

  if (result.status >= 400) {
    console.log(`received ${result.status} from graph.instagram.com`)
    process.exit(1)
  }

  await fsPromises.writeFile('instagram.json', JSON.stringify(result.data.data));
}

getRecentMedia();
