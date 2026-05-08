# server/musicgen_server.py
#
# MusicGen local inference bridge for SoulSync
# Runs on port 5001 — Node.js calls it over HTTP
#
# FIRST TIME SETUP:
#   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
#   pip install transformers scipy fastapi uvicorn numpy
#
# START (in a separate terminal from your Node server):
#   cd server
#   python musicgen_server.py
#
# First run downloads ~1 GB model to ~/.cache/huggingface/
# Subsequent starts load from cache (~10 seconds)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import scipy.io.wavfile
import numpy as np
import base64
import io
import uvicorn
from transformers import pipeline

app = FastAPI()

# ── Load model at startup (once) ────────────────────────────────────────────
print("\n🎵 SoulSync MusicGen Bridge")
print("   Loading facebook/musicgen-small...")
print("   (First run: ~1 GB download. Subsequent runs: ~10s from cache)\n")

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"   Device: {device.upper()}" + (" ✅ GPU acceleration" if device == "cuda" else " ⚠️  CPU mode (slow ~5min/clip)"))

synthesiser = pipeline(
    "text-to-audio",
    "facebook/musicgen-small",
    device=device,
)

print("\n✅ MusicGen ready! Listening on http://127.0.0.1:5001\n")

# ── Request schema ───────────────────────────────────────────────────────────
class BeatRequest(BaseModel):
    prompt: str
    duration: int = 30  # seconds, capped at 30 by MusicGen-small

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "model": "musicgen-small", "device": device}

# ── Generate endpoint ─────────────────────────────────────────────────────────
@app.post("/generate")
def generate(req: BeatRequest):
    print(f"🎵 Generating: \"{req.prompt[:70]}...\"")
    print(f"   Duration: {req.duration}s | Device: {device}")

    # MusicGen-small is capped at ~30s (1503 tokens max)
    # ~50 tokens ≈ 1 second of audio
    tokens = min(req.duration * 50, 1500)

    try:
        result = synthesiser(
            req.prompt,
            forward_params={"do_sample": True, "max_new_tokens": tokens}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    # result["audio"] shape: (1, channels, samples) or (channels, samples)
    audio_array = result["audio"]
    sampling_rate = result["sampling_rate"]

    # Normalise to (samples, channels) for scipy
    if audio_array.ndim == 3:
        audio_array = audio_array[0]          # remove batch dim → (channels, samples)
    audio_array = audio_array.T               # → (samples, channels)

    # Convert float32 [-1, 1] to int16 for WAV
    audio_int16 = (audio_array * 32767).astype(np.int16)

    # Encode as WAV → base64 data URL
    buf = io.BytesIO()
    scipy.io.wavfile.write(buf, sampling_rate, audio_int16)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    audio_url = f"data:audio/wav;base64,{b64}"

    actual_duration = len(audio_int16) / sampling_rate
    print(f"✅ Done! {actual_duration:.1f}s of audio generated")

    return {
        "audioUrl": audio_url,
        "duration": round(actual_duration),
        "model": "musicgen-small",
        "device": device,
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5001, log_level="warning")
