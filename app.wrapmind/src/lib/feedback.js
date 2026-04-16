import supabase from './supabase';

const SCREENSHOT_BUCKET = 'feedback-screenshots';
const AUDIO_BUCKET      = 'feedback-audio';

/**
 * Upload a base64 JPEG data URL to Supabase Storage.
 * Returns public URL or null (non-fatal).
 */
export async function uploadScreenshot(base64DataUrl) {
  if (!base64DataUrl?.includes(',')) {
    if (import.meta.env.DEV) console.warn('[feedback] uploadScreenshot: invalid data URL — missing comma separator');
    return null;
  }
  try {
    const base64 = base64DataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .upload(filename, bytes.buffer, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(SCREENSHOT_BUCKET).getPublicUrl(filename);
    return data?.publicUrl ?? null;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[feedback] Screenshot upload failed (non-fatal):', err);
    return null;
  }
}

/**
 * Analyze an audio Blob for silence.
 * Returns true if ≥99% of PCM samples are below amplitude threshold 0.008.
 * Falls back to false (assume not silent) if AudioContext decode fails.
 */
export async function isAudioSilent(audioBlob) {
  const audioCtx = new AudioContext();
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data        = audioBuffer.getChannelData(0);
    const threshold   = 0.008;
    let silentCount   = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) < threshold) silentCount++;
    }
    if (data.length === 0) return true; // no samples = silent
    return (silentCount / data.length) >= 0.99;
  } catch {
    return false;
  } finally {
    await audioCtx.close();
  }
}

/**
 * Upload a voice memo Blob (.webm) to Supabase Storage.
 * Returns public URL or null (non-fatal).
 */
export async function uploadVoiceMemo(audioBlob) {
  try {
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filename, audioBlob, { contentType: 'audio/webm', upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(filename);
    return data?.publicUrl ?? null;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[feedback] Voice memo upload failed (non-fatal):', err);
    return null;
  }
}

/** Submit a new feedback entry */
export async function submitFeedback({ reaction, note, screenshotUrl, voiceMemoUrl, page, username, shopName, build }) {
  const { data, error } = await supabase
    .from('beta_feedback')
    .insert([{
      reaction,
      note:           note || null,
      screenshot_url: screenshotUrl  || null,
      voice_memo_url: voiceMemoUrl   || null,
      page,
      username,
      shop_name: shopName,
      build,
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Load all feedback entries, newest first */
export async function loadAllFeedback() {
  const { data, error } = await supabase
    .from('beta_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Update status and optional response on a single entry */
export async function respondToFeedback(id, { status, response, respondedBy }) {
  const { data, error } = await supabase
    .from('beta_feedback')
    .update({
      status,
      response:     response || null,
      responded_at: response ? new Date().toISOString() : null,
      responded_by: response ? respondedBy : null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
