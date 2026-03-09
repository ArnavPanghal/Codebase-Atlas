import os
import json
import queue
import sys
import threading
import pyttsx3
from vosk import Model, KaldiRecognizer

class SpeechProcessor:
    def __init__(self, model_path="models/en-us-small"):
        """
        Initializes the SpeechProcessor with Vosk for STT and pyttsx3 for TTS.
        """
        if not os.path.exists(model_path):
            print(f"Model not found at {model_path}. Please download it first.")
            sys.exit(1)

        # STT Setup
        self.model = Model(model_path)
        self.recognizer = KaldiRecognizer(self.model, 16000)
        self.audio_queue = queue.Queue()

        # TTS Setup
        self.tts_engine = pyttsx3.init()
        self.tts_lock = threading.Lock()
        self.is_speaking = False

        # Configure TTS properties
        voices = self.tts_engine.getProperty('voices')
        # Setting a slightly more "friendly" voice if available
        for voice in voices:
            if "en" in voice.languages or "English" in voice.name:
                self.tts_engine.setProperty('voice', voice.id)
                break
        self.tts_engine.setProperty('rate', 170)  # Speed of speech

    def process_audio_chunk(self, data):
        """
        Feeds a chunk of audio data into the recognizer.
        Returns the transcribed text if a full sentence is detected, else None.
        """
        if self.recognizer.AcceptWaveform(data):
            result = json.loads(self.recognizer.Result())
            return result.get("text", "")
        return None

    def get_partial_transcript(self, data):
        """
        Returns partial transcription results for real-time feedback.
        """
        self.recognizer.AcceptWaveform(data)
        partial = json.loads(self.recognizer.PartialResult())
        return partial.get("partial", "")

    def set_speaking(self, status):
        """
        Manually sets the speaking status to block microphone processing.
        Useful when the LLM is thinking or preparing an answer.
        """
        self.is_speaking = status
        if status:
            self.recognizer.Reset()

    def speak(self, text):
        """
        Synthesizes text to speech. 
        Uses a lock to ensure we don't try to speak multiple things at once.
        """
        def _speak():
            with self.tts_lock:
                self.is_speaking = True
                print(f"Agent speaking: {text}")
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                # Keep is_speaking True for a tiny bit longer to clear echo
                import time
                time.sleep(0.5)
                self.is_speaking = False
                self.recognizer.Reset()

        threading.Thread(target=_speak).start()

    def listen_and_transcribe(self, stream, callback):
        """
        A blocking loop that reads from an audio stream and calls the callback
        with transcribed text.
        """
        print("Listening for speech (Ctrl+C to stop)...")
        try:
            while True:
                data = stream.read(4000, exception_on_overflow=False)
                if len(data) == 0:
                    break

                if self.is_speaking:
                    # While we're speaking, we still read the buffer but discard processing
                    # This clears the mic queue so it's fresh when we stop speaking.
                    continue

                if self.recognizer.AcceptWaveform(data):
                    result = json.loads(self.recognizer.Result())
                    text = result.get("text", "")
                    if text:
                        callback(text)
                else:
                    # Optional: handle partial results here if needed for UI feedback
                    pass
        except KeyboardInterrupt:
            print("\nStopped listening.")
