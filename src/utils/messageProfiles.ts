import type { MessageValidationProfile, Platform } from './cotValidator';

export const MESSAGE_PROFILES: MessageValidationProfile[] = [
  {
    id: 'weartak-milstd-point',
    platform: 'WearTAK',
    label: 'MIL-STD-2525D Point Drop',
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
    <remarks>ODIN-WEARTAK dropping MIL-STD-2525D Point</remarks>
    <contact callsign='ODIN-WEARTAK_030829Z'/>
  </detail>
</event>`,
  },
  {
    id: 'weartak-manual-alert-gunshot',
    platform: 'WearTAK',
    label: 'Manual Alert',
    description: 'WearTAK emergency alert payload with manual gunshot event details.',
    expectedType: 'b-a-o',
    requiredEventAttributes: ['version', 'access'],
    requiredDetailTags: ['link', 'emergency', 'usericon', 'color', 'contact'],
    sampleXml: `<?xml version='1.0' encoding='UTF-8' standalone='yes'?>
<event version='2.0' uid='3ec08f24-bbb4-41e8-86e1-c990e1052c44' type='b-a-o' time='2026-02-27T03:02:21.000Z' start='2026-02-27T03:02:22.497Z' stale='2026-02-27T03:17:22.497Z' how='h-e' access='Undefined'>
  <point lat='41.879986' lon='-87.6409504' hae='178.1' ce='15.0' le='1.7' />
  <detail>
    <link uid='WEAROS_ec3eecdeb3329263' type='a-f-G-U-C' relation='p-p'/>
    <emergency type='Manual Alert: Gunshot'>ODIN-WEARTAK</emergency>
    <usericon iconsetpath='911 Alert'/>
    <color argb='-1'/>
    <contact callsign='ODIN-WEARTAK&#10;Manual Alert: Gunshot'/>
  </detail>
</event>`,
  },
];

export const getMessageProfilesForPlatform = (platform: Platform): MessageValidationProfile[] => {
  return MESSAGE_PROFILES.filter((profile) => profile.platform === platform);
};
