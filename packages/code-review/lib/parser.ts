/**
 * Parses structured review findings from the LLM's markdown output.
 *
 * All review skills use a consistent format:
 *
 *   ### [SEVERITY] Issue Title
 *   **File:** `path/to/file.gleam:LINE`
 *   **Category:** quality
 *
 *   **Issue:** Description...
 *
 *   **Suggestion:** How to fix...
 *
 *   **Effort:** trivial|small|medium|large
 */

export type Severity = "HIGH" | "MEDIUM" | "LOW";
export type Effort = "trivial" | "small" | "medium" | "large";

export interface Finding {
  severity: Severity;
  title: string;
  file: string | undefined;
  category: string | undefined;
  issue: string;
  suggestion: string;
  effort: Effort | undefined;
  /** Which skill produced this finding */
  skill: string;
}

/**
 * Extract a bold-prefixed field value from a block of text.
 * e.g. `**File:** \`src/foo.gleam:12\`` → `src/foo.gleam:12`
 */
function extractField(block: string, fieldName: string): string | undefined {
  const pattern = new RegExp(
    `\\*\\*${fieldName}:\\*\\*\\s*\`?([^\`\\n]+)\`?`,
    "i",
  );
  const match = block.match(pattern);
  return match?.[1]?.trim();
}

/**
 * Extract a multi-line bold-prefixed field value.
 * Captures everything after `**Field:** ` until the next `**Field:**` or `---` separator.
 */
function extractMultiLineField(
  block: string,
  fieldName: string,
): string | undefined {
  const pattern = new RegExp(
    `\\*\\*${fieldName}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*\\w+:\\*\\*|---|$)`,
    "i",
  );
  const match = block.match(pattern);
  return match?.[1]?.trim() || undefined;
}

/**
 * Parse the LLM's review output into structured findings.
 */
export function parseFindings(text: string, skill: string): Finding[] {
  const findings: Finding[] = [];

  // Split on ### [SEVERITY] headings
  const headingPattern = /###\s+\[(HIGH|MEDIUM|LOW)\]\s+(.+)/g;
  const headings: { severity: Severity; title: string; index: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(text)) !== null) {
    headings.push({
      severity: match[1] as Severity,
      title: match[2].trim(),
      index: match.index,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextIndex = headings[i + 1]?.index ?? text.length;
    const block = text.slice(heading.index, nextIndex);

    const file = extractField(block, "File");
    const category = extractField(block, "Category");
    const issue = extractMultiLineField(block, "Issue");
    const suggestion = extractMultiLineField(block, "Suggestion");
    const effortRaw = extractField(block, "Effort");

    const effort =
      effortRaw &&
      ["trivial", "small", "medium", "large"].includes(effortRaw.toLowerCase())
        ? (effortRaw.toLowerCase() as Effort)
        : undefined;

    findings.push({
      severity: heading.severity,
      title: heading.title,
      file,
      category,
      issue: issue || "(no description)",
      suggestion: suggestion || "(no suggestion)",
      effort,
      skill,
    });
  }

  return findings;
}
