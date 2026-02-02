/**
 * /jj:commit command — thin wrapper that invokes the jj-commit skill.
 *
 * Validates we're in a jj repo before sending the skill to the agent.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { isJjRepo } from "./utils.ts";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("jj:commit", {
    description: "Analyze jj status and create logical commits with good messages",
    handler: async (_args, ctx) => {
      if (!isJjRepo(ctx.cwd)) {
        ctx.ui.notify("Not in a jujutsu repository", "error");
        return;
      }

      pi.sendUserMessage("/skill:jj-commit");
    },
  });
}
