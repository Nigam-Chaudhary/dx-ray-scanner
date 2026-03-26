import { Octokit } from "@octokit/rest";

// Ye server-side par hi run hoga
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});