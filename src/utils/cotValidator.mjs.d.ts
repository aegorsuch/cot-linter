import type { Platform } from '../types/shared';

export interface MessageValidationProfile {
  id: string;
  label: string;
  sampleXml: string;
  platform: Platform;
  description?: string;
  requiredEventAttributes?: string[];
  requiredDetailTags?: string[];
}
export interface CrossPlatformMissingTagsResult {
  reports: Array<{
    platform: string;
    missingRules: Array<{ tag: string; description?: string }>;
  }>;
  parseError: null | { code: string; text?: string };
}

export const PLATFORM_RULE_MATRIX: Record<Platform, unknown[]>;
export function getMissingTagsForAllPlatforms(xml: string, platforms: Platform[]): CrossPlatformMissingTagsResult;
export function validateCoT(xml: string, platform: Platform): {
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
