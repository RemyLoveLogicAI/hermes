import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../src/event-bus/EventBus.js';
import type { HermesEvent } from '../src/types/events.js';

describe('EventBus', () => {
  it('publishes events to all subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe(handler);

    const event: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('filters by event type', () => {
    const bus = new EventBus();
    const petHandler = vi.fn();
    const agentHandler = vi.fn();
    bus.subscribe(petHandler, { type: 'pet.state_changed' });
    bus.subscribe(agentHandler, { type: 'agent.state_changed' });

    const petEvent: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    bus.publish(petEvent);

    expect(petHandler).toHaveBeenCalledTimes(1);
    expect(agentHandler).not.toHaveBeenCalled();
  });

  it('filters by bus', () => {
    const bus = new EventBus();
    const petBusHandler = vi.fn();
    const agentBusHandler = vi.fn();
    bus.subscribe(petBusHandler, { bus: 'pet' });
    bus.subscribe(agentBusHandler, { bus: 'agent' });

    const event: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    bus.publish(event);

    expect(petBusHandler).toHaveBeenCalledTimes(1);
    expect(agentBusHandler).not.toHaveBeenCalled();
  });

  it('unsubscribes correctly', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.subscribe(handler);

    unsub();

    const event: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    bus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('logs events to history', () => {
    const bus = new EventBus();
    const event: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    bus.publish(event);

    const history = bus.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('evt-1');
  });

  it('filters history by type', () => {
    const bus = new EventBus();
    const petEvent: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };
    const agentEvent: HermesEvent = {
      id: 'evt-2',
      type: 'agent.state_changed',
      bus: 'agent',
      actorId: 'agent-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { agentId: 'agent-1', status: 'thinking' } as any,
    };
    bus.publish(petEvent);
    bus.publish(agentEvent);

    const petHistory = bus.getHistory({ type: 'pet.state_changed' });
    expect(petHistory).toHaveLength(1);
  });

  it('handles handler errors without blocking other subscribers', () => {
    const bus = new EventBus();
    const errorHandler = vi.fn(() => { throw new Error('boom'); });
    const goodHandler = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.subscribe(errorHandler);
    bus.subscribe(goodHandler);

    const event: HermesEvent = {
      id: 'evt-1',
      type: 'pet.state_changed',
      bus: 'pet',
      actorId: 'pet-1',
      companyId: 'co-1',
      timestamp: new Date().toISOString(),
      payload: { petId: 'pet-1', agentId: 'agent-1', from: 'idle', to: 'alert', frameIndex: 0 },
    };

    expect(() => bus.publish(event)).not.toThrow();
    expect(goodHandler).toHaveBeenCalledWith(event);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
