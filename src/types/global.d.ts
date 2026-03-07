declare module '*.mjs' {
  // Fallback for all .mjs imports
  const value: unknown;
  export default value;
}

declare module '*.css';
declare module '*.css' {
  const value: unknown;
  export default value;
}
declare module './utils/cotValidator.mjs' {
  import type { Platform } from '../types/shared';
  export type MessageValidationProfile = unknown;
  export const PLATFORM_RULE_MATRIX: Record<Platform, unknown[]>;
  export function getMissingTagsForAllPlatforms(
    xml: string,
    platforms: Platform[],
  ): Record<Platform, string[]>;
  export function validateCoT(
    xml: string,
    platform: Platform,
  ): {
    isValid: boolean;
    warnings: Array<{ code: string; text?: string }>;
    errors: Array<{ code: string; text?: string }>;
  };
  export function validateCoTWithProfile(
    xml: string,
    platform: Platform,
    profile: MessageValidationProfile,
  ): {
    isValid: boolean;
    warnings: Array<{ code: string; text?: string }>;
    errors: Array<{ code: string; text?: string }>;
  };
}