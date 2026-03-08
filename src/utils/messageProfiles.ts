import type { MessageValidationProfile, Platform } from './cotValidator';

export const MESSAGE_PROFILES: MessageValidationProfile[] = [
    {
      id: 'weartak-sa',
      platform: 'WearTAK',
      label: 'SA',
      description: 'WearTAK SA template for situational awareness.',
      expectedType: 'a-f-G-U-C',
      requiredEventAttributes: ['version', 'access'],
      requiredDetailTags: ['remarks', 'contact', '__group', 'track'],
      sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="WEAROS_demo_uid" type="a-f-G-U-C" time="2026-03-05T12:00:00Z" start="2026-03-05T12:00:00Z" stale="2026-03-05T12:05:00Z" how="m-g" access="Undefined">\n  <point lat="41.880025" lon="-87.641793" hae="180.1" ce="13.0" le="1.0" />\n  <detail>\n    <remarks></remarks>\n    <contact endpoint="*:-1:stcp" callsign="ODIN-WEARTAK" />\n    <__group name="Dark Green" role="K9" />\n    <track speed="0.00000000" course="0.00000000" />\n  </detail>\n</event>`,
    },
  {
    id: 'atak-manual-alert',
    platform: 'ATAK',
    label: 'Manual Alert',
    description: 'ATAK emergency alert payload with manual event details.',
    expectedType: 'b-a-o-tbl',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
    sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="13155716143-9-1-1" type="b-a-o-tbl" time="2026-02-20T20:13:34.035Z" start="2026-02-20T20:13:34.035Z" stale="2026-02-20T20:13:44.035Z" how="h-e" access="Undefined"><point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" /><detail><link uid="ANDROID-4eb92ff46e615c21" type="a-f-G-U-C" relation="p-p"/><contact callsign="ODIN-ATAK-Alert"/><emergency type="911 Alert">ODIN-ATAK</emergency></detail></event>`,
  },
  {
    id: 'atak-manual-alert-clear',
    platform: 'ATAK',
    label: 'Manual Alert Clear',
    description: 'ATAK emergency alert clear/cancel payload.',
    expectedType: 'b-a-o-can',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['emergency', 'point'],
    sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="13155716143-9-1-1" type="b-a-o-can" time="2026-02-20T20:13:34.720Z" start="2026-02-20T20:13:34.720Z" stale="2026-02-20T20:13:44.720Z" how="h-e" access="Undefined"><point lat="0.0" lon="0.0" hae="9999999.0" ce="9999999.0" le="9999999.0"/><detail><emergency cancel="true">ODIN-ATAK</emergency></detail></event>`,
    },
  {
    id: 'weartak-chat-send',
    platform: 'WearTAK',
    label: 'Chat Send',
    description: 'WearTAK geochat send payload with chat metadata and recipient-scoped remarks.',
    expectedType: 'b-t-f',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['__chat', 'chatgrp', 'link', 'remarks'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='d62ca8a4-9489-45ce-9e5a-4e9eb78fb732' type='b-t-f' time='2026-02-27T03:08:28.000Z' start='2026-02-27T03:08:29.490Z' stale='2027-02-27T03:08:29.490Z' how='h-g-i-g-o' access='Undefined'>\n  <point lat='41.8799922' lon='-87.6411654' hae='178.1' ce='22.8' le='1.6' />\n  <detail>\n    <__chat sender='ODIN-WEARTAK' recipient='ODIN-ATAK' message='Hello from WearTAK!'/>\n    <chatgrp name='ODIN-Group'/>\n    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:08:29.490Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n    <remarks>WearTAK geochat send</remarks>\n  </detail>\n</event>`,
  },
  {
  id: 'weartak-milstd-point',
  platform: 'WearTAK',
  label: 'MIL-STD-2525D Drop',
  description: 'WearTAK point-drop payload with status, link, and icon metadata.',
  expectedType: 'a-f-G',
  requiredEventAttributes: ['version', 'access'],
  requiredDetailTags: ['status', 'precisionlocation', 'link', 'color', 'usericon', 'remarks', 'contact'],
  sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='d62ca8a4-9489-45ce-9e5a-4e9eb78fb732' type='a-f-G' time='2026-02-27T03:08:28.000Z' start='2026-02-27T03:08:29.490Z' stale='2027-02-27T03:08:29.490Z' how='h-g-i-g-o' access='Undefined'>
  <point lat='41.8799922' lon='-87.6411654' hae='178.1' ce='22.8' le='1.6' />
  <detail>
    <status readiness='true' battery='93'/>
    <precisionlocation altsrc='SRTM1'/>
    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:08:29.490Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>
    <color argb='-1'/>
    <usericon iconsetpath=''/>
    <remarks></remarks>
    <contact callsign='ODIN-WEARTAK_030829Z'/>
  </detail>
</event>`,
},
  {
    id: 'weartak-milstd-point-clear',
    platform: 'WearTAK',
    label: 'MIL-STD-2525D Clear',
    description: 'WearTAK point-clear payload used to remove a previously dropped point.',
    expectedType: 'a-u-G',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['status', 'precisionlocation', 'link', 'color', 'usericon', 'remarks', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='129c8ba2-4a50-444a-919f-ca3209eaf975' type='a-u-G' time='2026-02-27T03:16:13.000Z' start='2026-02-27T03:16:10.443Z' stale='2026-02-27T03:13:14.443Z' how='h-g-i-g-o' access='Undefined'>\n  <point lat='41.879986' lon='-87.6408946' hae='180.3' ce='15.5' le='1.6' />\n  <detail>\n    <status readiness='true' battery='91'/>\n    <precisionlocation altsrc='SRTM1'/>\n    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:16:10.443Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n    <color argb='-1'/>\n    <usericon iconsetpath=''/>\n    <remarks></remarks>\n    <contact callsign='ODIN-WEARTAK_031614Z'/>\n  </detail>\n</event>`,
  },
  {
    id: 'weartak-manual-alert-gunshot',
    platform: 'WearTAK',
    label: 'Manual Alert',
    description: 'WearTAK emergency alert payload with manual gunshot event details.',
    expectedType: 'b-a-o',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'usericon', 'color', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o' time='2026-02-27T03:02:21.000Z' start='2026-02-27T03:02:22.497Z' stale='2026-02-27T03:17:22.497Z' how='h-e' access='Undefined'>\n  <point lat='41.879986' lon='-87.6409504' hae='178.1' ce='15.0' le='1.7' />\n  <detail>\n    <link uid='WEAROS_ec3eecdeb3329263' type='a-f-G-U-C' relation='p-p'/>\n    <emergency type='Manual Alert: Gunshot'>ODIN-WEARTAK</emergency>\n    <usericon iconsetpath='911 Alert'/>\n    <color argb='-1'/>\n    <contact callsign='ODIN-WEARTAK Manual Alert: Gunshot'/>\n  </detail>\n</event>`,
  },
  {
    id: 'weartak-manual-alert-clear',
    platform: 'WearTAK',
    label: 'Manual Alert Clear',
    description: 'WearTAK emergency cancel payload for clearing a manual alert.',
    expectedType: 'b-a-o-can',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['emergency'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o-can' time='2026-02-27T03:02:23.000Z' start='2026-02-27T03:02:24.696Z' stale='2026-02-27T03:17:24.696Z' how='h-e' access='Undefined'>\n  <point lat='41.879986' lon='-87.6409504' hae='178.1' ce='15.0' le='1.7' />\n  <detail>\n    <emergency cancel='true'>ODIN-WEARTAK</emergency>\n  </detail>\n</event>`,
    },
    {
  
    id: 'webtak-manual-alert',
    platform: 'WebTAK',
    label: 'Manual Alert',
    description: 'WebTAK manual alert payload (generic example).',
    expectedType: 'b-a-o-tbl',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
    sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="webtak-123" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="44.0" lon="-79.0" hae="0" ce="10" le="10" /><detail><link uid="WEBTAK-123" type="a-f-G-U-C" relation="p-p"/><contact callsign="WebTAK Alert"/><emergency type="Manual Alert">WebTAK</emergency></detail></event>`,
  },
  {
    id: 'cloudtak-manual-alert',
    platform: 'CloudTAK',
    label: 'Manual Alert',
    description: 'CloudTAK manual alert payload (generic example).',
    expectedType: 'b-a-o-tbl',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
    sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="cloudtak-123" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="45.0" lon="-80.0" hae="0" ce="10" le="10" /><detail><link uid="CLOUDTAK-123" type="a-f-G-U-C" relation="p-p"/><contact callsign="CloudTAK Alert"/><emergency type="Manual Alert">CloudTAK</emergency></detail></event>`,
    },
  // ...existing code...
    {
      id: 'itak-manual-alert',
      platform: 'iTAK',
      label: 'Manual Alert',
      description: 'iTAK manual alert payload (generic example).',
      expectedType: 'b-a-o-tbl',
      requiredEventAttributes: ['version', 'access'],
      requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
      sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="itak-123" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="40.0" lon="-75.0" hae="0" ce="10" le="10" /><detail><link uid="ITAK-123" type="a-f-G-U-C" relation="p-p"/><contact callsign="iTAK-Alert"/><emergency type="Manual Alert">iTAK</emergency></detail></event>`,
    },
    {
      id: 'takaware-manual-alert',
      platform: 'TAK Aware',
      label: 'Manual Alert',
      description: 'TAK Aware manual alert payload (generic example).',
      expectedType: 'b-a-o-tbl',
      requiredEventAttributes: ['version', 'access'],
      requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
      sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="takaware-456" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="41.0" lon="-76.0" hae="0" ce="10" le="10" /><detail><link uid="TAKAWARE-456" type="a-f-G-U-C" relation="p-p"/><contact callsign="TAK Aware Alert"/><emergency type="Manual Alert">TAK Aware</emergency></detail></event>`,
    },
    {
      id: 'wintak-manual-alert',
      platform: 'WinTAK',
      label: 'Manual Alert',
      description: 'WinTAK manual alert payload (generic example).',
      expectedType: 'b-a-o-tbl',
      requiredEventAttributes: ['version', 'access'],
      requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
      sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="wintak-789" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="42.0" lon="-77.0" hae="0" ce="10" le="10" /><detail><link uid="WINTAK-789" type="a-f-G-U-C" relation="p-p"/><contact callsign="WinTAK Alert"/><emergency type="Manual Alert">WinTAK</emergency></detail></event>`,
    },
    {
      id: 'takx-manual-alert',
      platform: 'TAKx',
      label: 'Manual Alert',
      description: 'TAKx manual alert payload (generic example).',
      expectedType: 'b-a-o-tbl',
      requiredEventAttributes: ['version', 'access'],
      requiredDetailTags: ['link', 'emergency', 'contact', 'point'],
      sampleXml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<event version="2.0" uid="takx-321" type="b-a-o-tbl" time="2026-03-07T12:00:00.000Z" start="2026-03-07T12:00:00.000Z" stale="2026-03-07T12:10:00.000Z" how="h-e" access="Undefined"><point lat="43.0" lon="-78.0" hae="0" ce="10" le="10" /><detail><link uid="TAKX-321" type="a-f-G-U-C" relation="p-p"/><contact callsign="TAKx Alert"/><emergency type="Manual Alert">TAKx</emergency></detail></event>`,
    },
  {
    id: 'atak-milstd-drop',
    platform: 'ATAK',
    label: 'MIL-STD-2525D Drop',
    description: 'ATAK MIL-STD-2525D Drop payload with status, link, icon, and metadata.',
    expectedType: 'a-u-G',
    requiredEventAttributes: ['version'],
    requiredDetailTags: ['status', 'archive', 'link', 'contact', 'remarks', 'color', 'precisionlocation', 'usericon'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n<event version='2.0' uid='a0c524c6-0422-4382-9981-e39d1dc71730' type='a-u-G' time='2020-12-16T19:59:34.910Z' start='2020-12-16T19:59:34.910Z' stale='2021-01-02T20:40:03.838Z' how='h-g-i-g-o'>\n\t<point lat="34.1234" lon="-117.1234" hae="0" ce="10" le="10" />\n\t<detail>\n\t\t<status readiness='true'/>\n\t\t<archive/>\n\t\t<link uid='ANDROID-589520ccfcd20f01' production_time='2020-12-16T19:50:57.629Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>\n\t\t<contact callsign='U.16.135057'/>\n\t\t<remarks></remarks>\n\t\t<archive/>\n\t\t<color argb='-1'/>\n\t\t<precisionlocation altsrc='???'/>\n\t\t<usericon iconsetpath='COT_MAPPING_2525B/a-u/a-u-G'/>\n\t</detail>\n</event>`,
  },
];

export const getMessageProfilesForPlatform = (platform: Platform): MessageValidationProfile[] => {
  return MESSAGE_PROFILES.filter((profile) => profile.platform === platform);
};

export const getAllTemplateLabels = (): string[] => {
  const uniqueSortedLabels = Array.from(new Set(MESSAGE_PROFILES.map((profile) => profile.label))).sort(
    (a, b) => a.localeCompare(b),
  );
  return uniqueSortedLabels;
};
