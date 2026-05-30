import { describe, it, expect, beforeEach } from 'vitest';
import { DistrictManager } from '../src/district/DistrictManager.js';
import { DEFAULT_DISTRICTS } from '../src/data/districts.js';

describe('DistrictManager', () => {
  let dm: DistrictManager;

  beforeEach(() => {
    dm = new DistrictManager();
  });

  it('registers default districts', () => {
    const list = dm.list();
    expect(list).toHaveLength(DEFAULT_DISTRICTS.length);
  });

  it('gets a district by id', () => {
    const district = dm.get('hearthworks');
    expect(district).toBeDefined();
    expect(district!.displayName).toBe('The Hearthworks');
  });

  it('returns capacity for a district', () => {
    expect(dm.getCapacity('hearthworks')).toBe(8);
    expect(dm.getCapacity('thresholds')).toBe(4);
  });

  it('places pets up to capacity', () => {
    const id = 'thresholds'; // capacity 4
    expect(dm.placePet(id, 'pet-1', 'agent-1')).toBe(true);
    expect(dm.placePet(id, 'pet-2', 'agent-2')).toBe(true);
    expect(dm.placePet(id, 'pet-3', 'agent-3')).toBe(true);
    expect(dm.placePet(id, 'pet-4', 'agent-4')).toBe(true);
    expect(dm.placePet(id, 'pet-5', 'agent-5')).toBe(false); // at capacity
  });

  it('tracks current count', () => {
    dm.placePet('stacks', 'pet-1', 'agent-1');
    dm.placePet('stacks', 'pet-2', 'agent-2');
    expect(dm.getCurrentCount('stacks')).toBe(2);
  });

  it('finds pet district', () => {
    dm.placePet('chorus', 'pet-1', 'agent-1');
    expect(dm.getPetDistrict('pet-1')).toBe('chorus');
    expect(dm.getPetDistrict('unknown')).toBeNull();
  });

  it('removes pet from district', () => {
    dm.placePet('observatory', 'pet-1', 'agent-1');
    const removed = dm.removePet('pet-1');
    expect(removed).toBe('observatory');
    expect(dm.getCurrentCount('observatory')).toBe(0);
    expect(dm.getPetDistrict('pet-1')).toBeNull();
  });

  it('lists district pets', () => {
    dm.placePet('hearthworks', 'pet-1', 'agent-1');
    dm.placePet('hearthworks', 'pet-2', 'agent-2');
    const pets = dm.getDistrictPets('hearthworks');
    expect(pets).toHaveLength(2);
  });

  it('returns supported artifacts', () => {
    const artifacts = dm.getSupportedArtifacts('thresholds');
    expect(artifacts).toContain('approval-gate');
    expect(artifacts).not.toContain('patch-card');
  });

  it('accepts custom district config', () => {
    const custom = new DistrictManager([{
      ...DEFAULT_DISTRICTS[0],
      customMaxPets: 20,
    }]);
    expect(custom.getCapacity('hearthworks')).toBe(20);
  });
});
