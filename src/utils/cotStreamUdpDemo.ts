// Demo: Streaming CoT XML from a UDP socket and validating each event in real time
// Usage: node src/utils/cotStreamUdpDemo.ts <port> <platform>

import dgram from 'dgram';
import { Readable } from 'stream';
import { streamParseCoT } from './cotStreamParser';

const port = parseInt(process.argv[2], 10) || 8087;
const platform = process.argv[3] || 'ATAK';

const udpSocket = dgram.createSocket('udp4');

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`UDP socket listening on port ${address.port}`);
});

udpSocket.on('message', (msg) => {
  // Wrap UDP message in a Readable stream for parser
  const stream = Readable.from([msg]);
  streamParseCoT(stream, platform, (result) => {
    if (result.error) {
      console.error('Parse error:', result.error);
    } else {
      console.log('Validation result:', result);
    }
  });
});

udpSocket.bind(port);
