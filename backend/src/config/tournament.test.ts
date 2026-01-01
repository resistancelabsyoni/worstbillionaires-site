import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCurrentRound, isVotingOpen, ROUNDS } from './tournament';

describe('Tournament Config', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentRound', () => {
    it('should return 0 when before tournament starts', () => {
      // Set date before first round
      vi.setSystemTime(new Date('2025-12-31T23:59:59Z'));
      expect(getCurrentRound()).toBe(0);
    });

    it('should return 1 during first round', () => {
      // Set date during round 1
      vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
      expect(getCurrentRound()).toBe(1);
    });

    it('should return 0 when after tournament ends', () => {
      // Set date after last round
      const lastRound = ROUNDS[ROUNDS.length - 1];
      vi.setSystemTime(new Date(lastRound.end));
      vi.advanceTimersByTime(1000); // 1 second after end
      expect(getCurrentRound()).toBe(0);
    });

    it('should handle round boundaries correctly', () => {
      // Test exact start time
      vi.setSystemTime(new Date(ROUNDS[0].start));
      expect(getCurrentRound()).toBe(1);

      // Test exact end time
      vi.setSystemTime(new Date(ROUNDS[0].end));
      expect(getCurrentRound()).toBe(1);

      // Test 1ms after end time
      vi.setSystemTime(new Date(ROUNDS[0].end));
      vi.advanceTimersByTime(1);
      expect(getCurrentRound()).toBe(0);
    });
  });

  describe('isVotingOpen', () => {
    it('should return false when no round is active', () => {
      vi.setSystemTime(new Date('2025-12-31T23:59:59Z'));
      expect(isVotingOpen()).toBe(false);
    });

    it('should return true during active round', () => {
      vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
      expect(isVotingOpen()).toBe(true);
    });

    it('should return false after tournament ends', () => {
      const lastRound = ROUNDS[ROUNDS.length - 1];
      vi.setSystemTime(new Date(lastRound.end));
      vi.advanceTimersByTime(1000);
      expect(isVotingOpen()).toBe(false);
    });
  });
});
