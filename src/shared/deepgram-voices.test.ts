import { describe, expect, it } from 'vitest';
import {
  DEEPGRAM_FLUX_ENGLISH_VOICES,
  DEEPGRAM_TTS_SPEED_MAX,
  DEEPGRAM_TTS_SPEED_MIN,
  DEFAULT_DEEPGRAM_TTS_MODEL,
  DEFAULT_DEEPGRAM_TTS_SPEED,
  isKnownDeepgramVoiceModel,
  isValidDeepgramTtsSpeed,
  normalizeDeepgramTtsSpeed,
  normalizeDeepgramVoiceModel,
} from './deepgram-voices';

describe('deepgram voice catalog', () => {
  it('only lists flux voices, since v2/speak rejects aura-2 models', () => {
    for (const voice of DEEPGRAM_FLUX_ENGLISH_VOICES) {
      expect(voice.model).toMatch(/^flux-[a-z]+-en$/);
    }
  });

  it('has the default model in the catalog', () => {
    expect(isKnownDeepgramVoiceModel(DEFAULT_DEEPGRAM_TTS_MODEL)).toBe(true);
  });

  it('rejects the aura-2 names that predate the Flux upgrade', () => {
    expect(isKnownDeepgramVoiceModel('aura-2-apollo-en')).toBe(false);
  });
});

describe('isValidDeepgramTtsSpeed', () => {
  it('accepts the bounds and the default', () => {
    expect(isValidDeepgramTtsSpeed(DEEPGRAM_TTS_SPEED_MIN)).toBe(true);
    expect(isValidDeepgramTtsSpeed(DEEPGRAM_TTS_SPEED_MAX)).toBe(true);
    expect(isValidDeepgramTtsSpeed(DEFAULT_DEEPGRAM_TTS_SPEED)).toBe(true);
  });

  it('rejects out-of-range speeds', () => {
    expect(isValidDeepgramTtsSpeed(0.45)).toBe(false);
    expect(isValidDeepgramTtsSpeed(1.55)).toBe(false);
  });

  it('rejects in-range speeds off the 0.05 grid', () => {
    // The bounds check alone would let these through, and Deepgram 400s on
    // them at connect time.
    expect(isValidDeepgramTtsSpeed(0.72)).toBe(false);
    expect(isValidDeepgramTtsSpeed(1.31)).toBe(false);
  });

  it('accepts grid values that float arithmetic gets wrong', () => {
    // `1.15 % 0.05` is 0.049999... in binary floating point, so a naive
    // modulo check would reject every one of these.
    expect(isValidDeepgramTtsSpeed(1.15)).toBe(true);
    expect(isValidDeepgramTtsSpeed(1.3)).toBe(true);
    expect(isValidDeepgramTtsSpeed(0.85)).toBe(true);
  });

  it('rejects non-finite values', () => {
    expect(isValidDeepgramTtsSpeed(Number.NaN)).toBe(false);
    expect(isValidDeepgramTtsSpeed(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('normalizeDeepgramTtsSpeed', () => {
  it('leaves an already-valid speed untouched', () => {
    expect(normalizeDeepgramTtsSpeed(1.3)).toBe(1.3);
    expect(normalizeDeepgramTtsSpeed(DEEPGRAM_TTS_SPEED_MIN)).toBe(DEEPGRAM_TTS_SPEED_MIN);
  });

  it('clamps a speed from a backup that predates the current bounds', () => {
    expect(normalizeDeepgramTtsSpeed(0.1)).toBe(DEEPGRAM_TTS_SPEED_MIN);
    expect(normalizeDeepgramTtsSpeed(3)).toBe(DEEPGRAM_TTS_SPEED_MAX);
  });

  it('snaps an off-grid speed onto the grid', () => {
    expect(normalizeDeepgramTtsSpeed(0.72)).toBe(0.7);
    expect(normalizeDeepgramTtsSpeed(1.31)).toBe(1.3);
  });

  it('falls back to the default for non-finite input', () => {
    expect(normalizeDeepgramTtsSpeed(Number.NaN)).toBe(DEFAULT_DEEPGRAM_TTS_SPEED);
  });

  it('always returns a speed the validator accepts', () => {
    for (const speed of [0.1, 0.72, 1.31, 1.15, 3, Number.NaN]) {
      expect(isValidDeepgramTtsSpeed(normalizeDeepgramTtsSpeed(speed))).toBe(true);
    }
  });
});

describe('normalizeDeepgramVoiceModel', () => {
  it('keeps a known flux voice', () => {
    expect(normalizeDeepgramVoiceModel('flux-cliff-en')).toBe('flux-cliff-en');
  });

  it('remaps a pre-upgrade aura-2 voice to the default', () => {
    expect(normalizeDeepgramVoiceModel('aura-2-apollo-en')).toBe(DEFAULT_DEEPGRAM_TTS_MODEL);
  });

  it('remaps an unknown or retired voice to the default', () => {
    expect(normalizeDeepgramVoiceModel('flux-nonexistent-en')).toBe(DEFAULT_DEEPGRAM_TTS_MODEL);
    expect(normalizeDeepgramVoiceModel('')).toBe(DEFAULT_DEEPGRAM_TTS_MODEL);
  });
});
