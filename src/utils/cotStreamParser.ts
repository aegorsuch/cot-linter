// Streaming XML parser for real-time CoT event validation
// Requires: npm install node-expat

import expat from 'node-expat';
import { validateCoT } from './cotValidator';

export function streamParseCoT(xmlStream: NodeJS.ReadableStream, platform: string, onEvent: (result: any) => void) {
  const parser = new expat.Parser('UTF-8');
  let eventXml = '';
  let insideEvent = false;

  parser.on('startElement', (name: string, attrs: any) => {
    if (name === 'event') {
      insideEvent = true;
      eventXml = '<event';
      for (const [key, value] of Object.entries(attrs)) {
        eventXml += ` ${key}="${value}"`;
      }
      eventXml += '>';
    } else if (insideEvent) {
      eventXml += `<${name}`;
      for (const [key, value] of Object.entries(attrs)) {
        eventXml += ` ${key}="${value}"`;
      }
      eventXml += '>';
    }
  });

  parser.on('endElement', (name: string) => {
    if (insideEvent) {
      eventXml += `</${name}>`;
      if (name === 'event') {
        insideEvent = false;
        // Validate the event XML
        const result = validateCoT(eventXml, platform);
        onEvent(result);
        eventXml = '';
      }
    }
  });

  parser.on('text', (text: string) => {
    if (insideEvent) {
      eventXml += text;
    }
  });

  parser.on('error', (error: Error) => {
    onEvent({ error });
  });

  xmlStream.on('data', (chunk: Buffer) => {
    parser.write(chunk.toString());
  });

  xmlStream.on('end', () => {
    parser.end();
  });
}