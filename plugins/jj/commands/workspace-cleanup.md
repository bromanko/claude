---
allowed-tools: Bash(jj:*)
---

# /jj:workspace-cleanup

Clean up empty jujutsu workspaces, excluding the default workspace.

## Usage

```
/jj:workspace-cleanup
```

## Description

This command helps maintain a clean workspace setup by removing empty workspaces that are no longer needed. It:

1. Lists all workspaces in the repository
2. Identifies workspaces that have no changes (empty)
3. Removes empty workspaces (except "default")
4. Reports which workspaces were removed and which remain

## Implementation

When invoked:

1. Run `jj workspace list` to see all workspaces
2. For each workspace (excluding "default"):
   - Check if the workspace has any changes
   - If the workspace is empty (no changes), mark it for removal
3. Remove each empty workspace using `jj workspace forget <workspace-name>`
4. After cleanup, display:
   - List of workspaces that were removed
   - List of workspaces that remain

## Notes

- Never removes the "default" workspace
- Only removes workspaces with no uncommitted changes
- Requires a jujutsu repository (`.jj` directory present)
- Safe to run - only removes truly empty workspaces
