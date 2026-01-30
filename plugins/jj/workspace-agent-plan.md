# Plan: jj Workspace Skill

Add a skill to the existing `plugins/jj/` plugin that orchestrates agentic work in isolated jj workspaces. The skill composes with any agent — code review, test writing, generic coding, etc.

## Core Idea

A single **skill** handles the full workspace lifecycle via natural language:

- "Create a workspace and have the code review agent look at the auth module"
- "Continue work in the auth-fix workspace, write tests this time"
- "Finish up the auth-fix workspace and merge it"
- "What workspaces are open?"

The skill is the orchestration brain. It knows how to create/continue/finish workspaces and how to launch any agent within one by injecting workspace context into the agent's prompt.

## Files to Create/Modify

### Modified: `plugins/jj/plugin.json`
- Add `"skills": ["./skills/"]`
- Bump version to `2.0.0`

### New: `plugins/jj/skills/workspace/SKILL.md`

The skill that handles all workspace orchestration.

**Frontmatter:**
```yaml
name: workspace
description: >
  Use this skill when the user wants to create, continue, finish, or list
  jj workspaces for agentic work. Triggers include phrases like: "create a
  workspace", "run X agent in a workspace", "spin up a workspace",
  "continue work in workspace Y", "finish workspace Y", "merge workspace Y",
  "close workspace Y", "what workspaces are open". This skill is about
  managing isolated jj working copies for subagents — it should NOT trigger
  for general branch management, bookmarks, or non-workspace jj operations.
```

**Skill content covers four operations:**

#### 1. Create Workspace
- Determine workspace name (user-provided or auto-generate `agent-<8hex>`)
- `jj root` → get repo root, derive repo directory name
- Compute path: `<repo-root>/../<repo-dirname>-ws-<name>` (sibling directory)
- Check `jj workspace list` for name collision
- `jj workspace add --name <name> <path>`
- Record the workspace in the registry file (see Path Tracking below)
- Report workspace name and path to user
- If the user requested an agent, launch it via Task tool with workspace context injected into the prompt:
  - Working directory is the workspace path
  - Use jj for version control, never git
  - Commit work before finishing
  - Don't manage workspace lifecycle (no `workspace add/forget`)

#### 2. Continue in Workspace
- `jj workspace list` → verify workspace exists in jj
- Look up path from registry file
- Verify directory exists on disk
- Show current state: commits, uncommitted changes
- Launch the requested agent (or continue conversation) with workspace context

#### 3. Finish Workspace
- Verify workspace exists in both `jj workspace list` and registry
- Look up path from registry
- Analyze commits: `jj log -r 'ancestors(<name>@) & mutable() & ~ancestors(default@)'`
- Merge strategy (decide based on commit analysis):
  - Uncommitted changes only → commit first, then squash
  - Single commit → `jj squash -r <change-id>`
  - Multiple commits → `jj rebase -s <earliest> -d <target>`
- **On conflict**: Stop. Report the conflict to the user. Do NOT forget or delete the workspace. The user decides whether to resolve manually or abandon.
- **On success**:
  - `jj workspace forget <name>`
  - Delete the workspace directory (see Safety Rules below)
  - Remove entry from registry file
  - Show merged result via `jj log`

#### 4. List Workspaces
- Read the registry file for managed workspaces with their paths
- Cross-reference with `jj workspace list` for commit status
- For each workspace: name, path, current change, uncommitted changes status
- Flag any inconsistencies (registry entry without jj workspace, or vice versa)

## Path Tracking

`jj workspace list` does not expose workspace paths (the `WorkspaceRef` template type only has `name()` and `target()`). Rather than reconstructing paths from naming conventions, the skill maintains a registry file:

**File**: `<repo-root>/.jj/workspace-registry.json`

```json
{
  "workspaces": {
    "my-feature": {
      "path": "/absolute/path/to/project-ws-my-feature",
      "created": "2026-01-29T12:00:00Z"
    }
  }
}
```

- Written at workspace creation, read on continue/finish/list, cleaned up on finish
- Stored in `.jj/` so it's not tracked by the repo itself
- The skill is the only writer; if the file is missing or corrupt, fall back to the naming convention as a best-effort recovery

## Safety Rules for Deletion

Skills don't have `allowed-tools` constraints, so the skill prompt must include explicit guardrails:

1. **Only delete directories that are recorded in the registry file** — never guess or reconstruct a path for deletion
2. **Verify the path contains `-ws-` in the directory name** before running `rm -rf`
3. **Never delete a directory that is an ancestor of the repo root** (e.g., never delete `/Users/` or the main repo)
4. **Never forget the "default" workspace**
5. **Always confirm the workspace name with the user before destructive operations** (forget + delete)
6. **On any doubt, stop and ask** — don't proceed with deletion if the registry and filesystem don't agree

## Conflict Handling

When the merge step (squash or rebase) produces conflicts:

1. Report the conflicting files to the user
2. **Preserve the workspace** — do not forget or delete it
3. Suggest options:
   - Resolve conflicts manually in the workspace directory
   - Abandon the workspace changes (`jj abandon` the workspace commits, then finish)
   - Run another agent in the workspace to attempt resolution
4. The user drives the decision; the skill does not auto-resolve

## Skill Triggering Boundary

The description should be specific enough to avoid false triggers. Key distinctions:

| Should trigger | Should NOT trigger |
|---|---|
| "create a workspace for..." | "create a branch for..." |
| "run the review agent in a workspace" | "review this code" (no workspace mention) |
| "work on this in isolation" | "work on this in a separate branch" |
| "finish/merge/close workspace X" | "merge this branch" |
| "what workspaces are open" | "what branches exist" |

The word "workspace" or "isolation" (in the context of agentic work) should be the primary trigger signal. General coding requests without workspace language should not activate this skill.

## Design Decisions

- **Skill, not commands**: Natural language triggering lets the user say what they want without remembering slash commands. The skill handles routing to the right operation.
- **Composable with any agent**: The skill doesn't define its own worker agent. It wraps any agent by injecting workspace context into the Task tool prompt. Code review agents, test agents, generic agents — all work.
- **Workspace directory location**: Sibling to repo root (e.g., `project-ws-my-feature/` next to `project/`). Avoids cluttering the repo and jjignore issues.
- **Naming**: User-provided preferred; fallback is `agent-<8hex>` from timestamp hash.
- **Registry file for path tracking**: Since jj doesn't expose workspace paths, we maintain our own mapping in `.jj/workspace-registry.json`. This is also the source of truth for safe deletion.
- **Conflict-safe**: Merge conflicts preserve the workspace. The user decides the recovery path.
- **No new agents or commands**: The skill contains all orchestration logic inline.

## Verification

1. Say "create a workspace called test-ws and make a hello.txt file" → verify workspace created at sibling path, registry file written, work happens in it
2. Say "what workspaces are open" → verify test-ws appears with path and status
3. Say "continue in test-ws, add a goodbye.txt" → verify path resolved from registry, work continues
4. Say "finish test-ws and merge it" → verify commits merged, workspace forgotten, directory removed, registry cleaned
5. Say "what workspaces are open" → verify test-ws is gone
6. Test conflict case: create workspace, make a conflicting change, attempt finish → verify workspace preserved with helpful message
7. Test triggering boundary: say "work on this in a separate branch" → verify skill does NOT activate
