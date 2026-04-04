import { nanoid } from "nanoid";

/**
 * Generates a unique, URL-friendly slug for investor share links
 */
export function generateShareSlug(): string {
  // Generate a 12-character URL-safe slug
  return nanoid(12);
}

/**
 * Generates a simple 6-digit access code
 */
export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Simple hash function for access codes
 * In production, use bcrypt or similar
 */
export async function hashAccessCode(code: string): Promise<string> {
  // For now, using a simple hash. In production, use proper hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies an access code against its hash
 */
export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  const codeHash = await hashAccessCode(code);
  return codeHash === hash;
}

/**
 * Generates the full public URL for an investor share link
 */
export function getInvestorShareUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/investor/${slug}`;
}

/**
 * Generates the full public URL for the investor monitor portal
 */
export function getInvestorMonitorUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/investor/monitor/${slug}`;
}

/**
 * Generates a unique slug for marketplace listings
 * Uses "mp-" prefix to distinguish from investor slugs
 */
export function generateMarketplaceSlug(): string {
  return `mp-${nanoid(10)}`;
}

/**
 * Generates the full public URL for a marketplace listing
 */
export function getMarketplaceListingUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/marketplace/${slug}`;
}
