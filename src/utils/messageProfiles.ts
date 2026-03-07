import type { MessageValidationProfile } from './cotValidator.mjs.d.ts';
import type { Platform } from '../types/shared';

export const MESSAGE_PROFILES: MessageValidationProfile[] = [
  {
    id: 'atak-manual-alert',
    platform: 'ATAK',
    label: 'Manual Alert',
    description: 'ATAK emergency table alert payload with link, contact, and emergency metadata.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'contact', 'emergency'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='13155716143-9-1-1' type='b-a-o-tbl' time='2026-02-20T20:13:34.035Z' start='2026-02-20T20:13:34.035Z' stale='2026-02-20T20:13:44.035Z' how='h-e' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <link uid='ANDROID-4eb92ff46e615c21' type='a-f-G-U-C' relation='p-p' />
    <contact callsign='ODIN-ATAK' />
    <emergency type='911 Alert'>ODIN-ATAK</emergency>
  </detail>
</event>`,
  },
  {
    id: 'atak-manual-alert-clear',
    platform: 'ATAK',
    label: 'Manual Alert Clear',
    description: 'ATAK emergency cancel payload for clearing a manual alert.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['emergency'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='13155716143-9-1-1' type='b-a-o-can' time='2026-02-20T20:13:34.720Z' start='2026-02-20T20:13:34.720Z' stale='2026-02-20T20:13:44.720Z' how='h-e' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <emergency cancel='true'>ODIN-ATAK</emergency>
  </detail>
</event>`,
  },
  {
    id: 'atak-milstd-2525d-drop',
    platform: 'ATAK',
    label: 'MIL-STD-2525D Drop',
    description: 'ATAK MIL-STD-2525D point drop payload with status, link, and icon metadata.',
    // expectedType removed
    requiredEventAttributes: ['version'],
    requiredDetailTags: ['status', 'archive', 'link', 'contact', 'remarks', 'color', 'precisionlocation', 'usericon'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='a0c524c6-0422-4382-9981-e39d1dc71730' type='a-u-G' time='2020-12-16T19:59:34.910Z' start='2020-12-16T19:59:34.910Z' stale='2021-01-02T20:40:03.838Z' how='h-g-i-g-o'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <status readiness='true'/>
    <archive/>
    <link uid='ANDROID-589520ccfcd20f01' production_time='2020-12-16T19:50:57.629Z' type='a-f-G-U-C' parent_callsign='ODIN-ATAK' relation='p-p'/>
    <contact callsign='U.16.135057'/>
    <remarks></remarks>
    <archive/>
    <color argb='-1'/>
    <precisionlocation altsrc='???'/>
    <usericon iconsetpath='COT_MAPPING_2525B/a-u/a-u-G'/>
  </detail>
</event>`,
  },
  {
    id: 'cloudtak-manual-alert',
    platform: 'CloudTAK',
    label: 'Manual Alert',
    description: 'CloudTAK manual alert payload with emergency metadata and icon rendering path.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['emergency', 'usericon', 'contact', 'takv'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='CLOUDTAK_alert_demo_uid' type='b-a-o' time='2026-03-05T12:00:00Z' start='2026-03-05T12:00:00Z' stale='2026-03-05T12:15:00Z' how='h-e' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <emergency type='Manual Alert: Gunshot'>ODIN-CLOUDTAK</emergency>
    <usericon iconsetpath='COT_MAPPING_2525C/b-a-o.png' />
    <contact callsign='ODIN-CLOUDTAK' />
    <takv device='Android' os='Android 14' version='5.0' />
  </detail>
</event>`,
  },
  {
    id: 'weartak-milstd-point',
    platform: 'WearTAK',
    label: 'MIL-STD-2525D Drop',
    description: 'WearTAK point-drop payload with status, link, and icon metadata.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['status', 'precisionlocation', 'link', 'color', 'usericon', 'remarks', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='d62ca8a4-9489-45ce-9e5a-4e9eb78fb732' type='a-f-G' time='2026-02-27T03:08:28.000Z' start='2026-02-27T03:08:29.490Z' stale='2027-02-27T03:08:29.490Z' how='h-g-i-g-o' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
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
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['status', 'precisionlocation', 'link', 'color', 'usericon', 'remarks', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='129c8ba2-4a50-444a-919f-ca3209eaf975' type='a-u-G' time='2026-02-27T03:16:13.000Z' start='2026-02-27T03:16:10.443Z' stale='2026-02-27T03:13:14.443Z' how='h-g-i-g-o' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <status readiness='true' battery='91'/>
    <precisionlocation altsrc='SRTM1'/>
    <link uid='WEAROS_ec3eecdeb3329263' production_time='2026-02-27T03:16:10.443Z' type='a-f-G-U-C' parent_callsign='ODIN-WEARTAK' relation='p-p'/>
    <color argb='-1'/>
    <usericon iconsetpath=''/>
    <remarks></remarks>
    <contact callsign='ODIN-WEARTAK_031614Z'/>
  </detail>
</event>`,
  },
  {
    id: 'weartak-manual-alert-gunshot',
    platform: 'WearTAK',
    label: 'Manual Alert',
    description: 'WearTAK emergency alert payload with manual gunshot event details.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'usericon', 'color', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o' time='2026-02-27T03:02:21.000Z' start='2026-02-27T03:02:22.497Z' stale='2026-02-27T03:17:22.497Z' how='h-e' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <link uid='WEAROS_ec3eecdeb3329263' type='a-f-G-U-C' relation='p-p'/>
    <emergency type='Manual Alert: Gunshot'>ODIN-WEARTAK</emergency>
    <usericon iconsetpath='911 Alert'/>
    <color argb='-1'/>
    <contact callsign='ODIN-WEARTAK&#10;Manual Alert: Gunshot'/>
  </detail>
</event>`,
  },
  {
    id: 'weartak-manual-alert-clear',
    platform: 'WearTAK',
    label: 'Manual Alert Clear',
    description: 'WearTAK emergency cancel payload for clearing a manual alert.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['emergency'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o-can' time='2026-02-27T03:02:23.000Z' start='2026-02-27T03:02:24.696Z' stale='2026-02-27T03:17:24.696Z' how='h-e' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <emergency cancel='true'>ODIN-WEARTAK</emergency>
  </detail>
</event>`,
  },
  {
    id: 'weartak-chat-send',
    platform: 'WearTAK',
    label: 'Chat Send',
    description: 'WearTAK geochat send payload with chat metadata and recipient-scoped remarks.',
    // expectedType removed
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['__chat', 'link', 'remarks'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='GeoChat.WEAROS_ec3eecdeb3329263.S-1-5-21-2509009047-1201820514-1223561644-1001.7edbd135-0a00-452f-9a65-06e0859242d0' type='b-t-f' time='2026-02-27T18:35:49.00Z' start='2026-02-27T18:35:49.66Z' stale='2026-02-27T18:35:49.66Z' how='h-g-i-g-o' access='Undefined'>
  <point lat='41.880025' lon='-87.641793' hae='180.1' ce='13.0' le='1.0' />
  <detail>
    <__chat parent='RootContactGroup' groupOwner='false' messageId='7edbd135-0a00-452f-9a65-06e0859242d0' chatroom='ODIN-WINTAK' id='S-1-5-21-2509009047-1201820514-1223561644-1001' senderCallsign='ODIN-WEARTAK'>
      <chatgrp uid0='WEAROS_ec3eecdeb3329263' uid1='S-1-5-21-2509009047-1201820514-1223561644-1001' id='S-1-5-21-2509009047-1201820514-1223561644-1001' />
    </__chat>
    <link uid='WEAROS_ec3eecdeb3329263' type='a-f-G-U-C' relation='p-p' />
    <remarks source='WEAROS_ec3eecdeb3329263' to='S-1-5-21-2509009047-1201820514-1223561644-1001' time='2026-02-27T18:35:49.660Z'>Roger</remarks>
  </detail>
</event>`,
  },
];

export const getMessageProfilesForPlatform = (platform: Platform): MessageValidationProfile[] => {
  return MESSAGE_PROFILES.filter((profile) => profile.platform === platform);
};

export const getAllTemplateLabels = (): string[] => {
  const uniqueSortedLabels = Array.from(new Set(MESSAGE_PROFILES.map((profile) => profile.label))).sort(
    (a, b) => a.localeCompare(b),
  );

  return [...uniqueSortedLabels, 'SA'];
};
