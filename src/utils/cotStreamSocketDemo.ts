// Demo: Streaming CoT XML from a TCP socket and validating each event in real time
// Usage: node src/utils/cotStreamSocketDemo.ts <host> <port> <platform>

import net from 'net';
import { streamParseCoT } from './cotStreamParser';

const host = process.argv[2] || '127.0.0.1';
const port = parseInt(process.argv[3], 10) || 8087;
const platform = process.argv[4] || 'ATAK';

const socket = net.createConnection({ host, port }, () => {
  console.log(`Connected to ${host}:${port}`);
});

streamParseCoT(socket, platform, (result) => {
  if (result.error) {
    console.error('Parse error:', result.error);
  } else {
    console.log('Validation result:', result);
  }
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});
