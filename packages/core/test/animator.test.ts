import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Animator } from '../src/animator/Animator.js';

describe('Animator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with frame 0', () => {
    const animator = new Animator();
    animator.start('idle', 3);
    expect(animator.getCurrentFrame()).toBe(0);
  });

  it('returns null when no animation is active', () => {
    const animator = new Animator();
    expect(animator.tick()).toBeNull();
  });

  it('advances frames based on elapsed time', () => {
    const animator = new Animator();
    animator.start('idle', 3, { frameDurationMs: 100, loop: true });

    // Move time forward by 150ms (past the 100ms frame duration)
    vi.advanceTimersByTime(150);

    const frame = animator.tick();
    expect(frame).toBe(1);
  });

  it('loops when loop is true', () => {
    const animator = new Animator();
    animator.start('idle', 2, { frameDurationMs: 100, loop: true });

    // Advance past both frames (200ms) plus a bit more
    vi.advanceTimersByTime(250);
    animator.tick();
    expect(animator.getCurrentFrame()).toBe(0); // Should have looped
  });

  it('does not loop when loop is false', () => {
    const animator = new Animator();
    animator.start('jump', 2, { frameDurationMs: 100, loop: false });

    // Advance past both frames (200ms) plus a bit more
    vi.advanceTimersByTime(250);
    animator.tick();
    expect(animator.getCurrentFrame()).toBe(1); // Stays on last frame
    expect(animator.isComplete()).toBe(true);
  });

  it('resets to null state', () => {
    const animator = new Animator();
    animator.start('idle', 3);
    animator.reset();
    expect(animator.getCurrentFrame()).toBe(0);
    expect(animator.getState()).toBeNull();
  });

  it('returns animation state', () => {
    const animator = new Animator();
    animator.start('alert', 4, { frameDurationMs: 200, loop: true });
    const state = animator.getState();
    expect(state).not.toBeNull();
    expect(state!.stateName).toBe('alert');
    expect(state!.totalFrames).toBe(4);
    expect(state!.timing.loop).toBe(true);
  });
});
