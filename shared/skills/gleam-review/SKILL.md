---
name: gleam-review
description: This skill should be used when the user asks to "review Gleam", "full Gleam review", "review all Gleam", "comprehensive Gleam review", or wants a complete review covering code quality, security, performance, and testing for Gleam code.
---

# Gleam Full Review

Run a comprehensive interactive review of Gleam code covering code quality, security, performance, and testing.

## How to Run

Use the `/review` command which provides an interactive experience — presenting findings one at a time and letting the user decide what to do with each:

```
/review gleam
```

This runs all four review skills (code, security, performance, testing), collects findings, and walks through them interactively. For each finding the user can choose to fix it, fix with custom instructions, skip, or stop.

To run only specific review types:

```
/review gleam code security
/review gleam test
```
