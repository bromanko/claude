/**
 * tmux-titles — Update tmux window title with pi status indicators.
 *
 * Shows the current agent state as a colored icon in the tmux window name:
 *
 *   ○  idle (blue)       — session started, waiting for input
 *   ✻  thinking (yellow) — agent is working
 *   $  bash (cyan)       — running a shell command
 *   ✎  editing (yellow)  — writing/editing files
 *   …  reading (grey)    — reading files
 *   ?  waiting (magenta) — permission prompt / user input needed
 *   ⌫  compacting (grey) — context compaction in progress
 *   ✓  done (green)      — agent finished
 *
 * Configuration via environment variables:
 *   TMUX_TITLES_MODE     — "directory" (default) uses cwd basename,
 *                          "window" preserves existing window name
 *   TMUX_TITLES_POSITION — "suffix" (default) or "prefix"
 */

import { execSync } from "node:child_process";
import { basename } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function inTmux(): boolean {
  return !!(process.env.TMUX && process.env.TMUX_PANE);
}

function getTarget(): string | null {
  try {
    const result = execSync(
      `tmux display-message -p -t "${process.env.TMUX_PANE}" "#{session_id}:#{window_id}"`,
      { encoding: "utf-8", timeout: 2000 },
    ).trim();
    return result || null;
  } catch {
    return null;
  }
}

function getCurrentWindowName(target: string): string {
  try {
    return execSync(
      `tmux display-message -p -t "${target}" "#{window_name}"`,
      { encoding: "utf-8", timeout: 2000 },
    ).trim();
  } catch {
    return "";
  }
}

const ICON_PATTERN = /^(#\[fg=[a-z0-9]+\])?[✻✓○?⌫$✎…] /;
const ICON_PATTERN_SUFFIX = / (#\[fg=[a-z0-9]+\])?[✻✓○?⌫$✎…]$/;

function stripIcon(name: string): string {
  return name.replace(ICON_PATTERN, "").replace(ICON_PATTERN_SUFFIX, "");
}

function setTitle(icon: string, color: string, cwd: string): void {
  if (!inTmux()) return;

  const target = getTarget();
  if (!target) return;

  const mode = process.env.TMUX_TITLES_MODE ?? "directory";
  const position = process.env.TMUX_TITLES_POSITION ?? "suffix";

  const baseName =
    mode === "window"
      ? stripIcon(getCurrentWindowName(target))
      : basename(cwd);

  const indicator = `#[fg=${color}]${icon}`;
  const title =
    position === "prefix"
      ? `${indicator} ${baseName}`
      : `${baseName} ${indicator}`;

  try {
    execSync(`tmux rename-window -t "${target}" "${title}"`, {
      timeout: 2000,
    });
  } catch {
    // Ignore — tmux may have gone away
  }
}

function clearTitle(): void {
  if (!inTmux()) return;

  const target = getTarget();
  if (!target) return;

  const baseName = stripIcon(getCurrentWindowName(target));

  try {
    execSync(`tmux rename-window -t "${target}" "${baseName}"`, {
      timeout: 2000,
    });
  } catch {
    // Ignore
  }
}

function toolIcon(toolName: string): { icon: string; color: string } {
  switch (toolName) {
    case "bash":
      return { icon: "$", color: "cyan" };
    case "write":
    case "edit":
      return { icon: "✎", color: "yellow" };
    case "read":
    case "grep":
    case "find":
    case "ls":
      return { icon: "…", color: "colour245" };
    default:
      return { icon: "✻", color: "yellow" };
  }
}

export default function (pi: ExtensionAPI) {
  // Session started — idle
  pi.on("session_start", async (_event, ctx) => {
    setTitle("○", "blue", ctx.cwd);
  });

  // User submitted a prompt — thinking
  pi.on("agent_start", async (_event, ctx) => {
    setTitle("✻", "yellow", ctx.cwd);
  });

  // Agent finished — done
  pi.on("agent_end", async (_event, ctx) => {
    setTitle("✓", "green", ctx.cwd);
  });

  // Tool starting — show tool-specific icon
  pi.on("tool_call", async (event, ctx) => {
    const { icon, color } = toolIcon(event.toolName);
    setTitle(icon, color, ctx.cwd);
  });

  // Tool finished — back to thinking
  pi.on("tool_result", async (_event, ctx) => {
    setTitle("✻", "yellow", ctx.cwd);
  });

  // Compaction starting
  pi.on("session_before_compact", async (_event, ctx) => {
    setTitle("⌫", "colour245", ctx.cwd);
  });

  // Session ending — clear the icon
  pi.on("session_shutdown", async () => {
    clearTitle();
  });
}
