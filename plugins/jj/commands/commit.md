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
3. Grouping related changes into logical commits
4. Creating commits with descriptive messages following conventional commit format
5. Using a linear commit workflow with `jj commit -m "message"`

## Implementation

When invoked:

1. Run `jj status` to see all changes
2. Run `jj diff` to understand the nature of modifications
3. Check `jj log` to understand existing commit patterns
4. Analyze changes and group by:
   - File types and purposes (config, modules, docs, etc.)
   - Functional relationships
   - Scope (single feature, bug fix, refactoring, etc.)
5. Create commits using non-interactive commands:
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
