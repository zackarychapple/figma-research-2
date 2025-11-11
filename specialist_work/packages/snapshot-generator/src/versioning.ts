import { ValidationError } from './types';

/**
 * Parses a SemVer version string into components.
 */
export interface SemVerComponents {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * Parses a SemVer version string.
 *
 * @param version - The version string to parse
 * @returns Parsed version components
 * @throws ValidationError if version is invalid
 */
export function parseSemVer(version: string): SemVerComponents {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  const match = version.match(semverRegex);
  if (!match) {
    throw new ValidationError(`Invalid SemVer version: '${version}'`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Compares two SemVer versions.
 *
 * @param v1 - First version
 * @param v2 - Second version
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareSemVer(v1: string, v2: string): number {
  const parsed1 = parseSemVer(v1);
  const parsed2 = parseSemVer(v2);

  // Compare major version
  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }

  // Compare minor version
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }

  // Compare patch version
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }

  // Compare prerelease
  if (parsed1.prerelease && !parsed2.prerelease) {
    return -1; // prerelease versions have lower precedence
  }
  if (!parsed1.prerelease && parsed2.prerelease) {
    return 1;
  }
  if (parsed1.prerelease && parsed2.prerelease) {
    return comparePrerelease(parsed1.prerelease, parsed2.prerelease);
  }

  // Versions are equal (build metadata is ignored in comparison)
  return 0;
}

/**
 * Compares two prerelease versions.
 */
function comparePrerelease(pre1: string, pre2: string): number {
  const parts1 = pre1.split('.');
  const parts2 = pre2.split('.');

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i];
    const part2 = parts2[i];

    // If one version has fewer parts, it has lower precedence
    if (part1 === undefined) return -1;
    if (part2 === undefined) return 1;

    // Compare numeric vs non-numeric identifiers
    const isNum1 = /^\d+$/.test(part1);
    const isNum2 = /^\d+$/.test(part2);

    if (isNum1 && isNum2) {
      const num1 = parseInt(part1, 10);
      const num2 = parseInt(part2, 10);
      if (num1 !== num2) {
        return num1 > num2 ? 1 : -1;
      }
    } else if (isNum1) {
      return -1; // numeric identifiers have lower precedence
    } else if (isNum2) {
      return 1;
    } else {
      // Compare alphabetically
      if (part1 !== part2) {
        return part1 > part2 ? 1 : -1;
      }
    }
  }

  return 0;
}

/**
 * Determines the type of version change between two versions.
 *
 * @param from - Previous version
 * @param to - New version
 * @returns Change type: 'major', 'minor', 'patch', or 'none'
 */
export function getVersionChangeType(
  from: string,
  to: string
): 'major' | 'minor' | 'patch' | 'none' {
  const parsed1 = parseSemVer(from);
  const parsed2 = parseSemVer(to);

  if (parsed2.major !== parsed1.major) {
    return 'major';
  }
  if (parsed2.minor !== parsed1.minor) {
    return 'minor';
  }
  if (parsed2.patch !== parsed1.patch) {
    return 'patch';
  }

  return 'none';
}

/**
 * Increments a version by the specified type.
 *
 * @param version - Current version
 * @param type - Type of increment: 'major', 'minor', or 'patch'
 * @returns New incremented version
 */
export function incrementVersion(
  version: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const parsed = parseSemVer(version);

  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      throw new ValidationError(`Invalid increment type: '${type}'`);
  }
}

/**
 * Checks if a version satisfies a range.
 * Supports simple ranges like '^1.0.0', '~1.2.0', '>=1.0.0', etc.
 *
 * @param version - Version to check
 * @param range - Version range
 * @returns true if version satisfies range
 */
export function satisfiesRange(version: string, range: string): boolean {
  // Handle exact match
  if (!range.match(/[~^><]/)) {
    return version === range;
  }

  // Handle caret range (^1.2.3 means >=1.2.3 <2.0.0)
  if (range.startsWith('^')) {
    const baseVersion = range.slice(1);
    const base = parseSemVer(baseVersion);
    const ver = parseSemVer(version);

    if (ver.major !== base.major) {
      return false;
    }
    if (base.major > 0) {
      return compareSemVer(version, baseVersion) >= 0 &&
             ver.major === base.major;
    }
    if (base.minor > 0) {
      return compareSemVer(version, baseVersion) >= 0 &&
             ver.major === base.major &&
             ver.minor === base.minor;
    }
    return compareSemVer(version, baseVersion) >= 0 &&
           ver.major === base.major &&
           ver.minor === base.minor &&
           ver.patch === base.patch;
  }

  // Handle tilde range (~1.2.3 means >=1.2.3 <1.3.0)
  if (range.startsWith('~')) {
    const baseVersion = range.slice(1);
    const base = parseSemVer(baseVersion);
    const ver = parseSemVer(version);

    return ver.major === base.major &&
           ver.minor === base.minor &&
           compareSemVer(version, baseVersion) >= 0;
  }

  // Handle comparison operators
  if (range.startsWith('>=')) {
    const baseVersion = range.slice(2).trim();
    return compareSemVer(version, baseVersion) >= 0;
  }
  if (range.startsWith('>')) {
    const baseVersion = range.slice(1).trim();
    return compareSemVer(version, baseVersion) > 0;
  }
  if (range.startsWith('<=')) {
    const baseVersion = range.slice(2).trim();
    return compareSemVer(version, baseVersion) <= 0;
  }
  if (range.startsWith('<')) {
    const baseVersion = range.slice(1).trim();
    return compareSemVer(version, baseVersion) < 0;
  }

  throw new ValidationError(`Unsupported version range: '${range}'`);
}

/**
 * Checks if a version is a prerelease version.
 *
 * @param version - Version to check
 * @returns true if version is prerelease
 */
export function isPrerelease(version: string): boolean {
  const parsed = parseSemVer(version);
  return parsed.prerelease !== undefined;
}

/**
 * Checks if a version is stable (not prerelease).
 *
 * @param version - Version to check
 * @returns true if version is stable
 */
export function isStable(version: string): boolean {
  return !isPrerelease(version);
}

/**
 * Gets the base version without prerelease or build metadata.
 *
 * @param version - Version string
 * @returns Base version (major.minor.patch)
 */
export function getBaseVersion(version: string): string {
  const parsed = parseSemVer(version);
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}
