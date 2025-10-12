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
     - Use `jj commit -m "message"` for each logical group
     - Follow conventional commit format
     - Use imperative mood in messages
     - Create commits linearly, one after another
6. Never use interactive commands (`jj commit` without `-m`, `jj split` without paths)
7. After creating commits, show the result using:
   ```
   jj log -r @ -T 'concat(change_id.short(), ": ", description)' --no-graph
   ```

## Notes

- Requires a jujutsu repository (`.jj` directory present)
- Uses non-interactive workflow only
- Creates descriptive, atomic commits
- Follows the user's commit style preferences
