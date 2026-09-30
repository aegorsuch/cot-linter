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

export interface PublicSample {
  platform: Platform;
  label: string;
  xml: string;
  sourceUrl: string;
}

export const PUBLIC_SAMPLES: PublicSample[] = [
  {
    platform: 'ATAK',
    label: 'SA',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/Presence_InitialATAK.cot',
    xml: `<event version="2.0" uid="ANDROID-example" type="a-f-G-U-C" time="2023-12-29T18:49:38.624Z" start="2023-12-29T18:49:38.624Z" stale="2023-12-29T18:55:53.624Z" how="h-g-i-g-o">
  <point lat="34.1234" lon="-117.1234" hae="9999999.0" ce="9999999.0" le="9999999.0" />
  <detail>
    <takv os="28" version="4.8.1.8 (0c4d4662).1676511632-CIV" device="SAMSUNG SM-G950W" platform="ATAK-CIV" />
    <contact endpoint="*:-1:stcp" callsign="Example" />
    <uid Droid="Example" />
    <__group role="Team Member" name="Yellow" />
    <status battery="0" />
    <track course="292.4544485383155" speed="0.0" />
  </detail>
</event>`,
  },
  {
    platform: 'WinTAK',
    label: 'SA',
    sourceUrl: 'https://github.com/snstac/pytak/blob/main/tests/test_takmsg2xml.py',
    xml: `<event version="2.0" uid="wintak-example" type="a-f-G-E-V-C" time="2020-02-08T18:10:44.000Z" start="2020-02-08T18:10:44.000Z" stale="2020-02-08T18:11:11.000Z" how="h-e">
  <point lat="34.1234" lon="-117.1234" hae="26.767999" ce="9999999.0" le="9999999.0" />
  <detail>
    <contact callsign="Example HQ" endpoint="*:-1:stcp" />
    <__group name="Yellow" role="HQ" />
    <status battery="87" />
    <takv platform="WinTAK-CIV" device="LENOVO" os="Windows 10" version="1.10.0.137" />
    <precisionlocation geopointsrc="GPS" altsrc="GPS" />
  </detail>
</event>`,
  },
  {
    platform: 'WinTAK',
    label: 'Chat Send',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/Chat.cot',
    xml: `<event version="2.0" uid="GeoChat.WINTAK-example.Red.message-1" type="b-t-f" time="2022-05-16T13:24:59.71Z" start="2022-05-16T13:24:59.71Z" stale="2022-05-17T13:24:59.71Z" how="h-g-i-g-o">
  <point lat="0" lon="0" hae="9999999" ce="9999999" le="9999999" />
  <detail>
    <__chat id="Red" chatroom="Red" senderCallsign="WinTAK" groupOwner="false">
      <chatgrp id="Red" uid0="WINTAK-example" uid1="user1" uid2="user2" />
      <hierarchy><group uid="TeamGroups" name="Teams"><group uid="Red" name="Red"><contact uid="WINTAK-example" name="WinTAK" /></group></group></hierarchy>
    </__chat>
    <link uid="WINTAK-example" type="a-f-G-U-C-I" relation="p-p" />
    <remarks source="BAO.F.WinTAK.WINTAK-example" sourceID="WINTAK-example" to="Red" time="2022-05-16T13:24:59.71Z">Test message</remarks>
    <marti><dest callsign="user2" /></marti>
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Manual Alert',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/AlertTrouble.cot',
    xml: `<event version="2.0" uid="ANDROID-example-9-1-1" type="b-a-o-tbl" time="2022-10-18T13:31:42.224Z" start="2022-10-18T13:31:42.224Z" stale="2022-10-18T13:31:52.224Z" how="h-e">
  <point lat="34.1234" lon="-117.1234" hae="162.119" ce="9999999.0" le="9999999.0" />
  <detail>
    <contact callsign="Example-Alert" />
    <emergency type="911 Alert">Example</emergency>
    <link relation="p-p" type="a-f-G-U-C" uid="ANDROID-example" />
    <remarks>CALL 911 NOW</remarks>
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Manual Alert Clear',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/AlertCancel.cot',
    xml: `<event version="2.0" uid="ANDROID-example-9-1-1" type="b-a-o-can" time="2022-10-18T13:34:59.841Z" start="2022-10-18T13:34:59.841Z" stale="2022-10-18T13:35:09.841Z" how="h-e">
  <point lat="34.1234" lon="-117.1234" hae="162.119" ce="9999999.0" le="9999999.0" />
  <detail><emergency cancel="true">Example</emergency></detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: '2525 Marker',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/Marker%20-%202525.cot',
    xml: `<event version="2.0" uid="marker-example" type="a-u-G" time="2020-12-16T19:59:34.910Z" start="2020-12-16T19:59:34.910Z" stale="2021-01-02T20:40:03.838Z" how="h-g-i-g-o">
  <point lat="34.1234" lon="-117.1234" hae="9999999.0" ce="9999999.0" le="9999999.0" />
  <detail>
    <status readiness="true" />
    <archive />
    <link uid="ANDROID-example" production_time="2020-12-16T19:50:57.629Z" type="a-f-G-U-C" parent_callsign="Example" relation="p-p" />
    <contact callsign="U.16.135057" />
    <remarks></remarks>
    <color argb="-1" />
    <precisionlocation altsrc="???" />
    <usericon iconsetpath="COT_MAPPING_2525B/a-u/a-u-G" />
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Spot Marker',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/Marker%20-%20Spot.cot',
    xml: `<event version="2.0" uid="spot-example" type="b-m-p-s-m" time="2020-12-16T19:59:34.913Z" start="2020-12-16T19:59:34.913Z" stale="2021-01-02T20:40:03.841Z" how="h-g-i-g-o">
  <point lat="34.1234" lon="-117.1234" hae="9999999.0" ce="9999999.0" le="9999999.0" />
  <detail>
    <status readiness="true" />
    <archive />
    <link uid="ANDROID-example" production_time="2020-12-16T19:51:09.603Z" type="a-f-G-U-C" parent_callsign="Example" relation="p-p" />
    <contact callsign="R 1" />
    <remarks></remarks>
    <color argb="-65536" />
    <precisionlocation altsrc="???" />
    <usericon iconsetpath="COT_MAPPING_SPOTMAP/b-m-p-s-m/-65536" />
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'In Contact Alert',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/AlertOpen.cot',
    xml: `<event version="2.0" uid="ANDROID-example-9-1-1" type="b-a-o-opn" time="2022-10-18T13:36:21.385Z" start="2022-10-18T13:36:21.385Z" stale="2022-10-18T13:36:31.385Z" how="h-e">
  <point lat="34.1234" lon="-117.1234" hae="162.119" ce="9999999" le="9999999" />
  <detail>
    <link uid="ANDROID-example" type="a-f-G-U-C" relation="p-p" />
    <emergency type="In Contact">Example</emergency>
    <contact callsign="Example-Alert" />
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Waypoint',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/WayPoint.cot',
    xml: `<event version="2.0" uid="waypoint-example" type="b-m-p-w-GOTO" time="2023-02-10T13:55:58.835Z" start="2023-02-10T13:55:58.835Z" stale="2023-02-10T14:00:58.835Z" how="h-g-i-g-o">
  <point lat="34.1234" lon="-117.1234" hae="7.225993783295152" ce="9999999.0" le="9999999.0" />
  <detail>
    <status readiness="true" />
    <archive />
    <contact callsign="Example waypoint" />
    <precisionlocation altsrc="DTED0" />
    <remarks />
    <color argb="-1" />
    <link uid="ANDROID-example" production_time="2020-09-26T14:57:51.532Z" type="a-f-G-U-C" parent_callsign="Example" relation="p-p" />
    <marti><dest callsign="Example HQ" /></marti>
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Circle',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/Drawing%20Shapes%20-%20Circle.cot',
    xml: `<event version="2.0" uid="circle-example" type="u-d-c-c" time="2020-12-16T19:59:34.915Z" start="2020-12-16T19:59:34.915Z" stale="2020-12-17T19:59:34.915Z" how="h-e">
  <point lat="34.1234" lon="-117.1234" hae="9999999.0" ce="9999999.0" le="9999999.0" />
  <detail>
    <shape>
      <ellipse major="226.98412686380018" minor="226.98412686380018" angle="360" />
      <link uid="circle-example.Style" type="b-x-KmlStyle" relation="p-c">
        <Style><LineStyle><color>ffffffff</color><width>4.0</width></LineStyle><PolyStyle><color>96ffffff</color></PolyStyle></Style>
      </link>
    </shape>
    <strokeColor value="-1" />
    <strokeWeight value="4.0" />
    <fillColor value="-1761607681" />
    <contact callsign="Example circle" />
    <remarks />
    <archive />
    <labels_on value="true" />
    <precisionlocation altsrc="???" />
  </detail>
</event>`,
  },
  {
    platform: 'ATAK',
    label: 'Video Feed',
    sourceUrl: 'https://github.com/FreeTAKTeam/FreeTAKTest/blob/main/TestData/COT_examples/VideoFeed.cot',
    xml: `<event version="2.0" uid="video-example" type="b-i-v" time="2023-07-14T14:08:59Z" start="2023-07-14T14:08:59Z" stale="2023-07-14T15:08:58Z" how="m-g">
  <point lat="0.0" lon="0.0" hae="9999999.0000000000" ce="9999999.0" le="9999999.0" />
  <detail>
    <contact callsign="Example video" />
    <precisionlocation geopointsrc="???" altsrc="???" />
    <__video><ConnectionEntry protocol="raw" address="https://example.com/video" port="80" uid="video-example" alias="Example video" roverPort="-1" rtspReliable="0" ignoreEmbeddedKLV="False" networkTimeout="3000" bufferTime="5000" /></__video>
    <_flow-tags_ TAK-Server-example="2023-07-14T14:08:59Z" />
  </detail>
</event>`,
  },
];

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
