import pyaudio
import sys
import os
from speech_processor import SpeechProcessor

def main():
    # Audio constants
    CHUNK = 4000
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000 # Vosk expects 16kHz usually

    # Initialize Speech Processor
    # Assuming models/en-us-small is the path relative to where this script runs
    model_path = "models/en-us-small"
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return

    sp = SpeechProcessor(model_path=model_path)
    p = pyaudio.PyAudio()

    # Open microphone stream
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    print("--- Voice Loop Test ---")
    print("Say something like 'hello' or 'how are you'.")
    print("The agent will transcribe your speech and repeat it back.")
    print("Press Ctrl+C to exit.")

    def on_transcribed(text):
        print(f"I heard: {text}")
        
        # Simple Logic
        if "hello" in text.lower():
            sp.speak("Hello there! I am your AI meeting delegate.")
        elif "exit" in text.lower() or "quit" in text.lower():
            print("Exiting...")
            sys.exit(0)
        else:
            sp.speak(f"You said: {text}")

    try:
        sp.listen_and_transcribe(stream, on_transcribed)
    except KeyboardInterrupt:
        pass
    finally:
        print("\nCleaning up...")
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    main()
