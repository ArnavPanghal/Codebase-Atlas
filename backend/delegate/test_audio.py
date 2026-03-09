import pyaudio
import wave
import sys

def test_audio_io():
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    RECORD_SECONDS = 5
    WAVE_OUTPUT_FILENAME = "test_output.wav"

    p = pyaudio.PyAudio()

    print(f"* Recording {RECORD_SECONDS} seconds...")

    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    frames = []

    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("* Done recording")

    stream.stop_stream()
    stream.close()
    
    # Save to file
    wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

    print(f"* Audio saved to {WAVE_OUTPUT_FILENAME}")

    # Playback
    print("* Playing back...")
    wf = wave.open(WAVE_OUTPUT_FILENAME, 'rb')

    stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                    channels=wf.getnchannels(),
                    rate=wf.getframerate(),
                    output=True)

    data = wf.readframes(CHUNK)

    while len(data) > 0:
        stream.write(data)
        data = wf.readframes(CHUNK)

    print("* Done playing")

    stream.stop_stream()
    stream.close()
    p.terminate()

if __name__ == "__main__":
    try:
        test_audio_io()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
