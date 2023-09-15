const { Octokit } = require('octokit');
const fs = require('fs');
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

async function getPaginatedData(url) {
  const response = await octokit.paginate('GET /search/issues', {
    q: 'is:pr+is:public+author:mdb+-user:mdb',
    per_page: 100,
  });

  const parsedData = parseData(response)

  return parsedData;
}

parseData = (items) => {
  const seen = {};
  return items.map(item => {
    if (!seen[item.repository_url]) {
      seen[item.repository_url] = true;

      return contribution(item.repository_url)
    }
  }).filter(item => item !== undefined && item !== null);
};

contribution = (repositoryUrl) => {
  const url = new URL(repositoryUrl);
  const repo = url.pathname.split('/').slice(2, 4).join('/');

  return {
    repo: repo,
    url: `https://github.com/${repo}`
  }
};

(async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const data = await getPaginatedData();
    fs.writeFileSync('github-contributions.json', JSON.stringify(data));
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
