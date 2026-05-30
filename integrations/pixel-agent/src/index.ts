/**
 * @hermes/pixel-agent — Bridge between Pixel-Agent platform and Hermes runtime.
 *
 * Provides adapters that translate Pixel-Agent agent/swarm events into
 * Hermes events that drive pet state transitions and visual rendering.
 *
 * Integration pattern:
 *   Pixel-Agent services → emit Hermes events → EventBus → StateMachine → pet.state_changed
 */

export { SwarmEventAdapter } from "./SwarmEventAdapter.js";
export { HeartbeatDecorator } from "./HeartbeatDecorator.js";
export { AgentExecutorBridge } from "./AgentExecutorBridge.js";
