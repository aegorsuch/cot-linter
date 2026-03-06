import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type Platform =
  | 'ATAK'
  | 'CloudTAK'
  | 'Lattice'
  | 'Maven'
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

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ValidationMessage {
  code: string;
  text: string;
  location: SourceLocation;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
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

export interface PlatformMissingTagsReport {
  platform: Platform;
  missingRules: PlatformRule[];
}

export interface CrossPlatformMissingTagsResult {
  parseError: ValidationMessage | null;
  reports: PlatformMissingTagsReport[];
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
const ALLOWED_REPEATABLE_DETAIL_TAGS = new Set<string>(['link']);

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
    {
      tag: 'usericon',
      description: 'Icon rendering path for CloudTAK event presentation.',
      suggestionSnippet: '<usericon iconsetpath="COT_MAPPING_2525C/a-f-G-U-C.png" />',
    },
  ],
  Lattice: [
    {
      tag: 'contact',
      description: 'Entity/operator naming for track presentation.',
      suggestionSnippet: '<contact callsign="ODIN-LATTICE" />',
    },
    {
      tag: 'track',
      description: 'Kinematic context for moving track updates.',
      suggestionSnippet: '<track speed="0.00000000" course="0.00000000" />',
    },
    {
      tag: 'remarks',
      description: 'Operator-readable context for correlation workflows.',
      suggestionSnippet: '<remarks>Auto-ingested for Lattice correlation.</remarks>',
    },
  ],
  Maven: [
    {
      tag: 'contact',
      description: 'Track identity/callsign visibility in operator views.',
      suggestionSnippet: '<contact callsign="ODIN-MAVEN" />',
    },
    {
      tag: 'track',
      description: 'Motion/heading context for pattern tracking.',
      suggestionSnippet: '<track speed="0.00000000" course="0.00000000" />',
    },
    {
      tag: 'takv',
      description: 'Producer/version metadata for source attribution.',
      suggestionSnippet: '<takv device="Maven Gateway" os="Linux" version="1.0" />',
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
      suggestionSnippet: '<remarks></remarks>',
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

const ALL_PLATFORMS_SORTED: Platform[] = (Object.keys(PLATFORM_RULE_MATRIX) as Platform[]).sort(
  (a, b) => a.localeCompare(b),
);

const PLATFORM_SCHEMA_FRAGMENTS: Record<Platform, string> = {
  ATAK: '<xsd:element name="contact" minOccurs="1" /><xsd:element name="__group" minOccurs="1" />',
  CloudTAK:
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="takv" minOccurs="1" /><xsd:element name="usericon" minOccurs="1" />',
  Lattice:
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="track" minOccurs="1" /><xsd:element name="remarks" minOccurs="1" />',
  Maven:
    '<xsd:element name="contact" minOccurs="1" /><xsd:element name="track" minOccurs="1" /><xsd:element name="takv" minOccurs="1" />',
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
  severity: SeverityLevel,
  confidence: ConfidenceLevel,
  suggestion?: string,
): void => {
  result.errors.push({ code, text, location, severity, confidence, suggestion });
};

const pushWarning = (
  result: ValidationResult,
  code: string,
  text: string,
  location: SourceLocation,
  severity: SeverityLevel,
  confidence: ConfidenceLevel,
  suggestion?: string,
): void => {
  result.warnings.push({ code, text, location, severity, confidence, suggestion });
};

const parserOptions = {
  ignoreAttributes: false,
  preserveOrder: false,
  allowBooleanAttributes: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataTagName: '__cdata',
  commentTagName: '__comment',
  processEntities: false,
  stopNodes: ['event.detail'], // Prevent deep recursion in detail
  isArray: (name: string) => ['link', 'track'].includes(name),
};

const parseXmlForValidation = (
  xmlString: string,
): { parsed: ParsedCoT | null; parseError: ValidationMessage | null } => {
  const parserValidation = XMLValidator.validate(xmlString);
  if (parserValidation !== true) {
    const parseMessage = String(parserValidation.err.msg ?? 'Unknown parse error');
    const parseMessageLower = parseMessage.toLowerCase();
    const isDuplicateAttributeError =
      parseMessageLower.includes('attribute') &&
      (parseMessageLower.includes('duplicate') ||
        parseMessageLower.includes('repeated') ||
        parseMessageLower.includes('already'));

    return {
      parsed: null,
      parseError: {
        code: isDuplicateAttributeError ? 'XML_DUPLICATE_ATTRIBUTE' : 'XML_PARSE_ERROR',
        text: `Invalid XML format: ${parseMessage}`,
        location: { line: parserValidation.err.line, column: parserValidation.err.col },
        severity: 'critical',
        confidence: 'high',
        suggestion: isDuplicateAttributeError
          ? 'Remove duplicate attributes from the same XML element.'
          : 'Check unclosed/mismatched tags at the reported location.',
      },
    };
  }

  try {
    const parser = new XMLParser(parserOptions);
    return { parsed: parser.parse(xmlString) as ParsedCoT, parseError: null };
  } catch {
    return {
      parsed: null,
      parseError: {
        code: 'XML_PARSE_EXCEPTION',
        text: 'Invalid XML format: parser failed to process document.',
        location: ROOT_LOCATION,
        severity: 'critical',
        confidence: 'medium',
        suggestion: 'Confirm the XML is well-formed and retry.',
      },
    };
  }
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
      'critical',
      'high',
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
        'high',
        'high',
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
        'high',
        'high',
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
          'high',
          'high',
          `<point ${pointAttribute}="..." />`,
        );
      }
    }
  }
};

const parseTimestamp = (value: unknown): Date | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp);
};

const validateTimestampSanity = (
  xmlString: string,
  event: ParsedCoT['event'],
  result: ValidationResult,
): void => {
  if (!event) {
    return;
  }

  const rawTime = event[toAttr('time')];
  const rawStart = event[toAttr('start')];
  const rawStale = event[toAttr('stale')];

  const parsedTime = parseTimestamp(rawTime);
  const parsedStart = parseTimestamp(rawStart);
  const parsedStale = parseTimestamp(rawStale);

  if (rawTime && !parsedTime) {
    pushWarning(
      result,
      'TIMESTAMP_PARSE_WARNING',
      "Timestamp warning: <event> attribute 'time' is not a valid ISO timestamp.",
      findAttributeLocation(xmlString, 'event', 'time'),
      'medium',
      'high',
      '<event time="2026-03-05T12:00:00Z">',
    );
  }

  if (rawStart && !parsedStart) {
    pushWarning(
      result,
      'TIMESTAMP_PARSE_WARNING',
      "Timestamp warning: <event> attribute 'start' is not a valid ISO timestamp.",
      findAttributeLocation(xmlString, 'event', 'start'),
      'medium',
      'high',
      '<event start="2026-03-05T12:00:00Z">',
    );
  }

  if (rawStale && !parsedStale) {
    pushWarning(
      result,
      'TIMESTAMP_PARSE_WARNING',
      "Timestamp warning: <event> attribute 'stale' is not a valid ISO timestamp.",
      findAttributeLocation(xmlString, 'event', 'stale'),
      'medium',
      'high',
      '<event stale="2026-03-05T12:05:00Z">',
    );
  }

  if (parsedTime && parsedStale && parsedTime.getTime() > parsedStale.getTime()) {
    pushWarning(
      result,
      'TIMESTAMP_ORDER_WARNING',
      "Timestamp warning: 'time' should be earlier than or equal to 'stale'.",
      findAttributeLocation(xmlString, 'event', 'time'),
      'medium',
      'high',
      'Set stale >= time for valid event freshness windows.',
    );
  }

  if (parsedStart && parsedStale && parsedStart.getTime() > parsedStale.getTime()) {
    pushWarning(
      result,
      'TIMESTAMP_ORDER_WARNING',
      "Timestamp warning: 'start' should be earlier than or equal to 'stale'.",
      findAttributeLocation(xmlString, 'event', 'start'),
      'medium',
      'high',
      'Set stale >= start for valid event freshness windows.',
    );
  }

  if (parsedStale && parsedStale.getTime() < Date.now()) {
    pushWarning(
      result,
      'TIMESTAMP_STALE_IN_PAST',
      "Timestamp warning: 'stale' is already in the past.",
      findAttributeLocation(xmlString, 'event', 'stale'),
      'low',
      'high',
      'Set stale to a future time relative to event publication.',
    );
  }
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const getFirstTagObject = (
  detail: Record<string, unknown>,
  tag: string,
): Record<string, unknown> | null => {
  const rawValue = detail[tag];
  if (!rawValue) {
    return null;
  }

  if (Array.isArray(rawValue)) {
    return toRecord(rawValue[0]);
  }

  return toRecord(rawValue);
};

const parseFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasXmlAttribute = (tagObject: Record<string, unknown> | null, attribute: string): boolean => {
  if (!tagObject) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(tagObject, toAttr(attribute));
};

const hasDetailTag = (detail: Record<string, unknown>, tag: string): boolean => {
  return Object.prototype.hasOwnProperty.call(detail, tag);
};

const validatePointSemantics = (
  xmlString: string,
  event: ParsedCoT['event'],
  result: ValidationResult,
): void => {
  const point = event?.point;
  if (!point || typeof point !== 'object') {
    return;
  }

  const lat = parseFiniteNumber(point[toAttr('lat')]);
  const lon = parseFiniteNumber(point[toAttr('lon')]);
  const hae = parseFiniteNumber(point[toAttr('hae')]);
  const ce = parseFiniteNumber(point[toAttr('ce')]);
  const le = parseFiniteNumber(point[toAttr('le')]);

  if (lat === null) {
    pushWarning(
      result,
      'SEMANTIC_POINT_ATTR_NOT_NUMERIC',
      "Semantic warning: <point> attribute 'lat' should be numeric.",
      findAttributeLocation(xmlString, 'point', 'lat'),
      'high',
      'high',
      '<point lat="41.880025" ... />',
    );
  } else if (lat < -90 || lat > 90) {
    pushWarning(
      result,
      'SEMANTIC_POINT_RANGE_WARNING',
      `Semantic warning: latitude '${lat}' is outside valid range [-90, 90].`,
      findAttributeLocation(xmlString, 'point', 'lat'),
      'high',
      'high',
      'Use a latitude value between -90 and 90.',
    );
  }

  if (lon === null) {
    pushWarning(
      result,
      'SEMANTIC_POINT_ATTR_NOT_NUMERIC',
      "Semantic warning: <point> attribute 'lon' should be numeric.",
      findAttributeLocation(xmlString, 'point', 'lon'),
      'high',
      'high',
      '<point lon="-87.641793" ... />',
    );
  } else if (lon < -180 || lon > 180) {
    pushWarning(
      result,
      'SEMANTIC_POINT_RANGE_WARNING',
      `Semantic warning: longitude '${lon}' is outside valid range [-180, 180].`,
      findAttributeLocation(xmlString, 'point', 'lon'),
      'high',
      'high',
      'Use a longitude value between -180 and 180.',
    );
  }

  if (hae === null) {
    pushWarning(
      result,
      'SEMANTIC_POINT_ATTR_NOT_NUMERIC',
      "Semantic warning: <point> attribute 'hae' should be numeric.",
      findAttributeLocation(xmlString, 'point', 'hae'),
      'medium',
      'high',
      '<point hae="180.1" ... />',
    );
  } else if (hae < -1000 || hae > 100000) {
    pushWarning(
      result,
      'SEMANTIC_POINT_RANGE_WARNING',
      `Semantic warning: hae '${hae}' is outside expected bounds [-1000, 100000].`,
      findAttributeLocation(xmlString, 'point', 'hae'),
      'medium',
      'medium',
      'Confirm height-above-ellipsoid (hae) is realistic for the reported location.',
    );
  }

  if (ce === null) {
    pushWarning(
      result,
      'SEMANTIC_POINT_ATTR_NOT_NUMERIC',
      "Semantic warning: <point> attribute 'ce' should be numeric.",
      findAttributeLocation(xmlString, 'point', 'ce'),
      'medium',
      'high',
      '<point ce="13.0" ... />',
    );
  } else if (ce < 0 || ce > 100000) {
    pushWarning(
      result,
      'SEMANTIC_POINT_RANGE_WARNING',
      `Semantic warning: ce '${ce}' is outside expected bounds [0, 100000].`,
      findAttributeLocation(xmlString, 'point', 'ce'),
      'medium',
      'medium',
      'Use circular error (ce) as a non-negative, realistic sensor uncertainty.',
    );
  }

  if (le === null) {
    pushWarning(
      result,
      'SEMANTIC_POINT_ATTR_NOT_NUMERIC',
      "Semantic warning: <point> attribute 'le' should be numeric.",
      findAttributeLocation(xmlString, 'point', 'le'),
      'medium',
      'high',
      '<point le="1.0" ... />',
    );
  } else if (le < 0 || le > 100000) {
    pushWarning(
      result,
      'SEMANTIC_POINT_RANGE_WARNING',
      `Semantic warning: le '${le}' is outside expected bounds [0, 100000].`,
      findAttributeLocation(xmlString, 'point', 'le'),
      'medium',
      'medium',
      'Use linear error (le) as a non-negative, realistic sensor uncertainty.',
    );
  }
};

const validateTrackSemantics = (
  xmlString: string,
  detail: Record<string, unknown>,
  result: ValidationResult,
): void => {
  const track = getFirstTagObject(detail, 'track');
  if (!track) {
    return;
  }

  const speedRaw = track[toAttr('speed')];
  const courseRaw = track[toAttr('course')];
  const speed = parseFiniteNumber(speedRaw);
  const course = parseFiniteNumber(courseRaw);

  if (speedRaw === undefined) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_ATTR_MISSING',
      "Semantic warning: <track> is missing required attribute 'speed'.",
      findTagLocation(xmlString, 'track'),
      'medium',
      'high',
      '<track speed="0.00000000" course="0.00000000" />',
    );
  } else if (speed === null) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_ATTR_NOT_NUMERIC',
      "Semantic warning: <track> attribute 'speed' should be numeric.",
      findAttributeLocation(xmlString, 'track', 'speed'),
      'medium',
      'high',
      '<track speed="0.00000000" ... />',
    );
  } else if (speed < 0 || speed > 5000) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_RANGE_WARNING',
      `Semantic warning: speed '${speed}' is outside expected bounds [0, 5000].`,
      findAttributeLocation(xmlString, 'track', 'speed'),
      'medium',
      'medium',
      'Use a non-negative speed value in platform-expected units.',
    );
  }

  if (courseRaw === undefined) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_ATTR_MISSING',
      "Semantic warning: <track> is missing required attribute 'course'.",
      findTagLocation(xmlString, 'track'),
      'medium',
      'high',
      '<track speed="0.00000000" course="0.00000000" />',
    );
  } else if (course === null) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_ATTR_NOT_NUMERIC',
      "Semantic warning: <track> attribute 'course' should be numeric.",
      findAttributeLocation(xmlString, 'track', 'course'),
      'medium',
      'high',
      '<track ... course="0.00000000" />',
    );
  } else if (course < 0 || course > 360) {
    pushWarning(
      result,
      'SEMANTIC_TRACK_RANGE_WARNING',
      `Semantic warning: course '${course}' is outside valid range [0, 360].`,
      findAttributeLocation(xmlString, 'track', 'course'),
      'medium',
      'high',
      'Use a course value from 0 to 360 degrees.',
    );
  }
};

const validateDuplicateDetailTags = (
  xmlString: string,
  detail: Record<string, unknown>,
  result: ValidationResult,
): void => {
  for (const [tag, value] of Object.entries(detail)) {
    if (!Array.isArray(value)) {
      continue;
    }

    if (value.length < 2 || ALLOWED_REPEATABLE_DETAIL_TAGS.has(tag)) {
      continue;
    }

    pushWarning(
      result,
      'DUPLICATE_DETAIL_TAG',
      `Duplicate detail tag warning: <${tag}> appears ${value.length} times in <detail>.`,
      findTagLocation(xmlString, tag),
      'low',
      'high',
      `Keep a single <${tag}> in <detail> unless repeated tags are intentional.`,
    );
  }
};

const validateProfileFieldShape = (
  xmlString: string,
  profile: MessageValidationProfile,
  detail: Record<string, unknown>,
  result: ValidationResult,
): void => {
  if (profile.id === 'atak-manual-alert') {
    const link = getFirstTagObject(detail, 'link');
    const contact = getFirstTagObject(detail, 'contact');
    const emergency = getFirstTagObject(detail, 'emergency');

    if (hasDetailTag(detail, 'link')) {
      for (const attr of ['uid', 'type', 'relation']) {
        if (!hasXmlAttribute(link, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <link>.`,
            findAttributeLocation(xmlString, 'link', attr),
            'high',
            'high',
            `<link ${attr}="..." />`,
          );
        }
      }
    }

    if (hasDetailTag(detail, 'contact') && !hasXmlAttribute(contact, 'callsign')) {
      pushError(
        result,
        'PROFILE_FIELD_ATTR_MISSING',
        `Message profile '${profile.label}' requires attribute 'callsign' on <contact>.`,
        findAttributeLocation(xmlString, 'contact', 'callsign'),
        'high',
        'high',
        '<contact callsign="ODIN-ATAK" />',
      );
    }

    if (hasDetailTag(detail, 'emergency')) {
      if (!hasXmlAttribute(emergency, 'type')) {
        pushError(
          result,
          'PROFILE_FIELD_ATTR_MISSING',
          `Message profile '${profile.label}' requires attribute 'type' on <emergency>.`,
          findAttributeLocation(xmlString, 'emergency', 'type'),
          'high',
          'high',
          '<emergency type="911 Alert">ODIN-ATAK</emergency>',
        );
      }

      const emergencyRaw = detail.emergency;
      const emergencyText =
        typeof emergencyRaw === 'string'
          ? emergencyRaw
          : ((emergency?.['#text'] as string | undefined) ?? '');
      if (typeof emergencyText !== 'string' || emergencyText.trim() === '') {
        pushError(
          result,
          'PROFILE_FIELD_VALUE_INVALID',
          `Message profile '${profile.label}' expects non-empty text inside <emergency>.`,
          findTagLocation(xmlString, 'emergency'),
          'high',
          'high',
          '<emergency type="911 Alert">ODIN-ATAK</emergency>',
        );
      }
    }

    return;
  }

  if (profile.id === 'atak-manual-alert-clear') {
    const emergency = getFirstTagObject(detail, 'emergency');
    if (!hasDetailTag(detail, 'emergency')) {
      return;
    }

    const cancel = emergency?.[toAttr('cancel')];
    if (cancel !== 'true') {
      pushError(
        result,
        'PROFILE_FIELD_VALUE_INVALID',
        `Message profile '${profile.label}' requires <emergency cancel='true'>.`,
        findAttributeLocation(xmlString, 'emergency', 'cancel'),
        'high',
        'high',
        "<emergency cancel='true'>ODIN-ATAK</emergency>",
      );
    }

    const emergencyRaw = detail.emergency;
    const emergencyText =
      typeof emergencyRaw === 'string'
        ? emergencyRaw
        : ((emergency?.['#text'] as string | undefined) ?? '');
    if (typeof emergencyText !== 'string' || emergencyText.trim() === '') {
      pushError(
        result,
        'PROFILE_FIELD_VALUE_INVALID',
        `Message profile '${profile.label}' expects non-empty text inside <emergency>.`,
        findTagLocation(xmlString, 'emergency'),
        'high',
        'high',
        '<emergency cancel="true">ODIN-ATAK</emergency>',
      );
    }

    return;
  }

  if (profile.id === 'atak-milstd-2525d-drop') {
    const attributeRuleSet: Array<{ tag: string; requiredAttributes: string[] }> = [
      { tag: 'status', requiredAttributes: ['readiness'] },
      { tag: 'link', requiredAttributes: ['uid', 'production_time', 'type', 'parent_callsign', 'relation'] },
      { tag: 'contact', requiredAttributes: ['callsign'] },
      { tag: 'color', requiredAttributes: ['argb'] },
      { tag: 'precisionlocation', requiredAttributes: ['altsrc'] },
      { tag: 'usericon', requiredAttributes: ['iconsetpath'] },
    ];

    for (const rule of attributeRuleSet) {
      if (!hasDetailTag(detail, rule.tag)) {
        continue;
      }

      const tagObject = getFirstTagObject(detail, rule.tag);
      for (const attr of rule.requiredAttributes) {
        if (!hasXmlAttribute(tagObject, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <${rule.tag}>.`,
            findAttributeLocation(xmlString, rule.tag, attr),
            'high',
            'high',
            `<${rule.tag} ${attr}="..." />`,
          );
        }
      }
    }

    return;
  }

  if (profile.id === 'cloudtak-manual-alert') {
    const hasEmergencyTag = hasDetailTag(detail, 'emergency');
    const hasUsericonTag = hasDetailTag(detail, 'usericon');
    const hasContactTag = hasDetailTag(detail, 'contact');
    const hasTakvTag = hasDetailTag(detail, 'takv');

    const emergency = getFirstTagObject(detail, 'emergency');
    const usericon = getFirstTagObject(detail, 'usericon');
    const contact = getFirstTagObject(detail, 'contact');
    const takv = getFirstTagObject(detail, 'takv');

    if (hasEmergencyTag) {
      if (!hasXmlAttribute(emergency, 'type')) {
        pushError(
          result,
          'PROFILE_FIELD_ATTR_MISSING',
          `Message profile '${profile.label}' requires attribute 'type' on <emergency>.`,
          findAttributeLocation(xmlString, 'emergency', 'type'),
          'high',
          'high',
          '<emergency type="Manual Alert: Gunshot">...</emergency>',
        );
      }

      const emergencyRaw = detail.emergency;
      const emergencyText =
        typeof emergencyRaw === 'string'
          ? emergencyRaw
          : ((emergency?.['#text'] as string | undefined) ?? '');
      if (typeof emergencyText !== 'string' || emergencyText.trim() === '') {
        pushError(
          result,
          'PROFILE_FIELD_VALUE_INVALID',
          `Message profile '${profile.label}' expects non-empty text inside <emergency>.`,
          findTagLocation(xmlString, 'emergency'),
          'high',
          'high',
          '<emergency type="Manual Alert: Gunshot">ODIN-CLOUDTAK</emergency>',
        );
      }
    }

    if (hasUsericonTag && !hasXmlAttribute(usericon, 'iconsetpath')) {
      pushError(
        result,
        'PROFILE_FIELD_ATTR_MISSING',
        `Message profile '${profile.label}' requires attribute 'iconsetpath' on <usericon>.`,
        findAttributeLocation(xmlString, 'usericon', 'iconsetpath'),
        'high',
        'high',
        '<usericon iconsetpath="COT_MAPPING_2525C/b-a-o.png" />',
      );
    }

    if (hasContactTag && !hasXmlAttribute(contact, 'callsign')) {
      pushError(
        result,
        'PROFILE_FIELD_ATTR_MISSING',
        `Message profile '${profile.label}' requires attribute 'callsign' on <contact>.`,
        findAttributeLocation(xmlString, 'contact', 'callsign'),
        'high',
        'high',
        '<contact callsign="ODIN-CLOUDTAK" />',
      );
    }

    if (hasTakvTag) {
      for (const attr of ['device', 'os', 'version']) {
        if (!hasXmlAttribute(takv, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <takv>.`,
            findAttributeLocation(xmlString, 'takv', attr),
            'high',
            'high',
            `<takv ${attr}="..." />`,
          );
        }
      }
    }

    return;
  }

  if (profile.id === 'weartak-milstd-point' || profile.id === 'weartak-milstd-point-clear') {
    const attributeRuleSet: Array<{ tag: string; requiredAttributes: string[] }> = [
      { tag: 'status', requiredAttributes: ['readiness', 'battery'] },
      { tag: 'precisionlocation', requiredAttributes: ['altsrc'] },
      { tag: 'link', requiredAttributes: ['uid', 'production_time', 'type', 'parent_callsign', 'relation'] },
      { tag: 'color', requiredAttributes: ['argb'] },
      { tag: 'usericon', requiredAttributes: ['iconsetpath'] },
      { tag: 'contact', requiredAttributes: ['callsign'] },
    ];

    for (const rule of attributeRuleSet) {
      const hasTag = Object.prototype.hasOwnProperty.call(detail, rule.tag);
      if (!hasTag) {
        continue;
      }

      const tagObject = getFirstTagObject(detail, rule.tag);

      for (const attr of rule.requiredAttributes) {
        if (!hasXmlAttribute(tagObject, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <${rule.tag}>.`,
            findAttributeLocation(xmlString, rule.tag, attr),
            'high',
            'high',
            `<${rule.tag} ${attr}="..." />`,
          );
        }
      }
    }

    return;
  }

  if (profile.id === 'weartak-chat-send') {
    const chat = getFirstTagObject(detail, '__chat');
    const remarks = getFirstTagObject(detail, 'remarks');
    const hasRemarksTag = Boolean(detail.remarks);

    if (chat) {
      const requiredChatAttributes = ['parent', 'groupOwner', 'messageId', 'chatroom', 'id', 'senderCallsign'];
      for (const attr of requiredChatAttributes) {
        if (!hasXmlAttribute(chat, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <__chat>.`,
            findAttributeLocation(xmlString, '__chat', attr),
            'high',
            'high',
            `<__chat ${attr}="...">`,
          );
        }
      }

      const chatgrpRaw = chat.chatgrp;
      const chatgrp = Array.isArray(chatgrpRaw)
        ? toRecord(chatgrpRaw[0])
        : toRecord(chatgrpRaw);

      if (!chatgrp) {
        pushError(
          result,
          'PROFILE_FIELD_TAG_MISSING',
          `Message profile '${profile.label}' requires <chatgrp> inside <__chat>.`,
          findTagLocation(xmlString, '__chat'),
          'high',
          'high',
          '<chatgrp uid0="..." uid1="..." id="..." />',
        );
      } else {
        for (const attr of ['uid0', 'uid1', 'id']) {
          if (!hasXmlAttribute(chatgrp, attr)) {
            pushError(
              result,
              'PROFILE_FIELD_ATTR_MISSING',
              `Message profile '${profile.label}' requires attribute '${attr}' on <chatgrp>.`,
              findAttributeLocation(xmlString, 'chatgrp', attr),
              'high',
              'high',
              `<chatgrp ${attr}="..." />`,
            );
          }
        }
      }
    }

    if (hasRemarksTag) {
      for (const attr of ['source', 'to', 'time']) {
        if (!hasXmlAttribute(remarks, attr)) {
          pushError(
            result,
            'PROFILE_FIELD_ATTR_MISSING',
            `Message profile '${profile.label}' requires attribute '${attr}' on <remarks>.`,
            findAttributeLocation(xmlString, 'remarks', attr),
            'high',
            'high',
            `<remarks ${attr}="...">...</remarks>`,
          );
        }
      }
    }

    return;
  }

  if (profile.id === 'weartak-manual-alert-gunshot') {
    const emergency = getFirstTagObject(detail, 'emergency');
    if (!emergency) {
      return;
    }

    if (!hasXmlAttribute(emergency, 'type')) {
      pushError(
        result,
        'PROFILE_FIELD_ATTR_MISSING',
        `Message profile '${profile.label}' requires attribute 'type' on <emergency>.`,
        findAttributeLocation(xmlString, 'emergency', 'type'),
        'high',
        'high',
        '<emergency type="Manual Alert: ...">...</emergency>',
      );
    }

    const emergencyText = emergency['#text'];
    if (typeof emergencyText !== 'string' || emergencyText.trim() === '') {
      pushError(
        result,
        'PROFILE_FIELD_VALUE_INVALID',
        `Message profile '${profile.label}' expects non-empty text inside <emergency>.`,
        findTagLocation(xmlString, 'emergency'),
        'high',
        'high',
        '<emergency type="Manual Alert: Gunshot">ODIN-WEARTAK</emergency>',
      );
    }

    return;
  }

  if (profile.id === 'weartak-manual-alert-clear') {
    const emergency = getFirstTagObject(detail, 'emergency');
    if (!emergency) {
      return;
    }

    const cancel = emergency[toAttr('cancel')];
    if (cancel !== 'true') {
      pushError(
        result,
        'PROFILE_FIELD_VALUE_INVALID',
        `Message profile '${profile.label}' requires <emergency cancel='true'>.`,
        findAttributeLocation(xmlString, 'emergency', 'cancel'),
        'high',
        'high',
        "<emergency cancel='true'>ODIN-WEARTAK</emergency>",
      );
    }

    const emergencyText = emergency['#text'];
    if (typeof emergencyText !== 'string' || emergencyText.trim() === '') {
      pushError(
        result,
        'PROFILE_FIELD_VALUE_INVALID',
        `Message profile '${profile.label}' expects non-empty text inside <emergency>.`,
        findTagLocation(xmlString, 'emergency'),
        'high',
        'high',
        '<emergency cancel="true">ODIN-WEARTAK</emergency>',
      );
    }
  }
};

export const validateCoT = (xmlString: string, platform: Platform): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  const { parsed, parseError } = parseXmlForValidation(xmlString);
  if (parseError) {
    pushError(
      result,
      parseError.code,
      parseError.text,
      parseError.location,
      parseError.severity,
      parseError.confidence,
      parseError.suggestion,
    );
    result.isValid = false;
    return result;
  }

  try {
    if (!parsed) {
      result.isValid = false;
      return result;
    }

    const event = parsed.event;

    validateSchemaBackedStructure(xmlString, event, result);
    validateTimestampSanity(xmlString, event, result);
    validatePointSemantics(xmlString, event, result);

    const detail = (event?.detail ?? {}) as Record<string, unknown>;
    validateTrackSemantics(xmlString, detail, result);
    validateDuplicateDetailTags(xmlString, detail, result);
    const rules = PLATFORM_RULE_MATRIX[platform];

    // Platform schema fragments model per-platform detail requirements.
    const _schemaFragment = PLATFORM_SCHEMA_FRAGMENTS[platform];
    void _schemaFragment;

    for (const rule of rules) {
      if (!hasDetailTag(detail, rule.tag)) {
        const detailLocation = event?.detail
          ? findTagLocation(xmlString, 'detail')
          : findTagLocation(xmlString, 'event');

        pushWarning(
          result,
          'PLATFORM_TAG_MISSING',
          `${platform}: Missing <${rule.tag}> tag. ${rule.description}`,
          detailLocation,
          'medium',
          'medium',
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
      'critical',
      'medium',
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

  const parsedForProfile = parseXmlForValidation(xmlString);
  if (parsedForProfile.parseError || !parsedForProfile.parsed) {
    return result;
  }

  try {
    const parsed = parsedForProfile.parsed;
    const event = parsed.event;
    const detail = (event?.detail ?? {}) as Record<string, unknown>;
    const eventType = String(event?.['@_type'] ?? '');

    if (profile.expectedType && eventType !== profile.expectedType) {
      pushError(
        result,
        'PROFILE_EVENT_TYPE_MISMATCH',
        `Message profile '${profile.label}' expects type '${profile.expectedType}', found '${eventType || 'undefined'}'.`,
        findAttributeLocation(xmlString, 'event', 'type'),
        'high',
        'high',
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
          'high',
          'high',
          `<event ${attr}="...">`,
        );
      }
    }

    for (const tag of profile.requiredDetailTags) {
      if (!hasDetailTag(detail, tag)) {
        const detailLocation = event?.detail
          ? findTagLocation(xmlString, 'detail')
          : findTagLocation(xmlString, 'event');

        pushError(
          result,
          'PROFILE_DETAIL_TAG_MISSING',
          `Message profile '${profile.label}' requires <${tag}> inside <detail>.`,
          detailLocation,
          'high',
          'high',
          `<${tag}>...</${tag}>`,
        );
      }
    }

    validateProfileFieldShape(xmlString, profile, detail, result);

    if (result.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  } catch {
    return result;
  }
};

export const getMissingTagsForAllPlatforms = (xmlString: string): CrossPlatformMissingTagsResult => {
  const emptyReports = ALL_PLATFORMS_SORTED.map((platform) => ({
    platform,
    missingRules: [],
  }));

  if (!xmlString.trim()) {
    return { parseError: null, reports: emptyReports };
  }

  const { parsed, parseError } = parseXmlForValidation(xmlString);
  if (parseError || !parsed) {
    return { parseError, reports: emptyReports };
  }

  const detail = (parsed.event?.detail ?? {}) as Record<string, unknown>;
  const reports = ALL_PLATFORMS_SORTED.map((platform) => {
    const rules = PLATFORM_RULE_MATRIX[platform];
    const missingRules = rules.filter((rule) => !hasDetailTag(detail, rule.tag));
    return { platform, missingRules };
  });

  return { parseError: null, reports };
};
