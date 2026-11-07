"""Generate a short, original, quiet ambient bed for the local Remotion demo."""
import math
import struct
import wave
from pathlib import Path

sample_rate = 44100
duration = 15
output = Path(__file__).resolve().parents[1] / "public" / "demo-bed.wav"
output.parent.mkdir(parents=True, exist_ok=True)

with wave.open(str(output), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(sample_rate)
    frames = bytearray()
    for i in range(sample_rate * duration):
        t = i / sample_rate
        swell = 0.55 + 0.25 * math.sin(2 * math.pi * t / duration)
        tone = sum(math.sin(2 * math.pi * f * t) / (n + 1) for n, f in enumerate((110, 138.59, 164.81, 220)))
        sample = int(max(-1, min(1, tone * swell * 0.045)) * 32767)
        frames.extend(struct.pack("<hh", sample, sample))
    wav.writeframes(frames)
