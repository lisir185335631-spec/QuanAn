/**
 * ai-video.test.ts — ai-video constants 单测
 */
import { describe, expect, it } from 'vitest';

import {
  AI_VIDEO_MOCK_SHOTS,
  AI_VIDEO_PLATFORMS,
  AI_VIDEO_ADVICE,
  AI_VIDEO_EMPTY_BULLETS,
  AI_VIDEO_DEFAULT_DEMO_SCRIPT,
  AI_VIDEO_TIMELINE_SEGMENTS,
} from '../ai-video';

describe('AI_VIDEO_MOCK_SHOTS', () => {
  it('has 10 shots', () => {
    expect(AI_VIDEO_MOCK_SHOTS).toHaveLength(10);
  });

  it('shot nums are 01-10', () => {
    const nums = AI_VIDEO_MOCK_SHOTS.map((s) => s.num);
    expect(nums).toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  });

  it('all shots have required fields (non-empty strings)', () => {
    for (const shot of AI_VIDEO_MOCK_SHOTS) {
      expect(shot.num).toBeTruthy();
      expect(shot.duration).toBeTruthy();
      expect(shot.framing).toBeTruthy();
      expect(shot.scene).toBeTruthy();
      expect(shot.dialogue).toBeTruthy();
      expect(shot.subtitle).toBeTruthy();
    }
  });

  it('framing values are valid (中景/近景/特写)', () => {
    const validFramings = new Set(['中景', '近景', '特写']);
    for (const shot of AI_VIDEO_MOCK_SHOTS) {
      expect(validFramings.has(shot.framing)).toBe(true);
    }
  });

  it('SHOT 09 framing is 特写', () => {
    const shot09 = AI_VIDEO_MOCK_SHOTS.find((s) => s.num === '09');
    expect(shot09?.framing).toBe('特写');
  });
});

describe('AI_VIDEO_PLATFORMS', () => {
  it('has 5 platforms', () => {
    expect(AI_VIDEO_PLATFORMS).toHaveLength(5);
  });

  it('includes all expected keys', () => {
    const keys = AI_VIDEO_PLATFORMS.map((p) => p.key);
    expect(keys).toContain('douyin');
    expect(keys).toContain('kuaishou');
    expect(keys).toContain('xiaohongshu');
    expect(keys).toContain('bilibili');
    expect(keys).toContain('wechat_video');
  });

  it('each platform has emoji field', () => {
    for (const p of AI_VIDEO_PLATFORMS) {
      expect(p.emoji).toBeTruthy();
    }
  });
});

describe('AI_VIDEO_ADVICE', () => {
  it('has 3 advice cards', () => {
    expect(AI_VIDEO_ADVICE).toHaveLength(3);
  });

  it('ids are shooting/editing/music', () => {
    const ids = AI_VIDEO_ADVICE.map((a) => a.id);
    expect(ids).toContain('shooting');
    expect(ids).toContain('editing');
    expect(ids).toContain('music');
  });
});

describe('AI_VIDEO_EMPTY_BULLETS', () => {
  it('has 4 bullets', () => {
    expect(AI_VIDEO_EMPTY_BULLETS).toHaveLength(4);
  });
});

describe('AI_VIDEO_DEFAULT_DEMO_SCRIPT', () => {
  it('is longer than 700 characters (approximates ~797)', () => {
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT.length).toBeGreaterThan(700);
  });

  it('contains key section markers', () => {
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【标题】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【话题抛出】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【正方】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【反方】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【我的立场】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【评论区引导】');
    expect(AI_VIDEO_DEFAULT_DEMO_SCRIPT).toContain('【话题标签】');
  });
});

describe('AI_VIDEO_TIMELINE_SEGMENTS', () => {
  it('has 10 segments', () => {
    expect(AI_VIDEO_TIMELINE_SEGMENTS).toHaveLength(10);
  });

  it('first segment is 3s and last is 10s', () => {
    expect(AI_VIDEO_TIMELINE_SEGMENTS[0]).toBe('3s');
    expect(AI_VIDEO_TIMELINE_SEGMENTS[9]).toBe('10s');
  });
});
