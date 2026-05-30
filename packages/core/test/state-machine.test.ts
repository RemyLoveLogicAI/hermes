import { describe, it, expect } from 'vitest';
import { translateAgentToPet, translateSwarmToPet } from '../src/state-machine/transitions.js';
import { AGENT_TO_PET_MAP, SWARM_TO_PET_MAP, pickHighestPriority } from '../src/state-machine/agent-pet-map.js';

describe('agent-pet-map', () => {
  it('maps all agent statuses to pet states', () => {
    const statuses = ['idle', 'thinking', 'executing', 'waiting_approval', 'error', 'circuit_open', 'terminated'] as const;
    for (const status of statuses) {
      expect(AGENT_TO_PET_MAP[status]).toBeDefined();
    }
  });

  it('maps all swarm phases to pet states', () => {
    const phases = ['proposed', 'pending_approval', 'spawning', 'executing', 'synthesizing', 'completed', 'failed', 'dissolved', 'cancelled'];
    for (const phase of phases) {
      expect(SWARM_TO_PET_MAP[phase]).toBeDefined();
    }
  });

  it('alert has highest priority', () => {
    expect(pickHighestPriority(['idle', 'alert', 'sleeping'])).toBe('alert');
  });

  it('talking beats idle', () => {
    expect(pickHighestPriority(['idle', 'talking'])).toBe('talking');
  });

  it('returns idle for empty array', () => {
    expect(pickHighestPriority([])).toBe('idle');
  });
});

describe('translateAgentToPet', () => {
  it('translates idle → idle', () => {
    expect(translateAgentToPet('idle')).toBe('idle');
  });

  it('translates thinking → talking', () => {
    expect(translateAgentToPet('thinking')).toBe('talking');
  });

  it('translates executing → alert', () => {
    expect(translateAgentToPet('executing')).toBe('alert');
  });

  it('translates error → alert', () => {
    expect(translateAgentToPet('error')).toBe('alert');
  });

  it('translates circuit_open → sleeping', () => {
    expect(translateAgentToPet('circuit_open')).toBe('sleeping');
  });

  it('translates terminated → sleeping', () => {
    expect(translateAgentToPet('terminated')).toBe('sleeping');
  });
});

describe('translateSwarmToPet', () => {
  it('translates spawning → happy', () => {
    expect(translateSwarmToPet('spawning')).toBe('happy');
  });

  it('translates executing → alert', () => {
    expect(translateSwarmToPet('executing')).toBe('alert');
  });

  it('translates synthesizing → talking', () => {
    expect(translateSwarmToPet('synthesizing')).toBe('talking');
  });

  it('translates completed → happy', () => {
    expect(translateSwarmToPet('completed')).toBe('happy');
  });

  it('translates failed → alert', () => {
    expect(translateSwarmToPet('failed')).toBe('alert');
  });

  it('translates dissolved → idle', () => {
    expect(translateSwarmToPet('dissolved')).toBe('idle');
  });
});

describe('StateMachine integration', () => {
  it('registers and tracks pet state', async () => {
    const { EventBus } = await import('../src/event-bus/EventBus.js');
    const { StateMachine } = await import('../src/state-machine/StateMachine.js');

    const bus = new EventBus();
    const sm = new StateMachine({ bus, minHoldMs: 0 });

    sm.registerPet({
      petId: 'pet-1',
      agentId: 'agent-1',
      companyId: 'co-1',
      currentState: 'idle',
      speciesId: 'frygar',
    });

    sm.start();

    // Publish an agent state change
    bus.publish({
      id: 'evt-1',
      type: 'agent.state_changed',
      bus: 'agent',
      actorId: 'agent-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'thinking' },
    });

    expect(sm.getPetState('pet-1')).toBe('talking');

    sm.stop();
  });

  it('picks highest priority when multiple states compete', async () => {
    const { EventBus } = await import('../src/event-bus/EventBus.js');
    const { StateMachine } = await import('../src/state-machine/StateMachine.js');

    const bus = new EventBus();
    const sm = new StateMachine({ bus, minHoldMs: 0 });

    sm.registerPet({
      petId: 'pet-1',
      agentId: 'agent-1',
      companyId: 'co-1',
      currentState: 'idle',
      speciesId: 'frygar',
    });

    sm.start();

    // Send thinking (→ talking) then error (→ alert)
    bus.publish({
      id: 'evt-1',
      type: 'agent.state_changed',
      bus: 'agent',
      actorId: 'agent-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'thinking' },
    });

    bus.publish({
      id: 'evt-2',
      type: 'agent.state_changed',
      bus: 'agent',
      actorId: 'agent-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'error' },
    });

    // Alert should win over talking
    expect(sm.getPetState('pet-1')).toBe('alert');

    sm.stop();
  });

  it('publishes pet.state_changed events', async () => {
    const { EventBus } = await import('../src/event-bus/EventBus.js');
    const { StateMachine } = await import('../src/state-machine/StateMachine.js');

    const bus = new EventBus();
    const sm = new StateMachine({ bus, minHoldMs: 0 });

    sm.registerPet({
      petId: 'pet-1',
      agentId: 'agent-1',
      companyId: 'co-1',
      currentState: 'idle',
      speciesId: 'frygar',
    });

    sm.start();

    const receivedEvents: any[] = [];
    bus.subscribe((event) => receivedEvents.push(event), { type: 'pet.state_changed' });

    bus.publish({
      id: 'evt-1',
      type: 'agent.state_changed',
      bus: 'agent',
      actorId: 'agent-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'executing' },
    });

    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].payload.to).toBe('alert');
    expect(receivedEvents[0].payload.from).toBe('idle');

    sm.stop();
  });
});
