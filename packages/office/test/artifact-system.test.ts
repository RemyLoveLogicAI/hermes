import { describe, it, expect, beforeEach } from 'vitest';
import { ArtifactSystem } from '../src/artifact/ArtifactSystem.js';

describe('ArtifactSystem', () => {
  let as: ArtifactSystem;

  beforeEach(() => {
    as = new ArtifactSystem();
  });

  it('has all artifact definitions', () => {
    const defs = as.listDefinitions();
    expect(defs).toHaveLength(5);
  });

  it('gets definition by type', () => {
    const def = as.getDefinition('approval-gate');
    expect(def.displayName).toBe('Approval Gate');
  });

  it('spawns artifacts', () => {
    const artifact = as.spawn('patch-card', 'hearthworks', 'agent-1');
    expect(artifact.id).toMatch(/^artifact-/);
    expect(artifact.type).toBe('patch-card');
    expect(artifact.districtId).toBe('hearthworks');
  });

  it('lists artifacts by district', () => {
    as.spawn('patch-card', 'hearthworks', 'agent-1');
    as.spawn('result-card', 'hearthworks', 'agent-2');
    as.spawn('memory-crate', 'stacks', 'agent-3');

    const hearthworks = as.listByDistrict('hearthworks');
    expect(hearthworks).toHaveLength(2);
  });

  it('lists artifacts by agent', () => {
    as.spawn('patch-card', 'hearthworks', 'agent-1');
    as.spawn('result-card', 'stacks', 'agent-1');
    as.spawn('memory-crate', 'stacks', 'agent-2');

    const agent1 = as.listByAgent('agent-1');
    expect(agent1).toHaveLength(2);
  });

  it('resolves artifacts', () => {
    const a = as.spawn('approval-gate', 'thresholds', 'agent-1');
    const resolved = as.resolve(a.id);
    expect(resolved).toBeDefined();
    expect(as.get(a.id)).toBeUndefined();
  });

  it('clears district artifacts', () => {
    as.spawn('patch-card', 'hearthworks', 'agent-1');
    as.spawn('result-card', 'hearthworks', 'agent-2');
    as.spawn('memory-crate', 'stacks', 'agent-3');

    const count = as.clearDistrict('hearthworks');
    expect(count).toBe(2);
    expect(as.listByDistrict('hearthworks')).toHaveLength(0);
    expect(as.listByDistrict('stacks')).toHaveLength(1);
  });
});
