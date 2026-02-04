---
name: elm-review
description: This skill should be used when the user asks to "review Elm", "full Elm review", "review all Elm", "comprehensive Elm review", or wants a complete review covering code quality, security, performance, and testing for Elm code.
---

# Elm Full Review

Run a comprehensive interactive review of Elm code covering code quality, security, performance, and testing.

## How to Run

Use the `/review` command which provides an interactive experience — presenting findings one at a time and letting the user decide what to do with each:

```
/review elm
```

This runs all four review skills (code, security, performance, testing), collects findings, and walks through them interactively. For each finding the user can choose to fix it, fix with custom instructions, skip, or stop.

To run only specific review types:

```
/review elm code security
/review elm test
```
