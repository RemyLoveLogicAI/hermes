import type { EventBus, HermesEvent, SwarmPhase } from "@hermes/core";

/**
 * Subscribes to Pixel-Agent swarm phase changes and emits corresponding
 * Hermes events that trigger pet state transitions.
 *
 * Swarm phase → pet state mapping:
 *   spawning → happy
 *   executing → alert
 *   synthesizing → talking
 *   completed → happy → idle
 *   failed → alert → idle
 *   dissolved/cancelled → idle
 */
export class SwarmEventAdapter {
  private bus: EventBus;
  private companyId: string;
  private swarmId: string;

  constructor(bus: EventBus, companyId: string, swarmId: string) {
    this.bus = bus;
    this.companyId = companyId;
    this.swarmId = swarmId;
  }

  private baseEvent<T extends HermesEvent["type"]>(type: T, payload: unknown): HermesEvent {
    return {
      id: crypto.randomUUID(),
      type,
      bus: "swarm",
      actorId: this.swarmId,
      companyId: this.companyId,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  /**
   * Emit a swarm phase changed event that the Hermes StateMachine will
   * translate into pet state transitions.
   */
  emitPhaseChange(phase: SwarmPhase, metadata?: Record<string, unknown>): void {
    this.bus.publish(this.baseEvent("swarm.phase_changed", {
      swarmId: this.swarmId,
      companyId: this.companyId,
      phase,
      ...metadata,
    }));
  }
}
