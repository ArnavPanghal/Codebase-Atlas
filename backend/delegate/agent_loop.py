import ollama
from speech_processor import SpeechProcessor
from memory_manager import MemoryManager
import pyaudio
import sys
import os

class AgentLoop:
    def __init__(self, model_name="llama3"):
        self.model_name = model_name
        self.sp = SpeechProcessor()
        self.mm = MemoryManager()
        self.system_prompt = (
            "You are an AI Meeting Delegate for a project called Codebase-Atlas. "
            "Your goal is to answer questions about the codebase based on the context provided. "
            "Use the 'Retrieved Context' section to provide evidence-based answers. "
            "If you don't know the answer, say so. Be concise and professional. "
            "Respond in 1-3 sentences maximum."
        )
        self.chat_history = []

    def get_llm_response(self, user_input, context=""):
        """
        Sends user input to Ollama and returns the generated response.
        """
        prompt = user_input
        if context:
            prompt = f"Retrieved Context:\n{context}\n\nQuestion: {user_input}"

        messages = [{"role": "system", "content": self.system_prompt}]
        # Add history for context (simplified)
        for msg in self.chat_history[-5:]:
            messages.append(msg)
        
        messages.append({"role": "user", "content": prompt})

        try:
            print(f"Thinking about: {user_input}...")
            response = ollama.chat(model=self.model_name, messages=messages)
            answer = response['message']['content']
            self.chat_history.append({"role": "user", "content": user_input})
            self.chat_history.append({"role": "assistant", "content": answer})
            return answer
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return "I'm sorry, I'm having trouble thinking right now."

    def run(self):
        # Audio constants
        CHUNK = 4000
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000

        p = pyaudio.PyAudio()
        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        frames_per_buffer=CHUNK)

        print("--- AI Meeting Delegate Running ---")
        print("Listening for questions...")

        def on_transcribed(text):
            if len(text.strip()) > 3:  # Ignore very short noises/jitter
                print(f"User: {text}")
                
                # Block mic once we start thinking
                self.sp.set_speaking(True)
                
                # 1. Search for context
                context = self.mm.search(text)
                
                # 2. Get LLM response with context
                response = self.get_llm_response(text, context)
                print(f"Agent: {response}")
                
                # 3. Speak the answer
                self.sp.speak(response)
                # Note: self.sp.speak handles setting is_speaking back to False after speech ends.

        try:
            self.sp.listen_and_transcribe(stream, on_transcribed)
        except KeyboardInterrupt:
            pass
        finally:
            print("\nShutting down...")
            stream.stop_stream()
            stream.close()
            p.terminate()

if __name__ == "__main__":
    agent = AgentLoop()
    agent.run()
