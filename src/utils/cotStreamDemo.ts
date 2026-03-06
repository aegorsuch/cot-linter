// Demo: Streaming CoT XML from a file and validating each event in real time
// Usage: node src/utils/cotStreamDemo.ts <path-to-cot-xml-file> <platform>

import fs from 'fs';
import { streamParseCoT } from './cotStreamParser';

const filePath = process.argv[2];
const platform = process.argv[3] || 'ATAK';

if (!filePath) {
  console.error('Usage: node src/utils/cotStreamDemo.ts <path-to-cot-xml-file> <platform>');
  process.exit(1);
}

const fileStream = fs.createReadStream(filePath);

streamParseCoT(fileStream, platform, (result) => {
  if (result.error) {
    console.error('Parse error:', result.error);
  } else {
    console.log('Validation result:', result);
  }
});
