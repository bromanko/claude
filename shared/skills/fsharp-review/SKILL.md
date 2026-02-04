---
name: fsharp-review
description: This skill should be used when the user asks to "review F#", "full F# review", "review all F#", "comprehensive F# review", "review fsharp", or wants a complete review covering code quality, security, performance, and testing for F# code.
---

# F# Full Review

Run a comprehensive interactive review of F# code covering code quality, security, performance, and testing.

## How to Run

Use the `/review` command which provides an interactive experience — presenting findings one at a time and letting the user decide what to do with each:

```
/review fsharp
```

This runs all four review skills (code, security, performance, testing), collects findings, and walks through them interactively. For each finding the user can choose to fix it, fix with custom instructions, skip, or stop.

To run only specific review types:

```
/review fsharp code security
/review fsharp test
```
