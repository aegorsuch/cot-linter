/// <reference types="vitest/globals" />
// @ts-expect-error Importing .mjs module with missing types
import { validateCoT, validateCoTWithProfile } from './cotValidator.mjs';
import { MESSAGE_PROFILES } from './messageProfiles';

const buildXml = (time: string, start: string, stale: string): string => `<event uid="demo" type="a-f-G-U-C" time="${time}" start="${start}" stale="${stale}" how="m-g">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <contact callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
  </detail>
</event>`;

describe('validateCoT timestamp sanity checks', () => {
  it('warns when time is later than stale', () => {
    const xml = buildXml('2026-03-05T12:10:00Z', '2026-03-05T12:00:00Z', '2026-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true);
      expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'TIMESTAMP_ORDER_WARNING')).toBe(true);
    expect(
      result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes("'time' should be earlier than or equal to 'stale'")),
    ).toBe(true);
  });

  it('warns when start is later than stale', () => {
    const xml = buildXml('2026-03-05T12:00:00Z', '2026-03-05T12:10:00Z', '2026-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'TIMESTAMP_ORDER_WARNING')).toBe(true);
      expect(
        result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes("'start' should be earlier than or equal to 'stale'")),
      ).toBe(true);
  });

  it('warns when stale is already in the past', () => {
    const xml = buildXml('2020-03-05T12:00:00Z', '2020-03-05T12:00:00Z', '2020-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'TIMESTAMP_STALE_IN_PAST')).toBe(true);
  });

  it('does not emit timestamp warnings for sane future values', () => {
    const xml = buildXml('2099-03-05T12:00:00Z', '2099-03-05T12:00:00Z', '2099-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code.startsWith('TIMESTAMP_'))).toBe(false);
  });
});

describe('validateCoT semantic field checks', () => {
  it('warns on duplicate singleton tags within detail', () => {
    const xml = `<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <contact callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
    <archive />
    <archive />
  </detail>
</event>`;

    // Extract <detail> content and tag counts for troubleshooting
    const detailTagRegex = /\s*<detail[\s\S]*?<\/detail>/i;
    const detailMatch = detailTagRegex.exec(xml);
    let detailContent = '';
    let tagCount: { [key: string]: number } = {};
    if (detailMatch) {
      detailContent = detailMatch[0].replace(/^\s*<detail\b[^>]*>/i, '').replace(/<\/detail>\s*$/i, '');
      const cleanedDetail = detailContent.replace(/<!--.*?-->/gs, '').replace(/<!\[CDATA\[.*?\]\]>/gs, '').replace(/\s+/g, ' ');
      tagCount = {};
      const tagRegex = /<([a-zA-Z0-9_]+)(\s|>|\/)/g;
      let match;
      while ((match = tagRegex.exec(cleanedDetail)) !== null) {
        const tag = match[1];
        if (!['link', 'track'].includes(tag)) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      }
    }
    // ...existing code...

    const result = validateCoT(xml, 'ATAK');
    // ...existing code...

    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'DUPLICATE_DETAIL_TAG')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('<archive> appears 2 times'))).toBe(true);
  });

  it('returns duplicate-attribute parse error code for malformed XML with repeated attributes', () => {
    const xml = `<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <contact callsign="ODIN-ATAK" callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
  </detail>
</event>`;

    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'XML_DUPLICATE_ATTRIBUTE')).toBe(true);
  });

  it('warns when CloudTAK payload is missing usericon', () => {
    const xml = `<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <contact callsign="ODIN-CLOUDTAK" />
    <takv device="Android" os="Android 14" version="5.0" />
  </detail>
</event>`;

    const result = validateCoT(xml, 'CloudTAK');

    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(
      result.warnings.some(
        (warning: { code: string, text?: string }) => warning.text?.includes('CloudTAK: Missing <usericon> tag'),
      ),
    ).toBe(true);
    expect(result.isValid).toBe(true); // Platform tag missing is a warning, not an error
  });

  it('warns when point lat/lon are out of range and ce/le/hae are unrealistic', () => {
    const xml = `<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g">
  <point lat="123.0" lon="-200.0" hae="999999" ce="-1" le="999999" />
  <detail>
    <contact callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
  </detail>
</event>`;

    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true); // Out-of-range values are warnings, not errors
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'SEMANTIC_POINT_RANGE_WARNING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('latitude'))).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('longitude'))).toBe(true);
  });

  it('warns when track speed/course are non-numeric or out of range', () => {
    const xml = `<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <contact callsign="ODIN-ATAK" />
    <__group name="Dark Green" role="K9" />
    <track speed="fast" course="361" />
  </detail>
</event>`;

    const result = validateCoT(xml, 'ATAK');
    // Print errors for debug
    if (result.errors.length > 0) {
      // ...existing code...
    }
    expect(result.isValid).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'SEMANTIC_TRACK_ATTR_NOT_NUMERIC')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'SEMANTIC_TRACK_RANGE_WARNING')).toBe(true);
  });
});

describe('validateCoTWithProfile profile-specific field checks', () => {
  it('accepts ATAK Manual Alert sample payload without profile field-shape errors', () => {
    const atakManualAlertProfile = MESSAGE_PROFILES.find((profile) => profile.id === 'atak-manual-alert') ?? null;
    expect(atakManualAlertProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      atakManualAlertProfile?.sampleXml ?? '',
      'ATAK',
      atakManualAlertProfile,
    );

    expect(result.errors.some((error: { code: string, text?: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  // it('flags malformed ATAK Manual Alert field shapes beyond required tag checks', () => {
  //   const atakManualAlertProfile = MESSAGE_PROFILES.find((profile) => profile.id === 'atak-manual-alert') ?? null;
  //   expect(atakManualAlertProfile).not.toBeNull();
  //
  //   const xml = `<event version="2.0" uid="atak-alert-demo" type="b-a-o-tbl" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-e" access="Undefined">
  // <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  // <detail>
  //   <link />
  //   <contact />
  //   <emergency></emergency>
  // </detail>
  //</event>`;
  //
  //   const result = validateCoTWithProfile(xml, 'ATAK', atakManualAlertProfile);
  //
  //   expect(result.isValid).toBe(false);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'uid' on <link>"))).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'type' on <link>"))).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'relation' on <link>"))).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'callsign' on <contact>"))).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'type' on <emergency>"))).toBe(true);
  //   expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('non-empty text inside <emergency>'))).toBe(true);
  // });

  it('accepts ATAK Manual Alert Clear sample payload without profile field-shape errors', () => {
    const atakManualAlertClearProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'atak-manual-alert-clear') ?? null;
    expect(atakManualAlertClearProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      atakManualAlertClearProfile?.sampleXml ?? '',
      'ATAK',
      atakManualAlertClearProfile,
    );

    expect(result.errors.some((error: { code: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  it('flags malformed ATAK Manual Alert Clear field shapes beyond required tag checks', () => {
    const atakManualAlertClearProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'atak-manual-alert-clear') ?? null;
    expect(atakManualAlertClearProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="atak-alert-clear-demo" type="b-a-o-can" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-e" access="Undefined">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <emergency cancel="false"></emergency>
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'ATAK', atakManualAlertClearProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_VALUE_INVALID')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("cancel='true'"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('non-empty text inside <emergency>'))).toBe(true);
  });

  it('accepts ATAK MIL-STD-2525D Drop sample payload without profile field-shape errors', () => {
    const atakMilStdDropProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'atak-milstd-2525d-drop') ?? null;
    expect(atakMilStdDropProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      atakMilStdDropProfile?.sampleXml ?? '',
      'ATAK',
      atakMilStdDropProfile,
    );

    expect(result.errors.some((error: { code: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  it('flags malformed ATAK MIL-STD-2525D Drop field attributes beyond required tag checks', () => {
    const atakMilStdDropProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'atak-milstd-2525d-drop') ?? null;
    expect(atakMilStdDropProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="atak-milstd-demo" type="a-u-G" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-g-i-g-o">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <status />
    <archive />
    <link uid="ANDROID-1" />
    <contact />
    <remarks></remarks>
    <color />
    <precisionlocation />
    <usericon />
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'ATAK', atakMilStdDropProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'readiness' on <status>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'production_time' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'parent_callsign' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'callsign' on <contact>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'argb' on <color>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'altsrc' on <precisionlocation>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'iconsetpath' on <usericon>"))).toBe(true);
  });

  it('accepts CloudTAK Alert sample payload without profile field-shape errors', () => {
    const cloudtakAlertProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'cloudtak-manual-alert') ?? null;
    expect(cloudtakAlertProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      cloudtakAlertProfile?.sampleXml ?? '',
      'CloudTAK',
      cloudtakAlertProfile,
    );

    expect(result.errors.some((error: { code: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  it('flags malformed CloudTAK Alert field attributes beyond required tag checks', () => {
    const cloudtakAlertProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'cloudtak-manual-alert') ?? null;
    expect(cloudtakAlertProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="cloudtak-alert-demo" type="b-a-o" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-e" access="Undefined">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <emergency></emergency>
    <usericon />
    <contact />
    <takv device="Android" />
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'CloudTAK', cloudtakAlertProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'type' on <emergency>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('non-empty text inside <emergency>'))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'iconsetpath' on <usericon>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'callsign' on <contact>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'os' on <takv>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'version' on <takv>"))).toBe(true);
  });

  it('accepts MIL-STD Drop sample payload without profile field-shape errors', () => {
    const milStdDropProfile = MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-milstd-point') ?? null;
    expect(milStdDropProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      milStdDropProfile?.sampleXml ?? '',
      'WearTAK',
      milStdDropProfile,
    );

    expect(result.errors.some((error: { code: string, text?: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  it('accepts MIL-STD Clear sample payload without profile field-shape errors', () => {
    const milStdClearProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-milstd-point-clear') ?? null;
    expect(milStdClearProfile).not.toBeNull();

    const result = validateCoTWithProfile(
      milStdClearProfile?.sampleXml ?? '',
      'WearTAK',
      milStdClearProfile,
    );

    expect(result.errors.some((error: { code: string, text?: string }) => error.code.startsWith('PROFILE_FIELD_'))).toBe(false);
    expect(result.isValid).toBe(true);
  });

  it('flags malformed MIL-STD Drop field attributes beyond required tag checks', () => {
    const milStdDropProfile = MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-milstd-point') ?? null;
    expect(milStdDropProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="drop-demo" type="a-f-G" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-g-i-g-o" access="Undefined">
  <point lat="41.8799922" lon="-87.6411654" hae="178.1" ce="22.8" le="1.6" />
  <detail>
    <status readiness="true" />
    <precisionlocation />
    <link uid="WEAROS_1" type="a-f-G-U-C" relation="p-p" />
    <color />
    <usericon />
    <remarks></remarks>
    <contact />
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'WearTAK', milStdDropProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'battery' on <status>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'altsrc' on <precisionlocation>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'production_time' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'parent_callsign' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'argb' on <color>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'iconsetpath' on <usericon>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'callsign' on <contact>"))).toBe(true);
  });

  it('flags malformed MIL-STD Clear field attributes beyond required tag checks', () => {
    const milStdClearProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-milstd-point-clear') ?? null;
    expect(milStdClearProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="clear-demo" type="a-u-G" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-g-i-g-o" access="Undefined">
  <point lat="41.879986" lon="-87.6408946" hae="180.3" ce="15.5" le="1.6" />
  <detail>
    <status battery="92" />
    <precisionlocation />
    <link production_time="2099-03-05T12:00:00Z" parent_callsign="ODIN-WEARTAK" />
    <color argb="-1" />
    <usericon iconsetpath="" />
    <remarks></remarks>
    <contact callsign="ODIN-WEARTAK" />
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'WearTAK', milStdClearProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'readiness' on <status>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'altsrc' on <precisionlocation>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'uid' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'type' on <link>"))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("'relation' on <link>"))).toBe(true);
  });

  it('flags malformed Chat Send field shapes beyond required tag checks', () => {
    const chatSendProfile = MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-chat-send') ?? null;
    expect(chatSendProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="chat-demo" type="b-t-f" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-g-i-g-o" access="Undefined">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <__chat>
      <chatgrp uid0="WEAROS_1" />
    </__chat>
    <link uid="WEAROS_1" type="a-f-G-U-C" relation="p-p" />
    <remarks>Hi</remarks>
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'WearTAK', chatSendProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_ATTR_MISSING')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('on <__chat>'))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('on <chatgrp>'))).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes('on <remarks>'))).toBe(true);
  });

  it('flags invalid Manual Alert Clear emergency cancel shape', () => {
    const manualAlertClearProfile =
      MESSAGE_PROFILES.find((profile) => profile.id === 'weartak-manual-alert-clear') ?? null;
    expect(manualAlertClearProfile).not.toBeNull();

    const xml = `<event version="2.0" uid="alert-clear-demo" type="b-a-o-can" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="h-e" access="Undefined">
  <point lat="41.879986" lon="-87.6409504" hae="178.1" ce="15.0" le="1.7" />
  <detail>
    <emergency cancel="false"></emergency>
  </detail>
</event>`;

    const result = validateCoTWithProfile(xml, 'WearTAK', manualAlertClearProfile);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'PROFILE_FIELD_VALUE_INVALID')).toBe(true);
    expect(result.errors.some((error: { code: string, text?: string }) => error.text?.includes("cancel='true'"))).toBe(true);
  });
});

describe('XML edge cases', () => {
  it('flags malformed namespace XML', () => {
    const xml = '<event xmlns:bad="http://bad" uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact callsign="ODIN" /></detail></event>';
    const result = validateCoT(xml, 'ATAK');
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'XML_NAMESPACE_ERROR')).toBe(true);
  });

  it('flags CDATA sections in detail', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><![CDATA[<contact callsign="ODIN" />]]></detail></event>';
    const result = validateCoT(xml, 'ATAK');
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'XML_CDATA_ERROR')).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it('flags DTD injection', () => {
    const xml = '<!DOCTYPE event [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact callsign="ODIN" /></detail></event>';
    const result = validateCoT(xml, 'ATAK');
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'XML_DTD_ERROR')).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it('flags extremely deep nesting', () => {
    let xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail>';
    for (let i = 0; i < 100; i++) xml += `<nest${i}>`;
    xml += '<contact callsign="ODIN" />';
    for (let i = 99; i >= 0; i--) xml += `</nest${i}>`;
    xml += '</detail></event>';
    const result = validateCoT(xml, 'ATAK');
    expect(result.errors.some((error: { code: string, text?: string }) => error.code === 'XML_NESTING_ERROR')).toBe(true);
  });
});

describe('Platform rule negative cases', () => {
  it('warns when WinTAK payload is missing remarks', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact callsign="ODIN-WINTAK" /></detail></event>';
    const result = validateCoT(xml, 'WinTAK');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('WinTAK: Missing <remarks> tag'))).toBe(true);
  });

  it('warns when Maven payload is missing takv', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact callsign="ODIN-MAVEN" /><track speed="0.00000000" course="0.00000000" /></detail></event>';
    const result = validateCoT(xml, 'Maven');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('Maven: Missing <takv> tag'))).toBe(true);
  });

  it('warns when Lattice payload is missing track', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact callsign="ODIN-LATTICE" /><remarks>Auto-ingested for Lattice correlation.</remarks></detail></event>';
    const result = validateCoT(xml, 'Lattice');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('Lattice: Missing <track> tag'))).toBe(true);
  });

  it('warns when TAKx payload is missing __group', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><takv device="Gateway" os="Linux" version="2.1" /></detail></event>';
    const result = validateCoT(xml, 'TAKx');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('TAKx: Missing <__group> tag'))).toBe(true);
  });

  it('warns when WearTAK payload is missing track', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail><contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" /><__group name="Dark Green" role="K9" /></detail></event>';
    const result = validateCoT(xml, 'WearTAK');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('WearTAK: Missing <track> tag'))).toBe(true);
  });

  it('warns when WebTAK payload is missing contact', () => {
    const xml = '<event uid="demo" type="a-f-G-U-C" time="2099-03-05T12:00:00Z" start="2099-03-05T12:00:00Z" stale="2099-03-05T12:05:00Z" how="m-g"><point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" /><detail></detail></event>';
    const result = validateCoT(xml, 'WebTAK');
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.code === 'PLATFORM_TAG_MISSING')).toBe(true);
    expect(result.warnings.some((warning: { code: string, text?: string }) => warning.text?.includes('WebTAK: Missing <contact> tag'))).toBe(true);
  });
});
