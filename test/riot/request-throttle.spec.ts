import { describe, expect, it } from 'vitest';
import { RequestThrottle } from '../../src/modules/riot/request-throttle';

describe('RequestThrottle', () => {
  it('runs tasks sequentially with the configured spacing', async () => {
    const throttle = new RequestThrottle(30);
    const startedAt: Array<number> = [];
    const task = async (value: number) => {
      startedAt.push(Date.now());
      return value;
    };

    const results = await Promise.all([1, 2, 3].map((value) => throttle.schedule(() => task(value))));

    expect(results).toEqual([1, 2, 3]);
    expect(startedAt[1] - startedAt[0]).toBeGreaterThanOrEqual(25);
    expect(startedAt[2] - startedAt[1]).toBeGreaterThanOrEqual(25);
  });

  it('keeps the queue alive after a failing task', async () => {
    const throttle = new RequestThrottle(0);
    await expect(throttle.schedule(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(throttle.schedule(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});
