const { Octokit } = require('octokit');
const fs = require('fs');
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

getPaginatedData = async (url) => {
  const items = await octokit.paginate('GET /search/issues', {
    q: 'is:pr+is:public+author:mdb+-user:mdb',
    per_page: 100,
  });

  return Object.groupBy(items, ({ repository_url }) => repoName(repository_url));
}

repoName = (repositoryUrl) => {
  const url = new URL(repositoryUrl);

  return url.pathname.split('/').slice(2, 4).join('/');
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
