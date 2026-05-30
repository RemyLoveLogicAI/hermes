import { describe, it, expect } from 'vitest';
import { rpetDefinitionSchema, rpetPaletteSchema, rpetEyeRegionSchema, rpetFrameSchema } from '../src/rpet/schema.js';

const validPalette = {
  body: 'E8745F',
  bodyDark: 'B8503D',
  eye: '1A1A2E',
  cheek: 'FF9E8A',
  mouth: 'D42B2B',
  antenna: 'F5C84A',
  sparkle: 'F5F0E6',
  foot: 'C4613D',
};

const validEyeRegion = {
  leftEyeColumns: [4, 6],
  rightEyeColumns: [9, 11],
  eyeRows: [6, 7],
  leftSparkle: [5, 7],
  rightSparkle: [10, 7],
};

const validFrame = Array(16).fill('CCCCAACCCCAACCCC');

const validFrames = {
  idle: [validFrame],
  alert: [validFrame],
  talking: [validFrame],
  sleeping: [validFrame],
  happy: [validFrame],
  lookLeft: [validFrame],
  lookRight: [validFrame],
  jump: [validFrame],
};

const validRpet = {
  formatVersion: 1 as const,
  id: 'test-pet',
  displayName: 'Test Pet',
  palette: validPalette,
  eyeRegion: validEyeRegion,
  frames: validFrames,
};

describe('rpetPaletteSchema', () => {
  it('accepts valid 6-digit hex colors', () => {
    expect(rpetPaletteSchema.parse(validPalette)).toEqual(validPalette);
  });

  it('accepts colors with # prefix', () => {
    expect(rpetPaletteSchema.parse({ ...validPalette, body: '#E8745F' })).toMatchObject({ body: '#E8745F' });
  });

  it('rejects short hex colors', () => {
    expect(() =>
      rpetPaletteSchema.parse({ ...validPalette, body: 'E87' })
    ).toThrow();
  });
});

describe('rpetEyeRegionSchema', () => {
  it('accepts valid eye region with tuples', () => {
    expect(rpetEyeRegionSchema.parse(validEyeRegion)).toEqual(validEyeRegion);
  });

  it('rejects non-tuple arrays', () => {
    expect(() =>
      rpetEyeRegionSchema.parse({ ...validEyeRegion, leftEyeColumns: [4] })
    ).toThrow();
  });
});

describe('rpetFrameSchema', () => {
  it('accepts 16x16 frame', () => {
    expect(rpetFrameSchema.parse(validFrame)).toEqual(validFrame);
  });

  it('rejects frames with wrong row length', () => {
    expect(() => rpetFrameSchema.parse(Array(16).fill('SHORT'))).toThrow();
  });

  it('rejects frames with wrong row count', () => {
    expect(() => rpetFrameSchema.parse(Array(15).fill('CCCCAACCCCAACCCC'))).toThrow();
  });
});

describe('rpetDefinitionSchema', () => {
  it('accepts valid .rpet definition', () => {
    expect(rpetDefinitionSchema.parse(validRpet)).toEqual(validRpet);
  });

  it('rejects non-kebab-case id', () => {
    expect(() =>
      rpetDefinitionSchema.parse({ ...validRpet, id: 'TestPet' })
    ).toThrow();
  });

  it('rejects wrong formatVersion', () => {
    expect(() =>
      rpetDefinitionSchema.parse({ ...validRpet, formatVersion: 2 })
    ).toThrow();
  });

  it('rejects missing required state', () => {
    const { jump, ...incompleteFrames } = validFrames;
    expect(() =>
      rpetDefinitionSchema.parse({ ...validRpet, frames: incompleteFrames })
    ).toThrow();
  });
});
