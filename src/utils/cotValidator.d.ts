import type { Platform } from '../types/shared';
declare module './utils/cotValidator.mjs' {
  export interface MessageValidationProfile {
    id: string;
    label: string;
    sampleXml: string;
    platform: string;
    requiredEventAttributes?: string[];
    requiredDetailTags?: string[];
  }
  export const PLATFORM_RULE_MATRIX: Record<Platform, unknown[]>;
  export function getMissingTagsForAllPlatforms(
    xml: string,
    platforms: Platform[],
  ): {
    reports: Array<{
      platform: string;
      missingRules: Array<{ tag: string; description?: string }>;
    }>;
    parseError: null | { code: string; text?: string };
  };
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
export interface CrossPlatformMissingTagsResult {
  reports: Array<{
    platform: string;
    missingRules: Array<{ tag: string; description?: string }>;
  }>;
  parseError: null | { code: string; text?: string };
}
