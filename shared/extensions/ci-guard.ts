/**
 * CI Guard Extension
 *
 * Enforces CI checks in projects that use selfci:
 *
 * 1. After the agent finishes responding, checks if there are meaningful
 *    changes in the repo and reminds the agent to run `selfci check`.
 * 2. Intercepts `jj git push` and `git push` commands and blocks them
 *    if `selfci check` hasn't passed for the current changes.
 *
 * Requires: selfci configured in the project (.config/selfci/ci.yaml).
 * Works with both jj and git repositories.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

let lastCiPassed = false;
let hasSelfci: boolean | null = null;
let vcs: "jj" | "git" | null = null;
let trunkBranch: string | null = null;

async function detectSetup(pi: ExtensionAPI): Promise<boolean> {
  // Check for selfci config
  if (hasSelfci === null) {
    const result = await pi.exec("test", ["-f", ".config/selfci/ci.yaml"]);
    hasSelfci = result.code === 0;
  }
  if (!hasSelfci) return false;

  // Detect VCS
  if (vcs === null) {
    const jjResult = await pi.exec("test", ["-d", ".jj"]);
    if (jjResult.code === 0) {
      vcs = "jj";
    } else {
      const gitResult = await pi.exec("test", ["-d", ".git"]);
      vcs = gitResult.code === 0 ? "git" : null;
    }
  }
  if (vcs === null) return false;

  // Detect trunk branch
  if (trunkBranch === null) {
    if (vcs === "jj") {
      // Check common trunk branch names via bookmarks
      const bookmarks = await pi.exec("jj", [
        "bookmark",
        "list",
        "--no-pager",
      ]);
      if (bookmarks.code === 0) {
        for (const name of ["main", "master", "trunk"]) {
          if (bookmarks.stdout.split("\n").some((l) => l.startsWith(`${name}:`))) {
            trunkBranch = name;
            break;
          }
        }
      }
    } else {
      // git: check common trunk branch names
      for (const name of ["main", "master", "trunk"]) {
        const result = await pi.exec("git", [
          "rev-parse",
          "--verify",
          name,
        ]);
        if (result.code === 0) {
          trunkBranch = name;
          break;
        }
      }
    }
  }

  return trunkBranch !== null;
}

async function hasChanges(
  pi: ExtensionAPI,
): Promise<{ working: boolean; commits: number }> {
  if (vcs === "jj") {
    const status = await pi.exec("jj", ["status", "--no-pager"]);
    const working =
      status.code === 0 &&
      status.stdout.split("\n").some((line) => /^[AMD] /.test(line));

    const log = await pi.exec("jj", [
      "log",
      "-r",
      `${trunkBranch}..@- ~ empty()`,
      "--no-graph",
      "-T",
      'change_id.short() ++ "\\n"',
    ]);
    const commits =
      log.code === 0
        ? log.stdout
            .trim()
            .split("\n")
            .filter((l) => l.length > 0).length
        : 0;

    return { working, commits };
  } else {
    const status = await pi.exec("git", ["status", "--porcelain"]);
    const working =
      status.code === 0 && status.stdout.trim().length > 0;

    const log = await pi.exec("git", [
      "rev-list",
      "--count",
      `${trunkBranch}..HEAD`,
    ]);
    const commits =
      log.code === 0 ? parseInt(log.stdout.trim(), 10) || 0 : 0;

    return { working, commits };
  }
}

export default function (pi: ExtensionAPI) {
  // Track CI results from bash commands
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "Bash") return;
    const command = (event.input as { command?: string })?.command ?? "";
    if (/selfci\s+check/.test(command)) {
      const details = event.details as { exitCode?: number } | undefined;
      if (details?.exitCode === 0) {
        lastCiPassed = true;
      }
    }
  });

  // Reset CI state when repo changes via bash
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "Bash") return;
    const command = (event.input as { command?: string })?.command ?? "";
    // jj mutations
    if (/jj\s+(commit|squash|rebase|new|edit|describe|abandon)/.test(command)) {
      lastCiPassed = false;
    }
    // git mutations
    if (/git\s+(commit|rebase|merge|cherry-pick|reset|revert)/.test(command)) {
      lastCiPassed = false;
    }
  });

  // Reset CI state on file edits
  pi.on("tool_result", async (event) => {
    if (event.toolName === "Edit" || event.toolName === "Write") {
      lastCiPassed = false;
    }
  });

  // Block push if CI hasn't passed
  pi.on("tool_call", async (event) => {
    if (event.toolName !== "Bash") return;
    const command = (event.input as { command?: string })?.command ?? "";

    const isPush =
      /jj\s+git\s+push/.test(command) || /git\s+push/.test(command);
    if (!isPush) return;

    if (!(await detectSetup(pi))) return;

    if (!lastCiPassed) {
      return {
        block: true,
        reason:
          "CI has not passed for the current changes. Run `selfci check` first and ensure it passes before pushing.",
      };
    }
  });

  // Remind agent to run CI when there are changes
  pi.on("agent_end", async () => {
    if (lastCiPassed) return;
    if (!(await detectSetup(pi))) return;

    const { working, commits } = await hasChanges(pi);

    if (working || commits > 0) {
      const parts: string[] = [];
      if (working) parts.push("uncommitted changes in the working copy");
      if (commits > 0)
        parts.push(`${commits} commit(s) ahead of ${trunkBranch}`);

      pi.sendMessage(
        {
          customType: "ci-guard",
          content: `Reminder: there are ${parts.join(" and ")}. Run \`selfci check\` to validate before finishing.`,
          display: true,
        },
        { deliverAs: "followUp", triggerTurn: true },
      );
    }
  });
}
