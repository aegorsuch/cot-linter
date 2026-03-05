import type { Platform } from './cotValidator';

const ISO_NOW = '2026-03-05T12:00:00Z';
const ISO_STALE = '2026-03-05T12:05:00Z';

const baseTemplate = (detailBody: string): string => `<event uid="demo-uid" type="a-f-G-U-C" time="${ISO_NOW}" start="${ISO_NOW}" stale="${ISO_STALE}" how="m-g">
  <point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />
  <detail>
${detailBody}
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
  iTAK: baseTemplate(
    '    <contact callsign="ODIN-ITAK" />\n' +
      '    <__group name="Rescue" role="K9" />',
  ),
  WearTAK: baseTemplate(
    '    <contact callsign="ODIN-WEARTAK" />\n' +
      '    <__group name="Dark Green" role="K9" />',
  ),
  'TAK Aware': baseTemplate(
    '    <contact callsign="ODIN-TAKAWARE" />\n' +
      '    <remarks>Initial report from mobile observer.</remarks>',
  ),
  TAKx: baseTemplate(
    '    <takv device="Gateway" os="Linux" version="2.1" />\n' +
      '    <__group name="Interop" role="K9" />',
  ),
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
