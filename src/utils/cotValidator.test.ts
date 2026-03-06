import { describe, expect, it } from 'vitest';
import { validateCoT } from './cotValidator';

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
    expect(result.warnings.some((warning) => warning.code === 'TIMESTAMP_ORDER_WARNING')).toBe(true);
    expect(
      result.warnings.some((warning) => warning.text.includes("'time' should be earlier than or equal to 'stale'")),
    ).toBe(true);
  });

  it('warns when start is later than stale', () => {
    const xml = buildXml('2026-03-05T12:00:00Z', '2026-03-05T12:10:00Z', '2026-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((warning) => warning.code === 'TIMESTAMP_ORDER_WARNING')).toBe(true);
    expect(
      result.warnings.some((warning) => warning.text.includes("'start' should be earlier than or equal to 'stale'")),
    ).toBe(true);
  });

  it('warns when stale is already in the past', () => {
    const xml = buildXml('2020-03-05T12:00:00Z', '2020-03-05T12:00:00Z', '2020-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.isValid).toBe(true);
    expect(result.warnings.some((warning) => warning.code === 'TIMESTAMP_STALE_IN_PAST')).toBe(true);
  });

  it('does not emit timestamp warnings for sane future values', () => {
    const xml = buildXml('2099-03-05T12:00:00Z', '2099-03-05T12:00:00Z', '2099-03-05T12:05:00Z');
    const result = validateCoT(xml, 'ATAK');

    expect(result.warnings.some((warning) => warning.code.startsWith('TIMESTAMP_'))).toBe(false);
  });
});
