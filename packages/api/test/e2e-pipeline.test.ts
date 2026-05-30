import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus, StateMachine, Animator } from '@hermes/core';
import { loadRpet } from '@hermes/pets';
import { DistrictManager, ScenarioEngine, ArtifactSystem } from '@hermes/office';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRYGAR_PATH = path.resolve(__dirname, '../../../../hermes-harness/tests/fixtures/frygar.rpet');

// ── Integration test: full Hermes pipeline ───────────────────────────────────

describe('Hermes end-to-end pipeline', () => {
  let bus: EventBus;
  let stateMachine: StateMachine;
  let districtManager: DistrictManager;
  let scenarioEngine: ScenarioEngine;
  let artifacts: ArtifactSystem;

  beforeEach(() => {
    bus = new EventBus();
    stateMachine = new StateMachine({ bus, minHoldMs: 0 });
    stateMachine.start();
    districtManager = new DistrictManager();
    scenarioEngine = new ScenarioEngine();
    artifacts = new ArtifactSystem();
  });

  it('translates agent heartbeat states to pet states', () => {
    const petStateChanges: string[] = [];
    bus.subscribe((event) => {
      if (event.type === 'pet.state_changed') {
        petStateChanges.push((event.payload as any).to);
      }
    }, { type: 'pet.state_changed' });

    // Register a pet instance so StateMachine can route agent events to it
    (stateMachine as any).registerPet({
      petId: 'pet-1',
      agentId: 'agent-1',
      companyId: 'company-1',
      currentState: 'idle' as any,
      speciesId: 'frygar',
    });

    // thinking → talking
    bus.publish({
      id: crypto.randomUUID(), type: 'agent.state_changed', bus: 'agent',
      actorId: 'agent-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'thinking' },
    });
    expect(petStateChanges).toContain('talking');

    // executing → alert
    bus.publish({
      id: crypto.randomUUID(), type: 'agent.state_changed', bus: 'agent',
      actorId: 'agent-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'executing' },
    });
    expect(petStateChanges).toContain('alert');

    // idle → idle (no state change published since winner === currentState)
    // First transition back to idle so next publish triggers a change
    bus.publish({
      id: crypto.randomUUID(), type: 'agent.state_changed', bus: 'agent',
      actorId: 'agent-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'idle' },
    });
    expect(petStateChanges).toContain('idle');
  });

  it('maps swarm phases to pet states', () => {
    const petStateChanges: string[] = [];
    bus.subscribe((event) => {
      if (event.type === 'pet.state_changed') {
        petStateChanges.push((event.payload as any).to);
      }
    }, { type: 'pet.state_changed' });

    // Register pets so swarm events have targets
    (stateMachine as any).registerPet({
      petId: 'pet-1', agentId: 'agent-1', companyId: 'company-1',
      currentState: 'idle' as any, speciesId: 'frygar',
    });
    (stateMachine as any).registerPet({
      petId: 'pet-2', agentId: 'agent-2', companyId: 'company-1',
      currentState: 'idle' as any, speciesId: 'frygar',
    });

    // spawning → happy
    bus.publish({
      id: crypto.randomUUID(), type: 'swarm.phase_changed', bus: 'swarm',
      actorId: 'swarm-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { swarmId: 'swarm-1', phase: 'spawning', agentIds: ['agent-1', 'agent-2'] },
    });
    expect(petStateChanges).toContain('happy');

    // executing → alert
    bus.publish({
      id: crypto.randomUUID(), type: 'swarm.phase_changed', bus: 'swarm',
      actorId: 'swarm-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { swarmId: 'swarm-1', phase: 'executing', agentIds: ['agent-1', 'agent-2'] },
    });
    expect(petStateChanges).toContain('alert');

    // synthesizing → talking
    bus.publish({
      id: crypto.randomUUID(), type: 'swarm.phase_changed', bus: 'swarm',
      actorId: 'swarm-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { swarmId: 'swarm-1', phase: 'synthesizing', agentIds: ['agent-1', 'agent-2'] },
    });
    expect(petStateChanges).toContain('talking');

    // completed → happy
    bus.publish({
      id: crypto.randomUUID(), type: 'swarm.phase_changed', bus: 'swarm',
      actorId: 'swarm-1', companyId: 'company-1', timestamp: new Date().toISOString(),
      payload: { swarmId: 'swarm-1', phase: 'completed', agentIds: ['agent-1', 'agent-2'] },
    });
    expect(petStateChanges).toContain('happy');
  });

  it('resolves work types to district scenes', () => {
    expect(scenarioEngine.resolveScene('agent-1', 'pet-1', 'build')!.districtId).toBe('hearthworks');
    expect(scenarioEngine.resolveScene('agent-2', 'pet-2', 'query')!.districtId).toBe('stacks');
    expect(scenarioEngine.resolveScene('agent-3', 'pet-3', 'approve')!.districtId).toBe('thresholds');
  });

  it('places pets in districts with capacity limits', () => {
    expect(districtManager.placePet('thresholds', 'pet-1', 'agent-1')).toBe(true);
    expect(districtManager.placePet('thresholds', 'pet-2', 'agent-2')).toBe(true);
    expect(districtManager.placePet('thresholds', 'pet-3', 'agent-3')).toBe(true);
    expect(districtManager.placePet('thresholds', 'pet-4', 'agent-4')).toBe(true);
    expect(districtManager.placePet('thresholds', 'pet-5', 'agent-5')).toBe(false);
    expect(districtManager.getPetDistrict('pet-1')).toBe('thresholds');
    expect(districtManager.getDistrictPets('thresholds')).toHaveLength(4);
  });

  it('spawns artifacts in districts', () => {
    const artifact = artifacts.spawn('approval-gate', 'thresholds', 'agent-1');
    expect(artifact.type).toBe('approval-gate');
    expect(artifacts.listByDistrict('thresholds')).toHaveLength(1);
  });

  it('loads frygar.rpet and validates all required states', () => {
    const raw = fs.readFileSync(FRYGAR_PATH, 'utf-8');
    const pet = loadRpet(JSON.parse(raw));

    expect(pet.id).toBe('frygar');
    expect(pet.displayName).toBe('Frygar');
    expect(Object.keys(pet.palette)).toHaveLength(8);

    const requiredStates = ['idle', 'alert', 'talking', 'sleeping', 'happy', 'lookLeft', 'lookRight', 'jump'];
    for (const state of requiredStates) {
      expect(Object.keys(pet.frames)).toContain(state);
      const frames = pet.frames[state];
      expect(frames.length).toBeGreaterThan(0);
      for (const frame of frames) {
        expect(frame).toHaveLength(16);
        for (const row of frame) {
          expect(row).toHaveLength(16);
        }
      }
    }
  });

  it('animator schedules frames for loaded .rpet', () => {
    const raw = fs.readFileSync(FRYGAR_PATH, 'utf-8');
    const pet = loadRpet(JSON.parse(raw));

    const animator = new Animator();
    animator.start('idle', pet.frames.idle.length);

    expect(animator.getCurrentFrame()).toBe(0);
    expect(animator.getState()!.stateName).toBe('idle');
    expect(animator.getState()!.totalFrames).toBe(pet.frames.idle.length);
  });
});
