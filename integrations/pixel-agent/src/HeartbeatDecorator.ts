import type { EventBus, HermesEvent, AgentStatus } from "@hermes/core";

/**
 * Wraps the Pixel-Agent heartbeat execution flow to emit Hermes events
 * when agent status changes.
 *
 * Agent status → pet state mapping:
 *   idle → idle
 *   thinking → talking
 *   executing → alert
 *   waiting_approval → alert
 *   error → alert (then settles to idle)
 *   circuit_open → sleeping
 *   terminated → sleeping (permanent)
 *
 * Usage: inject into heartbeatRunner.executeOne() to emit events alongside
 * the db.update(agentsTable) calls.
 */
export class HeartbeatDecorator {
  private bus: EventBus;
  private companyId: string;
  private agentId: string;

  constructor(bus: EventBus, companyId: string, agentId: string) {
    this.bus = bus;
    this.companyId = companyId;
    this.agentId = agentId;
  }

  private baseEvent<T extends HermesEvent["type"]>(type: T, payload: unknown): HermesEvent {
    return {
      id: crypto.randomUUID(),
      type,
      bus: "agent",
      actorId: this.agentId,
      companyId: this.companyId,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  /**
   * Emit an agent state changed event when the agent status transitions.
   * Call this right after the db.update(agentsTable).set({ status }) call.
   */
  emitStateChange(status: AgentStatus, metadata?: Record<string, unknown>): void {
    this.bus.publish(this.baseEvent("agent.state_changed", {
      agentId: this.agentId,
      companyId: this.companyId,
      status,
      ...metadata,
    }));
  }
}
