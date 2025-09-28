import { Octokit } from 'octokit';
import * as fs from 'fs';
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

const getPaginatedData = async () => {
  // NOTE: This includes open PRs and non-merged closed PRs.
  // To view non-open PRs, add: state:closed
  // Merged PRs have a 'merged_at' field. However, some PRs may be closed (and
  // thereby have no merged_at), despite that their commits have been cherry
  // picked/merged via other PRs.
  // For example: https://github.com/incident-io/terraform-provider-incident/pull/78
  const items = await octokit.paginate('GET /search/issues', {
    q: 'is:pr+is:public+author:mdb+-user:mdb',
    per_page: 100,
  });

  return Object.groupBy(items, ({ repository_url }) => repoName(repository_url));
}

const repoName = (repositoryUrl) => {
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
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
