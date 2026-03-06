export type Platform = 'ATAK' | 'WinTAK' | 'Other' | 'CloudTAK' | 'WearTAK' | 'Maven' | 'Lattice' | 'TAKx' | 'WebTAK' | 'iTAK' | 'TAK Aware';

export interface SourceLocation {
  line: number;
  column: number;
}