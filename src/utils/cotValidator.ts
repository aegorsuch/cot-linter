import { XMLParser } from 'fast-xml-parser';

export type Platform =
  | 'ATAK-Civ'
  | 'CloudTAK'
  | 'iTAK'
  | 'TAK Aware'
  | 'TAKx'
  | 'WebTAK'
  | 'WinTAK';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlatformRule {
  tag: string;
  description: string;
}

export const PLATFORM_RULE_MATRIX: Record<Platform, PlatformRule[]> = {
  'ATAK-Civ': [
    { tag: 'contact', description: 'Callsign/label rendering in map views.' },
    { tag: '__group', description: 'Team and role grouping behavior.' },
  ],
  CloudTAK: [
    { tag: 'contact', description: 'Entity labeling in feed/event listings.' },
    { tag: 'takv', description: 'Client/version context for interoperability.' },
  ],
  iTAK: [
    { tag: 'contact', description: 'Callsign display on mobile maps.' },
    { tag: '__group', description: 'Team presentation consistency.' },
  ],
  'TAK Aware': [
    { tag: 'contact', description: 'User-friendly labeling in shared views.' },
    { tag: 'remarks', description: 'Additional event context text.' },
  ],
  TAKx: [
    { tag: 'takv', description: 'Producer metadata for routing/interop.' },
    { tag: '__group', description: 'Downstream grouping behavior.' },
  ],
  WebTAK: [
    { tag: 'contact', description: 'Map label readability in browser UI.' },
    { tag: '__group', description: 'Team affiliation visibility in UI panes.' },
  ],
  WinTAK: [
    { tag: 'usericon', description: 'Expected icon/symbol rendering.' },
    { tag: 'takv', description: 'Client metadata for diagnostics.' },
  ],
};

const PLATFORM_WARNING_MESSAGES: Record<Platform, Record<string, string>> = {
  'ATAK-Civ': {
    contact: 'Callsign/Label may not appear.',
    __group: 'Team/role visualization may be reduced.',
  },
  CloudTAK: {
    contact: 'Entity labels can be less useful in feeds.',
    takv: 'Client/version context is recommended for interoperability.',
  },
  iTAK: {
    contact: 'Callsign display may be limited.',
    __group: 'Team presentation may be inconsistent.',
  },
  'TAK Aware': {
    contact: 'User-friendly labeling may be reduced.',
    remarks: 'Supplemental context is recommended.',
  },
  TAKx: {
    takv: 'Producer metadata is recommended for multi-client routing.',
    __group: 'Downstream grouping behavior may vary.',
  },
  WebTAK: {
    contact: 'Map labels can be less informative.',
    __group: 'Team affiliation may not be clear in UI views.',
  },
  WinTAK: {
    usericon: 'Symbol may not render correctly.',
    takv: 'Client metadata is recommended for diagnostics.',
  },
};

export const validateCoT = (xmlString: string, platform: Platform): ValidationResult => {
  const parser = new XMLParser({ ignoreAttributes: false });
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  try {
    const jsonObj = parser.parse(xmlString);
    const event = jsonObj.event;

    if (!event) {
      result.errors.push("Missing root <event> tag.");
      result.isValid = false;
      return result;
    }

    // Basic Global CoT Rules
    const required = ['@_uid', '@_type', '@_lat', '@_lon', '@_time', '@_start', '@_stale'];
    required.forEach(attr => {
      if (!event[attr]) result.errors.push(`Missing mandatory attribute: ${attr.replace('@_', '')}`);
    });

    const detail = (event.detail ?? {}) as Record<string, unknown>;
    const rules = PLATFORM_RULE_MATRIX[platform];

    for (const rule of rules) {
      if (!detail[rule.tag]) {
        const message = PLATFORM_WARNING_MESSAGES[platform][rule.tag];
        result.warnings.push(`${platform}: Missing <${rule.tag}> tag. ${message}`);
      }
    }

    if (result.errors.length > 0) result.isValid = false;
    return result;

  } catch (e) {
    result.errors.push("Invalid XML format.");
    result.isValid = false;
    return result;
  }
};