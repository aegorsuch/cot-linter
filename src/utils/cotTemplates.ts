// ATAK Manual Alert template
export const ATAK_MANUAL_ALERT_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="13155716143-9-1-1" type="b-a-o-tbl" time="2026-02-20T20:13:34.035Z" start="2026-02-20T20:13:34.035Z" stale="2026-02-20T20:13:44.035Z" how="h-e" access="Undefined"><point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" /><detail><link uid="ANDROID-4eb92ff46e615c21" type="a-f-G-U-C" relation="p-p"/><contact callsign="ODIN-ATAK-Alert"/><emergency type="911 Alert">ODIN-ATAK</emergency></detail></event>`;

export const MIL_STD_2525D_DROP_TEMPLATE = `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='a0c524c6-0422-4382-9981-e39d1dc71730' type='a-u-G' time='2020-12-16T19:59:34.910Z' start='2020-12-16T19:59:34.910Z' stale='2021-01-02T20:40:03.838Z' how='h-g-i-g-o'>\n\t<point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />\n\t<detail>\n\t\t<status readiness='true'/>\n\t\t<archive/>\n\t\t<link uid='ANDROID-589520ccfcd20f01' production_time='2020-12-16T19:50:57.629Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n\t\t<contact callsign='U.16.135057'/>\n\t\t<remarks></remarks>\n\t\t<archive/>\n\t\t<color argb='-1'/>\n\t\t<precisionlocation altsrc='???'/>\n\t\t<usericon iconsetpath='COT_MAPPING_2525B/a-u/a-u-G'/>\n\t</detail>\n</event>`;
import type { Platform } from './cotValidator';

const ISO_NOW = '2026-03-05T12:00:00Z';
const ISO_STALE = '2026-03-05T12:05:00Z';

const baseTemplate = (detailBody: string): string => `<event uid="demo-uid" type="a-f-G-U-C" time="${ISO_NOW}" start="${ISO_NOW}" stale="${ISO_STALE}" how="m-g">
  <point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />
  <detail>
${detailBody}
  </detail>
</event>`;

const wearTakTemplate = (): string => `<event version="2.0" uid="WEAROS_demo_uid" type="a-f-G-U-C" time="${ISO_NOW}" start="${ISO_NOW}" stale="${ISO_STALE}" how="m-g" access="Undefined">
  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />
  <detail>
    <remarks></remarks>
    <contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" />
    <__group name="Dark Green" role="K9" />
    <track speed="0.00000000" course="0.00000000" />
  </detail>
</event>`;

export const PLATFORM_STARTER_TEMPLATES: Record<Platform, string> = {
  ATAK: baseTemplate(
    '    <contact callsign="ODIN-ATAK" />\n' +
      '    <__group name="Dark Green" role="K9" />',
  ),
  CloudTAK: baseTemplate(
    '    <contact callsign="ODIN-CLOUDTAK" />\n' +
      '    <takv device="Android" os="Android 14" version="5.0" />',
  ),
  Lattice: baseTemplate(
    '    <contact callsign="ODIN-LATTICE" />\n' +
      '    <track speed="0.00000000" course="0.00000000" />\n' +
      '    <remarks>Auto-ingested for Lattice correlation.</remarks>',
  ),
  Maven: baseTemplate(
    '    <contact callsign="ODIN-MAVEN" />\n' +
      '    <track speed="0.00000000" course="0.00000000" />\n' +
      '    <takv device="Maven Gateway" os="Linux" version="1.0" />',
  ),
  iTAK: baseTemplate(
    '    <contact callsign="ODIN-ITAK" />\n' +
      '    <__group name="Rescue" role="K9" />',
  ),
  'TAK Aware': baseTemplate(
    '    <contact callsign="ODIN-TAKAWARE" />\n' +
      '    <remarks></remarks>',
  ),
  TAKx: baseTemplate(
    '    <takv device="Gateway" os="Linux" sversion="2.1" />\n' +
      '    <__group name="Interop" role="K9" />',
  ),
  WearTAK: wearTakTemplate(),
  WebTAK: baseTemplate(
    '    <contact callsign="ODIN-WEBTAK" />\n' +
      '    <__group name="Ops" role="K9" />',
  ),
  WinTAK: baseTemplate(
    '    <usericon iconsetpath="COT_MAPPING_2525C/a-f-G-U-C.png" />\n' +
      '    <takv device="WinTAK" os="Windows 11" version="4.9" />',
  ),
};

export const getStarterTemplate = (platform: Platform): string => PLATFORM_STARTER_TEMPLATES[platform];

// Special template for ATAK + MIL-STD-2525D Drop
export const ATAK_MIL_STD_2525D_DROP_TEMPLATE = MIL_STD_2525D_DROP_TEMPLATE;

// Mapping for profile-specific templates
export const PROFILE_TEMPLATES: Record<string, Record<string, string>> = {
  ATAK: {
    'MIL-STD-2525D Drop': ATAK_MIL_STD_2525D_DROP_TEMPLATE,
    'Manual Alert': ATAK_MANUAL_ALERT_TEMPLATE,
    'Manual Alert Clear': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="13155716143-9-1-1" type="b-a-o-can" time="2026-02-20T20:13:34.720Z" start="2026-02-20T20:13:34.720Z" stale="2026-02-20T20:13:44.720Z" how="h-e" access="Undefined"><point lat="0.0" lon="0.0" hae="9999999.0" ce="9999999.0" le="9999999.0"/><detail><emergency cancel="true">ODIN-ATAK</emergency></detail></event>`,
  },
  WearTAK: {
    'SA': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="WEAROS_demo_uid" type="a-f-G-U-C" time="2026-03-05T12:00:00Z" start="2026-03-05T12:00:00Z" stale="2026-03-05T12:05:00Z" how="m-g" access="Undefined">\n  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />\n  <detail>\n    <remarks></remarks>\n    <contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" />\n    <__group name="Dark Green" role="K9" />\n    <track speed="0.00000000" course="0.00000000" />\n  </detail>\n</event>`,
    'Chat Send': `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='d62ca8a4-9489-45ce-9e5a-4e9eb78fb732' type='b-t-f' time='2026-02-27T03:08:28.000Z' start='2026-02-27T03:08:29.490Z' stale='2027-02-27T03:08:29.490Z' how='h-g-i-g-o' access='Undefined'>\n  <point lat='41.8799922' lon='-87.6411654' hae='178.1' ce='22.8' le='1.6' />\n  <detail>\n    <__chat sender='ODIN-WEARTAK' recipient='ODIN-ATAK' message='Hello from WearTAK!'/>\n    <chatgrp name='ODIN-Group'/>\n    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:08:29.490Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n    <remarks>WearTAK geochat send</remarks>\n  </detail>\n</event>`,
    'MIL-STD-2525D Drop': `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='d62ca8a4-9489-45ce-9e5a-4e9eb78fb732' type='a-f-G' time='2026-02-27T03:08:28.000Z' start='2026-02-27T03:08:29.490Z' stale='2027-02-27T03:08:29.490Z' how='h-g-i-g-o' access='Undefined'>\n  <point lat='41.8799922' lon='-87.6411654' hae='178.1' ce='22.8' le='1.6' />\n  <detail>\n    <status readiness='true' battery='93'/>\n    <precisionlocation altsrc='SRTM1'/>\n    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:08:29.490Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n    <color argb='-1'/>\n    <usericon iconsetpath=''/>\n    <remarks></remarks>\n    <contact callsign='ODIN-WEARTAK_030829Z'/>\n  </detail>\n</event>`,
    'MIL-STD-2525D Clear': `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='129c8ba2-4a50-444a-919f-ca3209eaf975' type='a-u-G' time='2026-02-27T03:16:13.000Z' start='2026-02-27T03:16:10.443Z' stale='2026-02-27T03:13:14.443Z' how='h-g-i-g-o' access='Undefined'>\n  <point lat='41.879986' lon='-87.6408946' hae='180.3' ce='15.5' le='1.6' />\n  <detail>\n    <status readiness='true' battery='91'/>\n    <precisionlocation altsrc='SRTM1'/>\n    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:16:10.443Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n    <color argb='-1'/>\n    <usericon iconsetpath=''/>\n    <remarks></remarks>\n    <contact callsign='ODIN-WEARTAK_031614Z'/>\n  </detail>\n</event>`,
    'Manual Alert': `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o' time='2026-02-27T03:02:21.000Z' start='2026-02-27T03:02:22.497Z' stale='2026-02-27T03:17:22.497Z' how='h-e' access='Undefined'>\n  <point lat='41.879986' lon='-87.6409504' hae='178.1' ce='15.0' le='1.7' />\n  <detail>\n    <link uid='WEAROS_ec3eecdeb3329263' type='a-f-G-U-C' relation='p-p'/>\n    <emergency type='Manual Alert: Gunshot'>ODIN-WEARTAK</emergency>\n    <usericon iconsetpath='911 Alert'/>\n    <color argb='-1'/>\n    <contact callsign='ODIN-WEARTAK Manual Alert: Gunshot'/>\n  </detail>\n</event>`,
    'Manual Alert Clear': `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o-can' time='2026-02-27T03:02:23.000Z' start='2026-02-27T03:02:24.696Z' stale='2026-02-27T03:17:24.696Z' how='h-e' access='Undefined'>\n  <point lat='41.879986' lon='-87.6409504' hae='178.1' ce='15.0' le='1.7' />\n  <detail>\n    <emergency cancel='true'>ODIN-WEARTAK</emergency>\n  </detail>\n</event>`,
  },
};

// Returns template for platform/profile combo, falls back to platform starter template
export function getProfileTemplate(platform: string, profile: string): string {
  if (PROFILE_TEMPLATES[platform] && PROFILE_TEMPLATES[platform][profile]) {
    return PROFILE_TEMPLATES[platform][profile];
  }
    return getStarterTemplate(platform as Platform);
}
