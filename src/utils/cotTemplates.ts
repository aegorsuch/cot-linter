export const MIL_STD_2525D_DROP_TEMPLATE = `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='a0c524c6-0422-4382-9981-e39d1dc71730' type='a-u-G' time='2020-12-16T19:59:34.910Z' start='2020-12-16T19:59:34.910Z' stale='2021-01-02T20:40:03.838Z' how='h-g-i-g-o'>\n  <point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />\n\t<detail>\n\t\t<status readiness='true'/>\n\t\t<archive/>\n\t\t<link uid='ANDROID-589520ccfcd20f01' production_time='2020-12-16T19:50:57.629Z' type='a-f-G-U-C' parent_callsign='ODIN-ATAK' relation='p-p'/>\n\t\t<contact callsign='U.16.135057'/>\n\t\t<remarks></remarks>\n\t\t<archive/>\n\t\t<color argb='-1'/>\n\t\t<precisionlocation altsrc='???'/>\n\t\t<usericon iconsetpath='COT_MAPPING_2525B/a-u/a-u-G'/>\n\t</detail>\n</event>`;
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
