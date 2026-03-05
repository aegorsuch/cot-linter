import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type Platform =
  | 'ATAK'
  | 'CloudTAK'
  | 'iTAK'
  | 'TAK Aware'
  | 'TAKx'
  | 'WearTAK'
  | 'WebTAK'
  | 'WinTAK';

export interface SourceLocation {
  line: number;
  column: number;
}

export interface ValidationMessage {
  code: string;
  text: string;
  location: SourceLocation;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export interface PlatformRule {
  tag: string;
  description: string;
  suggestionSnippet: string;
}

export interface MessageValidationProfile {
  id: string;
  platform: Platform;
  label: string;
  description: string;
  requiredDetailTags: string[];
  sampleXml: string;
  requiredEventAttributes?: string[];
  expectedType?: string;
}

type ParsedCoT = {
  event?: {
    [key: string]: unknown;
    point?: Record<string, unknown>;
    detail?: Record<string, unknown>;
  };
};

type SchemaFragment = {
  xsd: string;
  requiredEventAttributes: string[];
  requiredEventChildren: string[];
  requiredPointAttributes: string[];
};

const ROOT_LOCATION: SourceLocation = { line: 1, column: 1 };

const BASE_SCHEMA_FRAGMENT: SchemaFragment = {
  xsd: `<xsd:complexType name="eventType">
  <xsd:sequence>
    <xsd:element name="point" minOccurs="1" maxOccurs="1" />
    <xsd:element name="detail" minOccurs="1" maxOccurs="1" />
  </xsd:sequence>
  <xsd:attribute name="uid" use="required" />
  <xsd:attribute name="type" use="required" />
  <xsd:attribute name="time" use="required" />
  <xsd:attribute name="start" use="required" />
  <xsd:attribute name="stale" use="required" />
  <xsd:attribute name="how" use="required" />
</xsd:complexType>`,
  requiredEventAttributes: ['uid', 'type', 'time', 'start', 'stale', 'how'],
  requiredEventChildren: ['point', 'detail'],
  requiredPointAttributes: ['lat', 'lon', 'hae', 'ce', 'le'],
};

export const PLATFORM_RULE_MATRIX: Record<Platform, PlatformRule[]> = {
  ATAK: [
    {
      tag: 'contact',
      description: 'Callsign/label rendering in map views.',
      suggestionSnippet: '<contact callsign="ODIN-ATAK" />',
    },
    {
      tag: '__group',
      description: 'Team and role grouping behavior.',
      suggestionSnippet: '<__group name="Dark Green" role="K9" />',
    },
  ],
  CloudTAK: [
    {
      tag: 'contact',
      description: 'Entity labeling in feed/event listings.',
      suggestionSnippet: '<contact callsign="ODIN-CLOUDTAK" />',
    },
    {
      tag: 'takv',
      description: 'Client/version context for interoperability.',
      suggestionSnippet: '<takv device="Android" os="Android 14" version="5.0" />',
    },
  ],
  iTAK: [
    {
      tag: 'contact',
      description: 'Callsign display on mobile maps.',
      suggestionSnippet: '<contact callsign="ODIN-ITAK" />',
    },
    {
      tag: '__group',
      description: 'Team presentation consistency.',
      suggestionSnippet: '<__group name="Rescue" role="K9" />',
    },
  ],
  'TAK Aware': [
    {
      tag: 'contact',
      description: 'User-friendly labeling in shared views.',
      suggestionSnippet: '<contact callsign="ODIN-TAKAWARE" />',
    },
    {
      tag: 'remarks',
      description: 'Additional event context text.',
      suggestionSnippet: '<remarks>Initial report from mobile observer.</remarks>',
    },
  ],
  TAKx: [
    {
      tag: 'takv',
      description: 'Producer metadata for routing/interop.',
      suggestionSnippet: '<takv device="Gateway" os="Linux" version="2.1" />',
    },
    {
      tag: '__group',
      description: 'Downstream grouping behavior.',
      suggestionSnippet: '<__group name="Interop" role="K9" />',
    },
  ],
  WearTAK: [
    {
      tag: 'contact',
      description: 'Short-form callsign display in wearable UI.',
      suggestionSnippet: '<contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" />',
    },
    {
      tag: '__group',
      description: 'Team and role context in constrained layouts.',
      suggestionSnippet: '<__group name="Dark Green" role="K9" />',
    },
    {
      tag: 'track',
      description: 'Device movement context for wearable SA updates.',
      suggestionSnippet: '<track speed="0.00000000" course="0.00000000" />',
    },
  ],
  WebTAK: [
    {
      tag: 'contact',
      description: 'Map label readability in browser UI.',
      suggestionSnippet: '<contact callsign="ODIN-WEBTAK" />',
    },
    {
      tag: '__group',
      description: 'Team affiliation visibility in UI panes.',
      suggestionSnippet: '<__group name="Ops" role="K9" />',
    },
  ],
  WinTAK: [
    {
      tag: 'usericon',
      description: 'Expected icon/symbol rendering.',
      suggestionSnippet: '<usericon iconsetpath="COT_MAPPING_2525C/a-f-G-U-C.png" />',
    },
    {
      tag: 'takv',
      description: 'Client metadata for diagnostics.',
      suggestionSnippet: '<takv device="WinTAK" os="Windows 11" version="4.9" />',
    },
  ],
};

const PLATFORM_SCHEMA_FRAGMENTS: Record<Platform, string> = {
  ATAK: '<xsd:element name="contact" minOccurs="1" /><xsd:element name="__group" minOccurs="1" />',
  CloudTAK:
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="takv" minOccurs="1" />',
  iTAK: '<xsd:element name="contact" minOccurs="1" /><xsd:element name="__group" minOccurs="1" />',
  'TAK Aware':
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="remarks" minOccurs="1" />',
  TAKx: '<xsd:element name="takv" minOccurs="1" /><xsd:element name="__group" minOccurs="1" />',
  WearTAK:
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="__group" minOccurs="1" /><xsd:element name="track" minOccurs="1" />',
  WebTAK: '<xsd:element name="contact" minOccurs="1" /><xsd:element name="__group" minOccurs="1" />',
  WinTAK: '<xsd:element name="usericon" minOccurs="1" /><xsd:element name="takv" minOccurs="1" />',
};

const toLineCol = (source: string, index: number): SourceLocation => {
  if (index < 0) {
    return ROOT_LOCATION;
  }

  let line = 1;
  let column = 1;

  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

const findTagLocation = (source: string, tag: string): SourceLocation => {
  const regex = new RegExp(`<\\s*${tag}(\\s|>)`, 'i');
  const match = regex.exec(source);
  return toLineCol(source, match ? match.index : -1);
};

const findAttributeLocation = (source: string, tag: string, attribute: string): SourceLocation => {
  const tagRegex = new RegExp(`<\\s*${tag}[^>]*>`, 'i');
  const tagMatch = tagRegex.exec(source);

  if (!tagMatch) {
    return findTagLocation(source, tag);
  }

  const attrRegex = new RegExp(`\\b${attribute}\\s*=`, 'i');
  const attrMatch = attrRegex.exec(tagMatch[0]);

  if (!attrMatch) {
    return toLineCol(source, tagMatch.index);
  }

  return toLineCol(source, tagMatch.index + attrMatch.index);
};

const toAttr = (name: string): string => `@_${name}`;

const pushError = (
  result: ValidationResult,
  code: string,
  text: string,
  location: SourceLocation,
  suggestion?: string,
): void => {
  result.errors.push({ code, text, location, suggestion });
};

const pushWarning = (
  result: ValidationResult,
  code: string,
  text: string,
  location: SourceLocation,
  suggestion?: string,
): void => {
  result.warnings.push({ code, text, location, suggestion });
};

const validateSchemaBackedStructure = (
  xmlString: string,
  parsed: ParsedCoT['event'],
  result: ValidationResult,
): void => {
  const event = parsed;

  if (!event) {
    pushError(
      result,
      'SCHEMA_ROOT_EVENT_MISSING',
      'Schema violation: missing root <event> element.',
      ROOT_LOCATION,
      '<event uid="demo-uid" type="a-f-G-U-C" time="..." start="..." stale="..." how="m-g">...</event>',
    );
    return;
  }

  for (const attribute of BASE_SCHEMA_FRAGMENT.requiredEventAttributes) {
    if (!event[toAttr(attribute)]) {
      pushError(
        result,
        'SCHEMA_EVENT_ATTR_MISSING',
        `Schema violation: <event> is missing required attribute '${attribute}'.`,
        findAttributeLocation(xmlString, 'event', attribute),
        `<event ${attribute}="...">`,
      );
    }
  }

  for (const child of BASE_SCHEMA_FRAGMENT.requiredEventChildren) {
    if (!event[child]) {
      pushError(
        result,
        'SCHEMA_EVENT_CHILD_MISSING',
        `Schema violation: <event> must include a <${child}> child element.`,
        findTagLocation(xmlString, 'event'),
        `<${child}>...</${child}>`,
      );
    }
  }

  const point = event.point;

  if (point && typeof point === 'object') {
    for (const pointAttribute of BASE_SCHEMA_FRAGMENT.requiredPointAttributes) {
      if (!point[toAttr(pointAttribute)]) {
        pushError(
          result,
          'SCHEMA_POINT_ATTR_MISSING',
          `Schema violation: <point> is missing required attribute '${pointAttribute}'.`,
          findAttributeLocation(xmlString, 'point', pointAttribute),
          `<point ${pointAttribute}="..." />`,
        );
      }
    }
  }
};

export const validateCoT = (xmlString: string, platform: Platform): ValidationResult => {
  const parser = new XMLParser({ ignoreAttributes: false });
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Parse pass with source positions from XMLValidator for precise parser diagnostics.
  const parserValidation = XMLValidator.validate(xmlString);
  if (parserValidation !== true) {
    pushError(
      result,
      'XML_PARSE_ERROR',
      `Invalid XML format: ${parserValidation.err.msg}`,
      { line: parserValidation.err.line, column: parserValidation.err.col },
      'Check unclosed/mismatched tags at the reported location.',
    );
    result.isValid = false;
    return result;
  }

  try {
    const parsed = parser.parse(xmlString) as ParsedCoT;
    const event = parsed.event;

    validateSchemaBackedStructure(xmlString, event, result);

    const detail = (event?.detail ?? {}) as Record<string, unknown>;
    const rules = PLATFORM_RULE_MATRIX[platform];

    // Platform schema fragments model per-platform detail requirements.
    const _schemaFragment = PLATFORM_SCHEMA_FRAGMENTS[platform];
    void _schemaFragment;

    for (const rule of rules) {
      if (!detail[rule.tag]) {
        const detailLocation = event?.detail
          ? findTagLocation(xmlString, 'detail')
          : findTagLocation(xmlString, 'event');

        pushWarning(
          result,
          'PLATFORM_TAG_MISSING',
          `${platform}: Missing <${rule.tag}> tag. ${rule.description}`,
          detailLocation,
          rule.suggestionSnippet,
        );
      }
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  } catch {
    pushError(
      result,
      'XML_PARSE_EXCEPTION',
      'Invalid XML format: parser failed to process document.',
      ROOT_LOCATION,
      'Confirm the XML is well-formed and retry.',
    );
    result.isValid = false;
    return result;
  }
};

export const validateCoTWithProfile = (
  xmlString: string,
  platform: Platform,
  profile: MessageValidationProfile | null,
): ValidationResult => {
  const result = validateCoT(xmlString, platform);

  if (!profile || profile.platform !== platform) {
    return result;
  }

  const parserValidation = XMLValidator.validate(xmlString);
  if (parserValidation !== true) {
    return result;
  }

  const parser = new XMLParser({ ignoreAttributes: false });

  try {
    const parsed = parser.parse(xmlString) as ParsedCoT;
    const event = parsed.event;
    const detail = (event?.detail ?? {}) as Record<string, unknown>;
    const eventType = String(event?.['@_type'] ?? '');

    if (profile.expectedType && eventType !== profile.expectedType) {
      pushError(
        result,
        'PROFILE_EVENT_TYPE_MISMATCH',
        `Message profile '${profile.label}' expects type '${profile.expectedType}', found '${eventType || 'undefined'}'.`,
        findAttributeLocation(xmlString, 'event', 'type'),
        `<event type="${profile.expectedType}">`,
      );
    }

    for (const attr of profile.requiredEventAttributes ?? []) {
      if (!event?.[toAttr(attr)]) {
        pushError(
          result,
          'PROFILE_EVENT_ATTR_MISSING',
          `Message profile '${profile.label}' requires event attribute '${attr}'.`,
          findAttributeLocation(xmlString, 'event', attr),
          `<event ${attr}="...">`,
        );
      }
    }

    for (const tag of profile.requiredDetailTags) {
      if (!detail[tag]) {
        const detailLocation = event?.detail
          ? findTagLocation(xmlString, 'detail')
          : findTagLocation(xmlString, 'event');

        pushError(
          result,
          'PROFILE_DETAIL_TAG_MISSING',
          `Message profile '${profile.label}' requires <${tag}> inside <detail>.`,
          detailLocation,
          `<${tag}>...</${tag}>`,
        );
      }
    }

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  } catch {
    return result;
  }
};
