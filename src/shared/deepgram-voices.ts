/**
 * Deepgram Flux TTS English voices. Deepgram has no API to list voices
 * programmatically, so this is a hardcoded snapshot of the documented
 * catalog (developers.deepgram.com/docs/flux-tts/voices),
 * `flux-[voicename]-[language]` (e.g. flux-haley-en).
 */

export interface DeepgramVoiceOption {
  model: string;
  name: string;
  description?: string;
}

export const DEEPGRAM_FLUX_ENGLISH_VOICES: DeepgramVoiceOption[] = [
  { model: 'flux-hannah-en', name: 'Hannah', description: 'Clear, confident, thoughtful' },
  { model: 'flux-kit-en', name: 'Kit', description: 'Friendly, energetic, thoughtful' },
  { model: 'flux-alexis-en', name: 'Alexis', description: 'Clear, professional, calm' },
  { model: 'flux-cliff-en', name: 'Cliff', description: 'Deep, confident, calm' },
  { model: 'flux-sienna-en', name: 'Sienna', description: 'Clear, professional, calm' },
  { model: 'flux-cole-en', name: 'Cole', description: 'Friendly, clear, interesting' },
  { model: 'flux-brooke-en', name: 'Brooke', description: 'Friendly, intelligent, fast' },
  { model: 'flux-colin-en', name: 'Colin', description: 'Warm, friendly, trustworthy' },
  { model: 'flux-gemma-en', name: 'Gemma', description: 'Friendly, kind, approachable' },
  { model: 'flux-haley-en', name: 'Haley', description: 'Clear, professional, caring' },
  { model: 'flux-heather-en', name: 'Heather', description: 'Clear, engaging, energetic' },
  { model: 'flux-miles-en', name: 'Miles', description: 'Clear, calm, professional' },
  { model: 'flux-sean-en', name: 'Sean', description: 'Friendly, kind, caring' },
  { model: 'flux-bree-en', name: 'Bree', description: 'Friendly, sweet, kind' },
  { model: 'flux-brittany-en', name: 'Brittany', description: 'Confident, kind, soft' },
  { model: 'flux-bruce-en', name: 'Bruce', description: 'Friendly, kind, natural' },
  { model: 'flux-conor-en', name: 'Conor', description: 'Confident, deep, friendly' },
  { model: 'flux-donovan-en', name: 'Donovan', description: 'Professional, calm, thoughtful' },
  { model: 'flux-drew-en', name: 'Drew', description: 'Confident, relaxed, soft' },
  { model: 'flux-elise-en', name: 'Elise', description: 'Clear, professional, calm' },
  { model: 'flux-jack-en', name: 'Jack', description: 'Confident, thoughtful, friendly' },
  { model: 'flux-kai-en', name: 'Kai', description: 'Clear, calm, professional' },
  { model: 'flux-kelsey-en', name: 'Kelsey', description: 'Clear, professional, caring' },
  { model: 'flux-maeve-en', name: 'Maeve', description: 'Friendly, energetic, confident' },
  { model: 'flux-marcelo-en', name: 'Marcelo', description: 'Clear, calm, professional' },
  { model: 'flux-marcus-en', name: 'Marcus', description: 'Friendly, helpful, smooth' },
  { model: 'flux-meena-en', name: 'Meena', description: 'Empathetic, professional, calm' },
  { model: 'flux-meghan-en', name: 'Meghan', description: 'Friendly, nice, energetic' },
  { model: 'flux-naveen-en', name: 'Naveen', description: 'Clear, professional, knowledgeable' },
  { model: 'flux-paige-en', name: 'Paige', description: 'Clear, professional, calm' },
  { model: 'flux-priya-en', name: 'Priya', description: 'Confident, empathetic, professional' },
  { model: 'flux-rufus-en', name: 'Rufus', description: 'Friendly, confident, intelligent' },
  { model: 'flux-sharon-en', name: 'Sharon', description: 'Formal, calm, relaxed' },
  { model: 'flux-tanner-en', name: 'Tanner', description: 'Professional, calm, confident' },
  { model: 'flux-wade-en', name: 'Wade', description: 'Warm, confident, clear' },
  { model: 'flux-wes-en', name: 'Wes', description: 'Thoughtful, friendly, warm' },
];

export const DEFAULT_DEEPGRAM_TTS_MODEL = 'flux-haley-en';

// Deepgram rejects speed values outside this range with a 400 for Flux TTS
// voices (0.5-1.5 in 0.05 increments), even though it isn't documented
// anywhere but the error message.
export const DEEPGRAM_TTS_SPEED_MIN = 0.5;
export const DEEPGRAM_TTS_SPEED_MAX = 1.5;
export const DEEPGRAM_TTS_SPEED_STEP = 0.05;
export const DEFAULT_DEEPGRAM_TTS_SPEED = 1;

export function isKnownDeepgramVoiceModel(model: string): boolean {
  return DEEPGRAM_FLUX_ENGLISH_VOICES.some((voice) => voice.model === model);
}

/**
 * Deepgram accepts speed only on the documented 0.05 grid — an in-range but
 * off-grid value (0.72) still 400s. Compared in integer hundredths because
 * `1.15 % 0.05` is not 0 in binary floating point.
 */
export function isValidDeepgramTtsSpeed(speed: number): boolean {
  if (!Number.isFinite(speed)) {
    return false;
  }
  if (speed < DEEPGRAM_TTS_SPEED_MIN || speed > DEEPGRAM_TTS_SPEED_MAX) {
    return false;
  }
  return Math.round(speed * 100) % Math.round(DEEPGRAM_TTS_SPEED_STEP * 100) === 0;
}

/**
 * Coerces a stored speed onto the nearest value Deepgram accepts. Used on the
 * restore path, where a backup predating the current bounds would otherwise
 * reinstate a speed that fails every TTS connection.
 */
export function normalizeDeepgramTtsSpeed(speed: number): number {
  if (!Number.isFinite(speed)) {
    return DEFAULT_DEEPGRAM_TTS_SPEED;
  }
  const clamped = Math.min(DEEPGRAM_TTS_SPEED_MAX, Math.max(DEEPGRAM_TTS_SPEED_MIN, speed));
  const steps = Math.round((clamped - DEEPGRAM_TTS_SPEED_MIN) / DEEPGRAM_TTS_SPEED_STEP);
  return Math.round((DEEPGRAM_TTS_SPEED_MIN + steps * DEEPGRAM_TTS_SPEED_STEP) * 100) / 100;
}

/**
 * Maps an unrecognised voice — an `aura-2-*` name from a backup taken before
 * the Flux upgrade, or a voice since retired from the catalog — onto the
 * current default. The database migration does this for rows already stored;
 * this covers the restore path, which writes backup values verbatim and never
 * replays migrations.
 */
export function normalizeDeepgramVoiceModel(model: string): string {
  return isKnownDeepgramVoiceModel(model) ? model : DEFAULT_DEEPGRAM_TTS_MODEL;
}
