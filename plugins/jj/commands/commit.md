---
allowed-tools: Bash(jj:*)

---

# /jj:commit

Analyze jj status and create logical commits with good messages.

## Usage

```
/jj:commit
```

## Description

This command helps you create well-structured commits in a jujutsu repository by:

1. Analyzing the current `jj status` and changes
2. Examining diffs to understand modifications
3. Intelligently absorbing changes into existing mutable commits when appropriate
4. Grouping remaining changes into logical commits
5. Creating commits with descriptive messages following conventional commit format
6. Using a linear commit workflow with `jj commit -m "message"`

## Implementation

When invoked:

1. Run `jj status` to see all changes
2. Run `jj diff` to understand the nature of modifications
3. Check `jj log -r 'mutable() & ancestors(@) & ~@'` to see if there are mutable commits in the stack
4. If mutable commits exist in the stack:
   - Analyze whether changes look like fixes/updates to existing commits (typos, refinements, addressing feedback)
   - If appropriate, run `jj absorb` to automatically move changes into ancestor commits
   - Run `jj op show -p` to show what was absorbed
   - Check `jj status` again to see if any changes remain
5. For any remaining changes (or all changes if absorb wasn't used):
   - Analyze changes and group by:
     - File types and purposes (config, modules, docs, etc.)
     - Functional relationships
     - Scope (single feature, bug fix, refactoring, etc.)
   - Create commits using non-interactive commands:
     - **CRITICAL**: When creating multiple commits from a working copy, you MUST specify files explicitly
     - Use `jj commit -m "message" path/to/file1 path/to/file2` for each logical group
     - **NEVER** run `jj commit -m "message"` without file paths when you intend to create multiple commits
     - Running `jj commit` without file arguments commits ALL working copy changes, leaving nothing for subsequent commits
     - Follow conventional commit format
     - Use imperative mood in messages
     - Create commits linearly, one after another
6. Never use interactive commands (`jj commit` without `-m`, `jj split` without paths)
7. After creating commits, ensure all branches are merged:
   - Check for any dangling branches: `jj log -r 'heads(all()) & ~@' -T change_id.short()`
   - If there are any heads other than @, merge them into the working copy:
     ```bash
     jj new $(jj log -r 'heads(all())' -T 'change_id.short() ++ " "')
     ```
   - This ensures all commits are merged into the current working copy and there are no dangling branches
8. After creating and merging commits, show the result using:
   ```
   jj log -r 'ancestors(@, 5)' -T 'concat(change_id.short(), ": ", description)'
   ```

## Notes

- Requires a jujutsu repository (`.jj` directory present)
- Uses non-interactive workflow only
- Creates descriptive, atomic commits
- Follows the user's commit style preferences
- **Important jujutsu behavior**: `jj commit -m "message"` without file arguments commits ALL working copy changes at once. This is fundamentally different from git's incremental staging model. To create multiple commits from a single working copy, always specify file paths: `jj commit -m "message" file1 file2`
