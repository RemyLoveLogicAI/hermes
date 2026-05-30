import { describe, it, expect } from 'vitest';
import { SpeciesRegistry } from '../src/species/SpeciesRegistry.js';

const validRpet = {
  formatVersion: 1 as const,
  id: 'test-pet',
  displayName: 'Test Pet',
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

describe('SpeciesRegistry', () => {
  it('registers and retrieves a species', () => {
    const registry = new SpeciesRegistry();
    registry.register('test-pet', validRpet);
    const entry = registry.get('test-pet');
    expect(entry).toBeDefined();
    expect(entry!.displayName).toBe('Test Pet');
  });

  it('sets first species as default', () => {
    const registry = new SpeciesRegistry();
    registry.register('first', validRpet);
    const def = registry.getDefault();
    expect(def).toBeDefined();
    expect(def!.id).toBe('first');
  });

  it('respects explicit default flag', () => {
    const registry = new SpeciesRegistry();
    registry.register('first', validRpet);
    registry.register('second', { ...validRpet, id: 'second', displayName: 'Second' }, true);
    const def = registry.getDefault();
    expect(def!.id).toBe('second');
  });

  it('lists all species', () => {
    const registry = new SpeciesRegistry();
    registry.register('a', validRpet);
    registry.register('b', { ...validRpet, id: 'b', displayName: 'B' });
    expect(registry.list()).toHaveLength(2);
  });

  it('checks if species exists', () => {
    const registry = new SpeciesRegistry();
    registry.register('x', validRpet);
    expect(registry.has('x')).toBe(true);
    expect(registry.has('y')).toBe(false);
  });

  it('returns frame count for a state', () => {
    const rpetWithMultipleFrames = {
      ...validRpet,
      frames: {
        ...validRpet.frames,
        idle: [Array(16).fill('CCCCCCCCCCCCCCCC'), Array(16).fill('CCCCCCCCCCCCCCCC'), Array(16).fill('CCCCCCCCCCCCCCCC')],
      },
    };
    const registry = new SpeciesRegistry();
    registry.register('multi', rpetWithMultipleFrames);
    expect(registry.getFrameCount('multi', 'idle')).toBe(3);
    expect(registry.getFrameCount('multi', 'alert')).toBe(1);
  });

  it('returns 0 for unregistered species', () => {
    const registry = new SpeciesRegistry();
    expect(registry.getFrameCount('none', 'idle')).toBe(0);
  });

  it('returns undefined for unregistered species get', () => {
    const registry = new SpeciesRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });
});
