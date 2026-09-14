import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const repoRoot = process.cwd();
const desktopRoot = join(repoRoot, 'apps/emdash-desktop');
const failures = [];

function collectMarkdownFiles(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(child);
    return entry.isFile() && extname(entry.name) === '.md' ? [child] : [];
  });
}

function collectInstructionFiles(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (
      [
        '.checkouts',
        '.git',
        '.nx',
        'build',
        'coverage',
        'dist',
        'node_modules',
        'out',
        'release',
        'storybook-static',
      ].includes(entry.name)
    ) {
      return [];
    }
    const child = join(path, entry.name);
    if (entry.isDirectory()) return collectInstructionFiles(child);
    return entry.isFile() && entry.name === 'AGENTS.md' ? [child] : [];
  });
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function recordFailure(file, source, index, target, kind) {
  failures.push(
    `${relative(repoRoot, file)}:${lineNumber(source, index)}: missing ${kind} ${target}`
  );
}

function validateMarkdownLinks(file, source) {
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;

  for (const match of source.matchAll(linkPattern)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;

    const path = decodeURIComponent(target.split('#', 1)[0]);
    if (!path || existsSync(resolve(dirname(file), path))) continue;
    recordFailure(file, source, match.index, target, 'Markdown link target');
  }
}

function resolveSourceReference(file, target) {
  if (
    !target ||
    target.startsWith('@') ||
    target.includes('*') ||
    target.includes('<') ||
    target.includes('>') ||
    target.includes('...') ||
    target.includes(' ') ||
    target.includes('=') ||
    /^(?:https?:|[A-Z_]+$)/.test(target)
  ) {
    return undefined;
  }

  if (/^(?:apps|packages|agents|\.agents|\.github)\//.test(target)) {
    return resolve(repoRoot, target);
  }
  if (/^(?:src|drizzle|tooling|build)\//.test(target)) {
    return resolve(desktopRoot, target);
  }
  if (/^\.\.?(?:\/|$)/.test(target)) {
    return resolve(dirname(file), target);
  }
  if (
    ['AGENTS.md', 'CONTRIBUTING.md', 'LICENSE.md', 'README.md', 'nx.json', 'package.json'].includes(
      target
    )
  ) {
    return resolve(repoRoot, target);
  }
  return undefined;
}

function validateSourceReferences(file, source) {
  const withoutFences = source.replace(/```[\s\S]*?```/g, (fence) => fence.replace(/[^\n]/g, ' '));
  const codeSpanPattern = /`([^`\r\n]+)`/g;

  for (const match of withoutFences.matchAll(codeSpanPattern)) {
    const target = match[1].replace(/[.,:;]$/, '');
    const resolved = resolveSourceReference(file, target);
    if (!resolved || existsSync(resolved)) continue;
    recordFailure(file, source, match.index, target, 'source path');
  }
}

const files = [
  ...new Set([
    join(repoRoot, 'ROADMAP.md'),
    ...collectInstructionFiles(repoRoot),
    ...collectMarkdownFiles(join(repoRoot, 'agents')),
    ...collectMarkdownFiles(join(repoRoot, '.agents/skills')),
  ]),
].filter((file) => existsSync(file) && statSync(file).isFile());

function validateRoadmap(file, source) {
  for (const heading of ['## App Vision', '## Checklist Rules', '## Roadmap']) {
    if (!source.includes(heading)) failures.push(`${relative(repoRoot, file)}: missing ${heading}`);
  }

  const checklistItems = [...source.matchAll(/^- \[([ x])\] .+$/gm)];
  if (checklistItems.length === 0) {
    failures.push(`${relative(repoRoot, file)}: roadmap must contain checklist items`);
  }

  for (const [index, match] of checklistItems.entries()) {
    if (match[1] !== 'x') continue;
    if (!/\(completed \d{4}-\d{2}-\d{2}\)$/.test(match[0])) {
      failures.push(
        `${relative(repoRoot, file)}:${lineNumber(source, match.index)}: completed item needs a date`
      );
    }

    const nextItem = checklistItems[index + 1];
    const itemBlock = source.slice(match.index + match[0].length, nextItem?.index ?? source.length);
    if (!/^  - Evidence:/m.test(itemBlock)) {
      failures.push(
        `${relative(repoRoot, file)}:${lineNumber(source, match.index)}: completed item needs evidence`
      );
    }
  }
}

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  validateMarkdownLinks(file, source);
  validateSourceReferences(file, source);
  if (file === join(repoRoot, 'ROADMAP.md')) validateRoadmap(file, source);
}

if (failures.length > 0) {
  console.error(`Agent documentation validation failed:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} agent documentation files.`);
}
