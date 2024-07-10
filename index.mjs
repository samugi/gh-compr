import { Octokit } from "@octokit/rest";
import createPrompt from "prompt-sync";
import { createPatch } from "diff";
import fs from "fs";

const prompt = createPrompt({});

// adds a tag to the end of header lines
const tagDiff = (diff, prNumber) => {
  const lines = diff.split("\n");
  const taggedLines = lines.map((line) => {
    if (line.startsWith("+++ ") || line.startsWith("--- ")) {
      return `${line}    # [PR: ${prNumber}]`;
    } else {
      return line;
    }
  });
  return taggedLines.join("\n");
};

// extracts owner, repo, and pull_number from PR URL
const extractPrInfo = (prUrl) => {
  // url like: https://github.com/samugi/compr/pull/123
  const parsedUrl = new URL(prUrl);
  const pathnameParts = parsedUrl.pathname
    .split("/")
    .filter((part) => part !== "");
  const owner = pathnameParts[0];
  const repo = pathnameParts[1];
  // part 2 is /pull/
  const pull_number = pathnameParts[3];
  return { owner, repo, pull_number };
};

const main = async () => {
  const prUrl1 = prompt("Enter PR 1 URL: ");
  const prUrl2 = prompt("Enter PR 2 URL: ");
  const token = prompt.hide(
    "Enter your GitHub personal access token (optional): ",
  );

  const octokit = new Octokit({
    auth: token,
  });

  const {
    owner: owner1,
    repo: repo1,
    pull_number: pr1Number,
  } = extractPrInfo(prUrl1);
  const {
    owner: owner2,
    repo: repo2,
    pull_number: pr2Number,
  } = extractPrInfo(prUrl2);

  const getPrDiff = async (prNumber, owner, repo) => {
    try {
      const response = await octokit.pulls.get({
        owner,
        repo,
        pull_number: parseInt(prNumber),
        headers: { accept: "application/vnd.github.v3.diff" },
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch PR #${prNumber}:`, error);
      return null;
    }
  };

  const pr1Diff = await getPrDiff(pr1Number, owner1, repo1);
  const pr2Diff = await getPrDiff(pr2Number, owner2, repo2);

  // remove context lines from gh diff
  const pr1NoCtxDiff = pr1Diff.replace(/^[^+-].*\n/gm, "");
  const pr2NoCtxDiff = pr2Diff.replace(/^[^+-].*\n/gm, "");

  // tag headers to make sure filenames always exist in the final diff diff
  const pr1TaggedDiff = tagDiff(pr1NoCtxDiff, pr1Number);
  const pr2TaggedDiff = tagDiff(pr2NoCtxDiff, pr2Number);

  const fileName = pr1Number + "-" + pr2Number + ".diff";
  const patch = createPatch(
    fileName,
    pr1TaggedDiff,
    pr2TaggedDiff,
    undefined,
    undefined,
    { context: 0 },
  );

  fs.writeFileSync(fileName, patch);
  console.log(`Diff written to ${fileName}`);
};

main();
