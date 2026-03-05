import { XMLParser } from 'fast-xml-parser';

export type Platform = 'ATAK' | 'WinTAK' | 'iTAK';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

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

    // WinTAK Specific Rule
    if (platform === 'WinTAK' && !event.detail?.usericon) {
      result.warnings.push("WinTAK: Missing <usericon> tag. Symbol may not render correctly.");
    }

    // ATAK Specific Rule
    if (platform === 'ATAK' && !event.detail?.contact) {
      result.warnings.push("ATAK: Missing <contact> tag. Callsign/Label will not appear.");
    }

    if (result.errors.length > 0) result.isValid = false;
    return result;

  } catch (e) {
    result.errors.push("Invalid XML format.");
    result.isValid = false;
    return result;
  }
};