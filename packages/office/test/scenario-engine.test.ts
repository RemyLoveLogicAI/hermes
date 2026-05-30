import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioEngine } from '../src/scene/ScenarioEngine.js';

describe('ScenarioEngine', () => {
  let engine: ScenarioEngine;

  beforeEach(() => {
    engine = new ScenarioEngine();
  });

  it('resolves build work to hearthworks', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'build');
    expect(scene).not.toBeNull();
    expect(scene!.districtId).toBe('hearthworks');
    expect(scene!.sceneState).toBe('build');
  });

  it('resolves patch work to hearthworks', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'hotfix');
    expect(scene!.districtId).toBe('hearthworks');
    expect(scene!.sceneState).toBe('patch');
  });

  it('resolves archive work to stacks', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'query');
    expect(scene!.districtId).toBe('stacks');
    expect(scene!.sceneState).toBe('inspect');
  });

  it('resolves approval work to thresholds', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'validate');
    expect(scene!.districtId).toBe('thresholds');
    expect(scene!.sceneState).toBe('alert');
  });

  it('resolves delivery work to courier-lanes', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'ship');
    expect(scene!.districtId).toBe('courier-lanes');
    expect(scene!.sceneState).toBe('build');
  });

  it('resolves repair work to repair-yard', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'cleanup');
    expect(scene!.districtId).toBe('repair-yard');
    expect(scene!.sceneState).toBe('rest');
  });

  it('returns null for unknown work type', () => {
    const scene = engine.resolveScene('agent-1', 'pet-1', 'unknown-xyz');
    expect(scene).toBeNull();
  });

  it('tracks active scenes', () => {
    engine.resolveScene('agent-1', 'pet-1', 'build');
    engine.resolveScene('agent-2', 'pet-2', 'analyze');
    expect(engine.listActiveScenes()).toHaveLength(2);
  });

  it('clears active scenes', () => {
    engine.resolveScene('agent-1', 'pet-1', 'build');
    engine.clearScene('agent-1');
    expect(engine.getActiveScene('agent-1')).toBeUndefined();
  });
});
