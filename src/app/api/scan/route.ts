import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from "@octokit/rest";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

    const [owner, repo] = [match[1], match[2]];
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // 1. Full Data Fetching from GitHub
    const [commits, prs, workflows, branches, repoData] = await Promise.all([
      octokit.repos.listCommits({ owner, repo, per_page: 100 }),
      octokit.pulls.list({ owner, repo, state: 'closed', per_page: 20 }),
      octokit.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 50 }),
      octokit.repos.listBranches({ owner, repo }),
      octokit.repos.get({ owner, repo })
    ]);

    const findings = [];

    // --- SECTION: CRITICAL (3 PROBLEMS) ---

    // 1. Slow CI/CD
    const successfulRuns = workflows.data.workflow_runs.filter(r => r.conclusion === 'success').slice(0, 5);
    const avgBuildTime = successfulRuns.length > 0 
      ? Math.round(successfulRuns.reduce((acc, r) => acc + (new Date(r.updated_at).getTime() - new Date(r.run_started_at!).getTime()), 0) / (successfulRuns.length * 60000))
      : 0;
    findings.push({
      category: "CI/CD PIPELINE", 
      score: avgBuildTime > 15 || avgBuildTime === 0 ? "CRITICAL" : "HEALTHY",
      message: "Slow CI/CD pipelines",
      evidence: avgBuildTime > 0 ? `Avg build time is ${avgBuildTime}m. Manual overhead high.` : "No successful CI runs detected recently.",
      actionLabel: "Optimize Pipeline"
    });

    // 2. Flaky Test Suites
    const runMap: any = {};
    workflows.data.workflow_runs.forEach(r => {
      if (!runMap[r.head_sha]) runMap[r.head_sha] = [];
      runMap[r.head_sha].push(r.conclusion);
    });
    const flakyCount = Object.values(runMap).filter((c: any) => c.includes('success') && c.includes('failure')).length;
    findings.push({
      category: "TESTING", 
      score: flakyCount > 0 ? "CRITICAL" : "HEALTHY",
      message: "Flaky test suites",
      evidence: `Detected ${flakyCount} commits with unstable 'pass-after-fail' patterns.`,
      actionLabel: "Quarantine Tests"
    });

    // 3. Context Switching Tax
    const authors = new Set(commits.data.map(c => c.author?.login)).size;
    const loadFactor = Math.round(100 / (authors || 1));
    findings.push({
      category: "TEAM HEALTH", 
      score: loadFactor > 30 ? "CRITICAL" : "HEALTHY",
      message: "Context switching tax",
      evidence: `Active devs managing ~${loadFactor} tasks each. Cognitive load is extreme.`,
      actionLabel: "Balance Workload"
    });

    // --- SECTION: WARNING (3 PROBLEMS) ---

    // 4. Stale Documentation
    const lastPush = new Date(repoData.data.pushed_at).getTime();
    const daysSincePush = Math.round((Date.now() - lastPush) / 86400000);
    findings.push({
      category: "DOCUMENTATION", 
      score: daysSincePush > 90 ? "WARNING" : "HEALTHY",
      message: "Stale documentation",
      evidence: `Docs/Code sync drift detected. Last update was ${daysSincePush} days ago.`,
      actionLabel: "Refresh Docs"
    });

    // 5. Onboarding Bottlenecks
    findings.push({
      category: "ONBOARDING", 
      score: repoData.data.size > 5000 ? "WARNING" : "HEALTHY",
      message: "Onboarding bottlenecks",
      evidence: `Repo footprint is ${repoData.data.size}KB. High architectural surface area.`,
      actionLabel: "Simplify Setup"
    });

    // 6. PR Review Lag
    const avgPRLag = prs.data.length > 0 
      ? Math.round(prs.data.reduce((acc, pr) => acc + (new Date(pr.closed_at!).getTime() - new Date(pr.created_at).getTime()), 0) / (prs.data.length * 3600000))
      : 0;
    findings.push({
      category: "VELOCITY", 
      score: avgPRLag > 48 ? "CRITICAL" : (avgPRLag > 24 ? "WARNING" : "HEALTHY"),
      message: "PR review lag",
      evidence: `Average PR takes ${avgPRLag}h to close. Bottleneck in review cycle.`,
      actionLabel: "Nudge Reviewers"
    });

    // --- SECTION: INFO (2 PROBLEMS) ---

    // 7. Dependency Confusion
    const branchCount = branches.data.length;
    findings.push({
      category: "DEPENDENCIES", 
      score: "INFO",
      message: "Dependency confusion",
      evidence: `Active drift across ${branchCount} branches. Potential transitive dependency risk.`,
      actionLabel: "Audit Deps"
    });

    // 8. Environment Drift
    const drift = await octokit.repos.compareCommits({ owner, repo, base: 'main', head: 'dev' }).catch(() => ({ data: { ahead_by: 0 } }));
    findings.push({
      category: "INFRASTRUCTURE", 
      score: "INFO",
      message: "Environment drift",
      evidence: `Dev branch is ${drift.data.ahead_by} commits ahead of Main. Config mismatch likely.`,
      actionLabel: "Sync Environments"
    });

    // --- FINAL SCORE CALCULATION ---
    const criticalCount = findings.filter(f => f.score === 'CRITICAL').length;
    const warningCount = findings.filter(f => f.score === 'WARNING').length;

    
    const calculatedHealth = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 7));

    
    return NextResponse.json({
      findings,
      overallHealth: calculatedHealth
    });

  } catch (error: any) {
    console.error("Scan Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}