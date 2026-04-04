
/**
 * Parse a version string into major and minor components
 */
export function parseVersion(version: string): { major: number; minor: number } {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '1', 10),
    minor: parseInt(parts[1] || '0', 10)
  };
}

/**
 * Format a version from major and minor components
 */
export function formatVersion(major: number, minor: number): string {
  return `${major}.${minor}`;
}

/**
 * Check if a version is newer than another
 */
export function isNewerVersion(version1: string, version2: string): boolean {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);
  
  if (v1.major > v2.major) return true;
  if (v1.major < v2.major) return false;
  return v1.minor > v2.minor;
}

/**
 * Sort versions in ascending order
 */
export function sortVersions(versions: string[]): string[] {
  return versions.sort((a, b) => {
    const vA = parseVersion(a);
    const vB = parseVersion(b);
    
    if (vA.major !== vB.major) {
      return vA.major - vB.major;
    }
    return vA.minor - vB.minor;
  });
}

/**
 * Get the latest version from an array of versions
 */
export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;
  
  const sorted = sortVersions(versions);
  return sorted[sorted.length - 1];
}

/**
 * Generate a display name for a product version
 */
export function generateVersionDisplayName(baseName: string, version: string): string {
  // Remove existing version suffix if present
  const cleanName = baseName.replace(/\s*\(v\d+\.\d+\).*$/, '');
  return `${cleanName} (v${version})`;
}

/**
 * Extract base name from a versioned product name
 */
export function extractBaseName(versionedName: string): string {
  return versionedName.replace(/\s*\(v\d+\.\d+\).*$/, '');
}
