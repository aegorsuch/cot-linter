// TypeScript type declarations removed. Types are now in src/types/cotValidatorTypes.d.ts



import { XMLParser, XMLValidator } from 'fast-xml-parser';
import rulesData from './cotValidationRules.json';



const PLATFORM_RULE_MATRIX = {
	...rulesData.platforms,
	Other: [],
};

function getMissingTagsForAllPlatforms(xml, platforms) {
	// Placeholder implementation: returns empty reports for each platform
	// Fallback: always require <usericon> for CloudTAK, WearTAK, ATAK
	return {
		reports: platforms.map(platform => {
			const missingRules = [];
			const parser = new XMLParser({ ignoreAttributes: false });
			const parsed = parser.parse(xml);
			const detail = parsed?.event?.detail || {};
			if (["CloudTAK", "WearTAK", "ATAK", "WinTAK"].includes(platform)) {
				if (!detail.usericon) {
					missingRules.push({ tag: "usericon" });
				}
			}
			if (["CloudTAK", "Maven", "TAKx", "WinTAK"].includes(platform)) {
				if (!detail.takv) {
					missingRules.push({ tag: "takv" });
				}
			}
			return {
				platform,
				missingRules,
			};
		}),
		parseError: null,
	};
}

const BASE_SCHEMA_FRAGMENT = {
	xsd: '',
	requiredEventAttributes: rulesData.coreSchema.requiredEventAttributes,
	requiredEventChildren: rulesData.coreSchema.requiredEventChildren,
	requiredPointAttributes: rulesData.coreSchema.requiredPointAttributes,
};

const ROOT_LOCATION = { line: 1, column: 1 };
const ALLOWED_REPEATABLE_DETAIL_TAGS = new Set(['link']);

const toLineCol = (source, index) => {
	if (index < 0) return ROOT_LOCATION;
	let line = 1, column = 1;
	for (let i = 0; i < index && i < source.length; i += 1) {
		if (source[i] === '\n') { line += 1; column = 1; } else { column += 1; }
	}
	return { line, column };
};

const findTagLocation = (source, tag) => {
	const regex = new RegExp(`<\\s*${tag}(\\s|>)`, 'i');
	const match = regex.exec(source);
	return toLineCol(source, match ? match.index : -1);
};

const findAttributeLocation = (source, tag, attribute) => {
	const tagRegex = new RegExp(`<\\s*${tag}[^>]*>`, 'i');
	const tagMatch = tagRegex.exec(source);
	if (!tagMatch) return findTagLocation(source, tag);
	const attrRegex = new RegExp(`\\b${attribute}\\s*=`, 'i');
	const attrMatch = attrRegex.exec(tagMatch[0]);
	if (!attrMatch) return toLineCol(source, tagMatch.index);
	return toLineCol(source, tagMatch.index + attrMatch.index);
};

const toAttr = (name) => `@_${name}`;

const pushError = (result, code, text, location, severity, confidence, suggestion) => {
	result.errors.push({ code, text, location, severity, confidence, suggestion });
};

const pushWarning = (result, code, text, location, severity, confidence, suggestion) => {
	result.warnings.push({ code, text, location, severity, confidence, suggestion });
};

const parserOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	allowBooleanAttributes: true,
	parseTagValue: true,
	parseAttributeValue: true,
	trimValues: true,
	cdataTagName: '__cdata',
	commentTagName: '__comment',
	processEntities: false,
	isArray: (jpath) => jpath.startsWith('event.detail'),
};

const parseXmlForValidation = (xmlString) => {
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
		return { parsed: parser.parse(xmlString), parseError: null };
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


// Helper: parse finite number
const parseFiniteNumber = (value) => {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}
	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const hasXmlAttribute = (tagObject, attribute) => {
	if (!tagObject) return false;
	const attrKey = toAttr(attribute);
	if (Object.prototype.hasOwnProperty.call(tagObject, attrKey)) {
		const val = tagObject[attrKey];
		return val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : true);
	}
	if (Object.prototype.hasOwnProperty.call(tagObject, attribute)) {
		const val = tagObject[attribute];
		return val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : true);
	}
	return false;
};

const hasDetailTag = (detail, tag) => {
	return Object.prototype.hasOwnProperty.call(detail, tag);
};

const validateSchemaBackedStructure = (xmlString, event, result) => {
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
				`<event> is missing required attribute '${attribute}'.`,
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
				`<event> must include a <${child}> child element.`,
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
					`<point> is missing required attribute '${pointAttribute}'.`,
					findAttributeLocation(xmlString, 'point', pointAttribute),
					'high',
					'high',
					`<point ${pointAttribute}="..." />`,
				);
			}
		}
	}
};

const parseTimestamp = (value) => {
	if (typeof value !== 'string') return null;
	const timestamp = Date.parse(value);
	if (Number.isNaN(timestamp)) return null;
	return new Date(timestamp);
};

const validateTimestampSanity = (xmlString, event, result) => {
	if (!event) return;
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
			"<event> attribute 'time' is not a valid ISO timestamp.",
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
			"<event> attribute 'start' is not a valid ISO timestamp.",
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
			"<event> attribute 'stale' is not a valid ISO timestamp.",
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
			"'time' should be earlier than or equal to 'stale'.",
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
			"'start' should be earlier than or equal to 'stale'.",
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
			"'stale' is already in the past.",
			findAttributeLocation(xmlString, 'event', 'stale'),
			'low',
			'high',
			'Set stale to a future time relative to event publication.',
		);
	}
};


const validateDetailDuplicates = (xmlString, result) => {
	const detailTagRegex = /\s*<detail[\s\S]*?<\/detail>/i;
	const detailMatch = detailTagRegex.exec(xmlString);
	if (detailMatch) {
		const detailContent = detailMatch[0].replace(/^\s*<detail\b[^>]*>/i, '').replace(/<\/detail>\s*$/i, '');
		const cleanedDetail = detailContent.replace(/<!--.*?-->/gs, '').replace(/<!\[CDATA\[.*?\]\]>/gs, '').replace(/\s+/g, ' ');
		const tagCount = {};
		const tagRegex = /<([a-zA-Z0-9_]+)(\s|>|\/)/g;
		let match;
		while ((match = tagRegex.exec(cleanedDetail)) !== null) {
			const tag = match[1];
			if (!ALLOWED_REPEATABLE_DETAIL_TAGS.has(tag)) {
				tagCount[tag] = (tagCount[tag] || 0) + 1;
			}
		}
		for (const tag in tagCount) {
			if (tagCount[tag] > 1) {
				pushWarning(
					result,
					'DUPLICATE_DETAIL_TAG',
					`<${tag}> appears ${tagCount[tag]} times in <detail>.`,
					findTagLocation(xmlString, tag),
					'medium',
					'medium',
					`<${tag}> appears ${tagCount[tag]} times in <detail>.`,
				);
			}
		}
	}
};

const validatePointSemantics = (xmlString, event, result) => {
	const point = event?.point;
	if (!point || typeof point !== 'object') return;
	const lat = parseFiniteNumber(point[toAttr('lat')]);
	const lon = parseFiniteNumber(point[toAttr('lon')]);
	const hae = parseFiniteNumber(point[toAttr('hae')]);
	const ce = parseFiniteNumber(point[toAttr('ce')]);
	const le = parseFiniteNumber(point[toAttr('le')]);
	const bounds = rulesData.semanticBounds;
	if (lat === null) {
		pushWarning(result, 'SEMANTIC_POINT_ATTR_NOT_NUMERIC', "<point> attribute 'lat' should be numeric.", findAttributeLocation(xmlString, 'point', 'lat'), 'high', 'high', '<point lat="41.880025" ... />');
	} else if (lat < bounds.lat.min || lat > bounds.lat.max) {
		pushWarning(result, 'SEMANTIC_POINT_RANGE_WARNING', `latitude '${lat}' is outside valid range [${bounds.lat.min}, ${bounds.lat.max}].`, findAttributeLocation(xmlString, 'point', 'lat'), 'high', 'high', `Use a latitude value between ${bounds.lat.min} and ${bounds.lat.max}.`);
	}
	if (lon === null) {
		pushWarning(result, 'SEMANTIC_POINT_ATTR_NOT_NUMERIC', "<point> attribute 'lon' should be numeric.", findAttributeLocation(xmlString, 'point', 'lon'), 'high', 'high', '<point lon="-87.641793" ... />');
	} else if (lon < bounds.lon.min || lon > bounds.lon.max) {
		pushWarning(result, 'SEMANTIC_POINT_RANGE_WARNING', `longitude '${lon}' is outside valid range [${bounds.lon.min}, ${bounds.lon.max}].`, findAttributeLocation(xmlString, 'point', 'lon'), 'high', 'high', `Use a longitude value between ${bounds.lon.min} and ${bounds.lon.max}.`);
	}
	if (hae === null) {
		pushWarning(result, 'SEMANTIC_POINT_ATTR_NOT_NUMERIC', "<point> attribute 'hae' should be numeric.", findAttributeLocation(xmlString, 'point', 'hae'), 'high', 'high', '<point hae="180.1" ... />');
	} else if (hae < bounds.hae.min || hae > bounds.hae.max) {
		pushWarning(result, 'SEMANTIC_POINT_RANGE_WARNING', `hae '${hae}' is outside valid range [${bounds.hae.min}, ${bounds.hae.max}].`, findAttributeLocation(xmlString, 'point', 'hae'), 'high', 'high', `Use a hae value between ${bounds.hae.min} and ${bounds.hae.max}.`);
	}
	if (ce === null) {
		pushWarning(result, 'SEMANTIC_POINT_ATTR_NOT_NUMERIC', "<point> attribute 'ce' should be numeric.", findAttributeLocation(xmlString, 'point', 'ce'), 'high', 'high', '<point ce="13.0" ... />');
	} else if (ce < bounds.ce.min || ce > bounds.ce.max) {
		pushWarning(result, 'SEMANTIC_POINT_RANGE_WARNING', `ce '${ce}' is outside valid range [${bounds.ce.min}, ${bounds.ce.max}].`, findAttributeLocation(xmlString, 'point', 'ce'), 'high', 'high', `Use a ce value between ${bounds.ce.min} and ${bounds.ce.max}.`);
	}
	if (le === null) {
		pushWarning(result, 'SEMANTIC_POINT_ATTR_NOT_NUMERIC', "<point> attribute 'le' should be numeric.", findAttributeLocation(xmlString, 'point', 'le'), 'high', 'high', '<point le="1.0" ... />');
	} else if (le < bounds.le.min || le > bounds.le.max) {
		pushWarning(result, 'SEMANTIC_POINT_RANGE_WARNING', `le '${le}' is outside valid range [${bounds.le.min}, ${bounds.le.max}].`, findAttributeLocation(xmlString, 'point', 'le'), 'high', 'high', `Use a le value between ${bounds.le.min} and ${bounds.le.max}.`);
	}
};

const validateCoT = (xmlString, platform) => {
	const { parsed, parseError } = parseXmlForValidation(xmlString);
	const result = { isValid: true, errors: [], warnings: [] };
	if (parseError) {
		result.errors.push(parseError);
		result.isValid = false;
		return result;
	}
	const event = parsed?.event;
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
		result.isValid = false;
		return result;
	}
	validateSchemaBackedStructure(xmlString, event, result);
	validateTimestampSanity(xmlString, event, result);
	validatePointSemantics(xmlString, event, result);

	if (event.detail && typeof event.detail === 'object') {
		validateDetailDuplicates(xmlString, result);
		// Track semantic checks
		const detail = event.detail;
		const tracks = detail.track;
		if (tracks) {
			const trackArray = Array.isArray(tracks) ? tracks : [tracks];
			for (const trackObj of trackArray) {
				const track = trackObj && typeof trackObj === 'object' ? trackObj : null;
				if (!track) continue;
				const speedRaw = track[toAttr('speed')];
				const courseRaw = track[toAttr('course')];
				const speed = parseFiniteNumber(speedRaw);
				const course = parseFiniteNumber(courseRaw);
				if (speedRaw === undefined) {
					pushWarning(result, 'SEMANTIC_TRACK_ATTR_MISSING', "<track> is missing required attribute 'speed'.", findTagLocation(xmlString, 'track'), 'medium', 'high', '<track speed="0.00000000" course="0.00000000" />');
				}
				if (speed === null) {
					pushWarning(result, 'SEMANTIC_TRACK_ATTR_NOT_NUMERIC', "<track> attribute 'speed' should be numeric.", findAttributeLocation(xmlString, 'track', 'speed'), 'medium', 'high', '<track speed="0.00000000" ... />');
				}
				if (speed !== null && (speed < 0 || speed > 5000)) {
					pushWarning(result, 'SEMANTIC_TRACK_RANGE_WARNING', `speed '${speed}' is outside expected bounds [0, 5000].`, findAttributeLocation(xmlString, 'track', 'speed'), 'medium', 'medium', 'Use a non-negative speed value in platform-expected units.');
				}
				if (courseRaw === undefined) {
					pushWarning(result, 'SEMANTIC_TRACK_ATTR_MISSING', "<track> is missing required attribute 'course'.", findTagLocation(xmlString, 'track'), 'medium', 'high', '<track speed="0.00000000" course="0.00000000" />');
				}
				if (course === null) {
					pushWarning(result, 'SEMANTIC_TRACK_ATTR_NOT_NUMERIC', "<track> attribute 'course' should be numeric.", findAttributeLocation(xmlString, 'track', 'course'), 'medium', 'high', '<track ... course="0.00000000" />');
				}
				if (course !== null && (course < 0 || course > 360)) {
					pushWarning(result, 'SEMANTIC_TRACK_RANGE_WARNING', `course '${course}' is outside valid range [0, 360].`, findAttributeLocation(xmlString, 'track', 'course'), 'medium', 'high', 'Use a course value from 0 to 360 degrees.');
				}
			}
		}
		// Platform rule checks
		for (const rule of PLATFORM_RULE_MATRIX[platform] || []) {
			if (!hasDetailTag(detail, rule.tag)) {
				const detailLocation = detail ? findTagLocation(xmlString, 'detail') : findTagLocation(xmlString, 'event');
				pushWarning(result, 'PLATFORM_TAG_MISSING', `${platform}: Missing <${rule.tag}> tag. ${rule.description}`, detailLocation, 'medium', 'medium', rule.suggestionSnippet);
			}
		}
		   // XML edge case detection (always emit errors for these cases)
				let criticalXmlError = false;
				if (/xmlns:/i.test(xmlString)) {
					pushError(result, 'XML_NAMESPACE_ERROR', 'XML contains a namespace declaration, which is not supported.', ROOT_LOCATION, 'critical', 'high');
					criticalXmlError = true;
				}
				if (/<!\[CDATA\[/i.test(xmlString)) {
					pushError(result, 'XML_CDATA_ERROR', 'XML contains a CDATA section, which is not supported.', ROOT_LOCATION, 'critical', 'high');
					criticalXmlError = true;
				}
				if (/<!--/.test(xmlString)) {
					pushError(result, 'XML_COMMENT_ERROR', 'XML contains a comment, which is not supported.', ROOT_LOCATION, 'critical', 'high');
					criticalXmlError = true;
				}
				if (/<!DOCTYPE/i.test(xmlString)) {
					pushError(result, 'XML_DTD_ERROR', 'XML contains a DTD declaration, which is not supported.', ROOT_LOCATION, 'critical', 'high');
					criticalXmlError = true;
				}
				// Deep nesting check
				const maxDepth = 50;
				let depth = 0, maxFound = 0;
				for (let i = 0; i < xmlString.length; i++) {
					if (xmlString[i] === '<' && xmlString[i+1] !== '/' && xmlString[i+1] !== '!' && xmlString[i+1] !== '?') depth++;
					if (xmlString[i] === '<' && xmlString[i+1] === '/') depth--;
					if (depth > maxFound) maxFound = depth;
				}
				if (maxFound > maxDepth) {
					pushError(result, 'XML_NESTING_ERROR', `XML nesting depth exceeds safe limit (${maxDepth}).`, ROOT_LOCATION, 'critical', 'high');
					criticalXmlError = true;
				}
				if (criticalXmlError) {
					result.isValid = false;
				}
	}
	result.isValid = result.errors.length === 0;
	return result;
};


const validateCoTWithProfile = (xmlString, platform, profile) => {
	const result = validateCoT(xmlString, platform);
	if (!profile || profile.platform !== platform) {
		return result;
	}
	const { parsed, parseError } = parseXmlForValidation(xmlString);
	if (parseError || !parsed) {
		return result;
	}
	let profileFieldError = false;
	try {
		const event = parsed.event;
		const detailRaw = event?.detail ?? {};
		let detail;
		if (Array.isArray(detailRaw)) {
			detail = detailRaw[0] ?? {};
		} else {
			detail = detailRaw;
		}
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
			profileFieldError = true;
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
				profileFieldError = true;
			}
		}
		for (const tag of profile.requiredDetailTags) {
			if (!hasDetailTag(detail, tag)) {
				const detailLocation = event?.detail ? findTagLocation(xmlString, 'detail') : findTagLocation(xmlString, 'event');
				pushError(
					result,
					'PROFILE_DETAIL_TAG_MISSING',
					`Message profile '${profile.label}' requires <${tag}> inside <detail>.`,
					detailLocation,
					'high',
					'high',
					`<${tag}>...</${tag}>`,
				);
				profileFieldError = true;
			}
		}
		// Unified strict attribute and value checks for all profiles
		const strictProfileFieldChecks = [
			{
				ids: ['atak-manual-alert'],
				rules: [
					{ tag: 'link', requiredAttributes: ['uid', 'type', 'relation'] },
					{ tag: 'contact', requiredAttributes: ['callsign'] },
					{ tag: 'emergency', requiredAttributes: ['type'], requireText: true },
				],
			},
			   {
				   ids: ['atak-milstd-2525d-drop'],
				   rules: [
					   { tag: 'status', requiredAttributes: ['readiness', 'battery'] },
					   { tag: 'link', requiredAttributes: ['uid', 'production_time', 'type', 'parent_callsign', 'relation'] },
					   { tag: 'contact', requiredAttributes: ['callsign'] },
					   { tag: 'color', requiredAttributes: ['argb'] },
					   { tag: 'precisionlocation', requiredAttributes: ['altsrc'] },
					   { tag: 'usericon', requiredAttributes: ['iconsetpath'] },
				   ],
			   },
			   {
				   ids: ['weartak-chat-send'],
				   rules: [
					   { tag: '__chat', requiredAttributes: ['parent', 'groupOwner', 'messageId', 'chatroom', 'id', 'senderCallsign'], nested: [
						   { tag: 'chatgrp', requiredAttributes: ['uid0', 'uid1', 'id'] }
					   ] },
					   { tag: 'link', requiredAttributes: ['uid', 'type', 'relation'] },
					   { tag: 'remarks', requiredAttributes: ['source', 'to', 'time'] },
				   ],
			   },
			{
				ids: ['cloudtak-manual-alert'],
				rules: [
					{ tag: 'emergency', requiredAttributes: ['type'], requireText: true },
					{ tag: 'usericon', requiredAttributes: ['iconsetpath'] },
					{ tag: 'contact', requiredAttributes: ['callsign'] },
					{ tag: 'takv', requiredAttributes: ['device', 'os', 'version'] },
				],
			},
			   {
				   ids: ['weartak-milstd-point'],
				   rules: [
					   { tag: 'status', requiredAttributes: ['readiness', 'battery'] },
					   { tag: 'link', requiredAttributes: ['uid', 'production_time', 'type', 'parent_callsign', 'relation'] },
					   { tag: 'contact', requiredAttributes: ['callsign'] },
					   { tag: 'color', requiredAttributes: ['argb'] },
					   { tag: 'precisionlocation', requiredAttributes: ['altsrc'] },
					   { tag: 'usericon', requiredAttributes: ['iconsetpath'] },
				   ],
			   },
			   {
				   ids: ['weartak-milstd-point-clear'],
				   rules: [
					   { tag: 'status', requiredAttributes: ['readiness', 'battery'] },
					   { tag: 'link', requiredAttributes: ['uid', 'production_time', 'type', 'parent_callsign', 'relation'] },
					   { tag: 'contact', requiredAttributes: ['callsign'] },
					   { tag: 'color', requiredAttributes: ['argb'] },
					   { tag: 'precisionlocation', requiredAttributes: ['altsrc'] },
					   { tag: 'usericon', requiredAttributes: ['iconsetpath'] },
				   ],
			   },
		];
		for (const profileCheck of strictProfileFieldChecks) {
			if (profileCheck.ids.includes(profile.id)) {
				   for (const rule of profileCheck.rules) {
					   if (!hasDetailTag(detail, rule.tag)) {
						   for (const attr of rule.requiredAttributes) {
							   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${rule.tag}>.`, findTagLocation(xmlString, rule.tag), 'high', 'high', `<${rule.tag} ${attr}="..." />`);
							   profileFieldError = true;
						   }
						   if (rule.requireText) {
							   pushError(result, 'PROFILE_FIELD_VALUE_INVALID', `Message profile '${profile.label}' expects non-empty text inside <${rule.tag}>.`, findTagLocation(xmlString, rule.tag), 'high', 'high', `<${rule.tag}>...</${rule.tag}>`);
							   profileFieldError = true;
						   }
						   continue;
					   }
					   const tagValues = detail[rule.tag];
					   const tagArray = Array.isArray(tagValues) ? tagValues : [tagValues];
					   for (const tagObj of tagArray) {
						   const tagObject = tagObj && typeof tagObj === 'object' ? tagObj : null;
						   if (!tagObject) {
							   for (const attr of rule.requiredAttributes) {
								   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${rule.tag}>.`, findTagLocation(xmlString, rule.tag), 'high', 'high', `<${rule.tag} ${attr}="..." />`);
								   profileFieldError = true;
							   }
							   if (rule.requireText) {
								   pushError(result, 'PROFILE_FIELD_VALUE_INVALID', `Message profile '${profile.label}' expects non-empty text inside <${rule.tag}>.`, findTagLocation(xmlString, rule.tag), 'high', 'high', `<${rule.tag}>...</${rule.tag}>`);
								   profileFieldError = true;
							   }
							   continue;
						   }
						   for (const attr of rule.requiredAttributes) {
							   if (!hasXmlAttribute(tagObject, attr) || String(tagObject[toAttr(attr)] ?? '').trim() === '') {
								   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${rule.tag}>.`, findAttributeLocation(xmlString, rule.tag, attr), 'high', 'high', `<${rule.tag} ${attr}="..." />`);
								   profileFieldError = true;
							   }
						   }
						   if (rule.requireText) {
							   const tagText = typeof tagObj === 'string' ? tagObj : ((tagObject && tagObject['#text']) || '');
							   if (typeof tagText !== 'string' || tagText.trim() === '') {
								   pushError(result, 'PROFILE_FIELD_VALUE_INVALID', `Message profile '${profile.label}' expects non-empty text inside <${rule.tag}>.`, findTagLocation(xmlString, rule.tag), 'high', 'high', `<${rule.tag}>...</${rule.tag}>`);
								   profileFieldError = true;
							   }
						   }
						   // Nested tag checks for __chat
						   if (rule.nested && tagObject) {
							   for (const nestedRule of rule.nested) {
								   if (!hasDetailTag(tagObject, nestedRule.tag)) {
									   for (const attr of nestedRule.requiredAttributes) {
										   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${nestedRule.tag}>.`, findTagLocation(xmlString, nestedRule.tag), 'high', 'high', `<${nestedRule.tag} ${attr}="..." />`);
										   profileFieldError = true;
									   }
									   continue;
								   }
								   const nestedTagValues = tagObject[nestedRule.tag];
								   const nestedTagArray = Array.isArray(nestedTagValues) ? nestedTagValues : [nestedTagValues];
								   for (const nestedTagObj of nestedTagArray) {
									   const nestedTagObject = nestedTagObj && typeof nestedTagObj === 'object' ? nestedTagObj : null;
									   if (!nestedTagObject) {
										   for (const attr of nestedRule.requiredAttributes) {
											   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${nestedRule.tag}>.`, findTagLocation(xmlString, nestedRule.tag), 'high', 'high', `<${nestedRule.tag} ${attr}="..." />`);
											   profileFieldError = true;
										   }
										   continue;
									   }
									   for (const attr of nestedRule.requiredAttributes) {
										   if (!hasXmlAttribute(nestedTagObject, attr) || String(nestedTagObject[toAttr(attr)] ?? '').trim() === '') {
											   pushError(result, 'PROFILE_FIELD_ATTR_MISSING', `Message profile '${profile.label}' requires attribute '${attr}' on <${nestedRule.tag}>.`, findAttributeLocation(xmlString, nestedRule.tag, attr), 'high', 'high', `<${nestedRule.tag} ${attr}="..." />`);
											   profileFieldError = true;
										   }
									   }
								   }
							   }
						   }
					   }
				   }
			}
		}

		// --- ENFORCE isValid = false if any profile field shape or XML edge case errors ---
		const xmlEdgeCaseErrorCodes = [
			'XML_NAMESPACE_ERROR',
			'XML_CDATA_ERROR',
			'XML_COMMENT_ERROR',
			'XML_DTD_ERROR',
			'XML_NESTING_ERROR',
		];
		const hasXmlEdgeCaseError = result.errors.some(e => xmlEdgeCaseErrorCodes.includes(e.code));
		if (profileFieldError || hasXmlEdgeCaseError) {
			result.isValid = false;
		} else {
			result.isValid = result.errors.length === 0;
		}
		return result;
	} catch {
		return result;
	}
};

export { validateCoT, validateCoTWithProfile, PLATFORM_RULE_MATRIX, getMissingTagsForAllPlatforms };
