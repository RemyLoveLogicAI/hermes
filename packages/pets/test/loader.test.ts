import { describe, it, expect } from 'vitest';
import { loadRpet, loadSpecies } from '../src/rpet/loader.js';

const validRpet = {
  formatVersion: 1 as const,
  id: 'frygar',
  displayName: 'Frygar',
  palette: {
    body: 'E8745F',
    bodyDark: 'B8503D',
    eye: '1A1A2E',
    cheek: 'FF9E8A',
    mouth: 'D42B2B',
    antenna: 'F5C84A',
    sparkle: 'F5F0E6',
    foot: 'C4613D',
  },
  eyeRegion: {
    leftEyeColumns: [4, 6],
    rightEyeColumns: [9, 11],
    eyeRows: [6, 7],
    leftSparkle: [5, 7],
    rightSparkle: [10, 7],
  },
  frames: {
    idle: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    alert: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    talking: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    sleeping: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    happy: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    lookLeft: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    lookRight: [Array(16).fill('CCCCCCCCCCCCCCCC')],
    jump: [Array(16).fill('CCCCCCCCCCCCCCCC')],
  },
};

describe('loadRpet', () => {
  it('loads a valid .rpet definition', () => {
    const result = loadRpet(validRpet);
    expect(result.id).toBe('frygar');
    expect(result.displayName).toBe('Frygar');
  });

  it('throws on invalid data', () => {
    expect(() => loadRpet(null)).toThrow();
    expect(() => loadRpet({})).toThrow();
  });

  it('throws on missing required fields', () => {
    const incomplete = { ...validRpet, id: undefined };
    expect(() => loadRpet(incomplete)).toThrow();
  });
});

describe('loadSpecies', () => {
  it('loads species with parsed frames', () => {
    const species = loadSpecies(validRpet);
    expect(species.definition.id).toBe('frygar');
    expect(species.parsedFrames.idle).toHaveLength(1);
    expect(species.parsedFrames.idle[0]).toHaveLength(16);
  });

  it('throws on invalid data', () => {
    expect(() => loadSpecies({ bad: 'data' })).toThrow();
  });
});
