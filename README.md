# comPR

A simple script I made to help me review cherry-picked pull requests where diffs are expected to be similar.
It outputs a (cleaned up) diff of the PRs' diffs.

## Usage

```bash
node index.mjs
Enter PR 1 URL: https://github.com/octocat/Hello-World/pull/123
Enter PR 2 URL: https://github.com/octocat/Hello-World/pull/125
Enter your GitHub personal access token (optional):
```

The personal access token is needed for accessing private repositories. It requires the `repo` scope.
