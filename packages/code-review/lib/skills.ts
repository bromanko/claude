/**
 * Discovers review skills by scanning the shared skills directory.
 *
 * Skills follow the naming convention: `{language}-{type}-review`
 * e.g. gleam-code-review, fsharp-security-review
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface ReviewSkill {
  /** e.g. "gleam-code-review" */
  name: string;
  /** e.g. "gleam" */
  language: string;
  /** e.g. "code" */
  type: string;
  /** Absolute path to SKILL.md */
  path: string;
}

/**
 * Scan the shared skills directory for review skills.
 */
export function discoverReviewSkills(skillsDirs: string[]): ReviewSkill[] {
  const skills: ReviewSkill[] = [];

  for (const dir of skillsDirs) {
    if (!fs.existsSync(dir)) continue;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const match = entry.name.match(/^(.+)-(code|security|performance|test)-review$/);
      if (!match) continue;

      const skillPath = path.join(dir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) continue;

      skills.push({
        name: entry.name,
        language: match[1],
        type: match[2],
        path: skillPath,
      });
    }
  }

  return skills;
}

/**
 * Get unique languages that have review skills.
 */
export function getLanguages(skills: ReviewSkill[]): string[] {
  return [...new Set(skills.map((s) => s.language))].sort();
}

/**
 * Get available review types for a language.
 */
export function getTypesForLanguage(
  skills: ReviewSkill[],
  language: string,
): string[] {
  return skills
    .filter((s) => s.language === language)
    .map((s) => s.type)
    .sort();
}

/**
 * Filter skills by language and optional type filter.
 */
export function filterSkills(
  skills: ReviewSkill[],
  language: string,
  types?: string[],
): ReviewSkill[] {
  return skills.filter(
    (s) => s.language === language && (!types || types.includes(s.type)),
  );
}

/**
 * Known skills directories relative to the repository root.
 * We resolve from the extension's own location.
 */
export function getSkillsDirs(): string[] {
  // Navigate from this file to the shared skills directory
  const sharedSkills = path.resolve(__dirname, "../../../shared/skills");
  const globalSkills = path.join(
    process.env.HOME || "~",
    ".pi/agent/skills",
  );

  const dirs: string[] = [];
  if (fs.existsSync(sharedSkills)) dirs.push(sharedSkills);
  if (fs.existsSync(globalSkills)) dirs.push(globalSkills);
  return dirs;
}
