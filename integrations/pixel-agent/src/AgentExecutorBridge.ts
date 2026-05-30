import type { EventBus, HermesEvent } from "@hermes/core";

/**
 * Wraps the existing agentExecutor.ts stub to integrate with Hermes.
 * Emits events for execution start, completion, and errors.
 */
export class AgentExecutorBridge {
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

  async execute(
    heartbeatFn: () => Promise<{ decision: unknown; cost_usd: number; latency_ms: number }>,
  ): Promise<{ decision: unknown; cost_usd: number; latency_ms: number }> {
    this.bus.publish(this.baseEvent("agent.executing", {
      agentId: this.agentId,
      companyId: this.companyId,
    }));

    try {
      const result = await heartbeatFn();

      this.bus.publish(this.baseEvent("agent.completed", {
        agentId: this.agentId,
        companyId: this.companyId,
        costUsd: result.cost_usd,
        latencyMs: result.latency_ms,
      }));

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      this.bus.publish(this.baseEvent("agent.error", {
        agentId: this.agentId,
        companyId: this.companyId,
        error: errMsg,
      }));

      throw error;
    }
  }
}
