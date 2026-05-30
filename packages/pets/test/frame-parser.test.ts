import { describe, it, expect } from 'vitest';
import { parseFrame, parseStateFrames, parseAllFrames } from '../src/rpet/frame-parser.js';

describe('parseFrame', () => {
  it('parses a 16x16 frame into palette indices', () => {
    const frame = [
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCBBBCCCCCCCCC',
      'CCCCBBBCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCC',
    ];
    const parsed = parseFrame(frame);
    expect(parsed).toHaveLength(16);
    expect(parsed[0]).toHaveLength(16);
    // C = transparent (-1)
    expect(parsed[0][0]).toBe(-1);
    // B = body (index 0 in CHAR_TO_SLOT)
    expect(parsed[6][4]).toBe(0);
    expect(parsed[6][5]).toBe(0);
  });

  it('returns -1 for transparent cells', () => {
    const frame = Array(16).fill('CCCCCCCCCCCCCCCC');
    const parsed = parseFrame(frame as string[]);
    for (const row of parsed) {
      for (const cell of row) {
        expect(cell).toBe(-1);
      }
    }
  });

  it('handles all palette characters', () => {
    const row = 'BDEKMASFCCCCCCCC';
    const frame = Array(16).fill(row);
    const parsed = parseFrame(frame as string[]);
    // Each character should map to a non-negative index
    for (let i = 0; i < 8; i++) {
      expect(parsed[0][i]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('parseStateFrames', () => {
  it('parses multiple frames for a state', () => {
    const frame = Array(16).fill('CCCCCCCCCCCCCCCC');
    const frames = [frame, frame, frame];
    const parsed = parseStateFrames(frames as string[][]);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toHaveLength(16);
  });
});

describe('parseAllFrames', () => {
  it('parses frames for all states', () => {
    const frame = Array(16).fill('CCCCCCCCCCCCCCCC');
    const frames = {
      idle: [frame],
      alert: [frame],
      talking: [frame],
      sleeping: [frame],
      happy: [frame],
      lookLeft: [frame],
      lookRight: [frame],
      jump: [frame],
    };
    const parsed = parseAllFrames(frames as Record<string, string[]>);
    expect(Object.keys(parsed)).toHaveLength(8);
    expect(parsed.idle).toHaveLength(1);
  });
});
