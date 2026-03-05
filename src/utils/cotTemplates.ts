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
    '    <contact callsign="Viper-1" />\n' +
      '    <__group name="Blue" role="Team Member" />',
  ),
  CloudTAK: baseTemplate(
    '    <contact callsign="Cloud-1" />\n' +
      '    <takv device="Android" os="Android 14" version="5.0" />',
  ),
  iTAK: baseTemplate(
    '    <contact callsign="iTAK-Alpha" />\n' +
      '    <__group name="Rescue" role="Medic" />',
  ),
  'TAK Aware': baseTemplate(
    '    <contact callsign="Aware-1" />\n' +
      '    <remarks>Initial report from mobile observer.</remarks>',
  ),
  TAKx: baseTemplate(
    '    <takv device="Gateway" os="Linux" version="2.1" />\n' +
      '    <__group name="Interop" role="Relay" />',
  ),
  WebTAK: baseTemplate(
    '    <contact callsign="Web-Tracker" />\n' +
      '    <__group name="Ops" role="Viewer" />',
  ),
  WinTAK: baseTemplate(
    '    <usericon iconsetpath="COT_MAPPING_2525C/a-f-G-U-C.png" />\n' +
      '    <takv device="WinTAK" os="Windows 11" version="4.9" />',
  ),
};

export const getStarterTemplate = (platform: Platform): string => PLATFORM_STARTER_TEMPLATES[platform];
