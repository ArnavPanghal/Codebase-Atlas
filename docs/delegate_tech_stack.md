# AI Meeting Delegate - Technology Stack

This document outlines the specific technologies chosen to build the free, local AI Meeting Delegate module.

## 1. Meeting Connector / Interface
**Choice**: `PyAudio` & Local Device I/O  
**Why**: As per the user's request for the easiest and most testable platform, we will begin by directly hooking into the host computer's microphone and speakers. Once the end-to-end loop is proven locally, we can deploy via browser automation (Playwright) or SDKs to join real virtual meetings.

## 2. Speech-To-Text (STT) - Hearing
**Choice**: `Vosk` (Offline Speech Recognition)  
**Why**: Vosk is lightweight, very fast, and runs perfectly on CPU. It offers streaming transcription out-of-the-box, allowing us to capture utterances in near real-time without paid API costs. (Whisper could be used later if greater accuracy is required and a GPU is heavily available).

## 3. Text-To-Speech (TTS) - Speaking
**Choice**: `pyttsx3` (Initial Prototype) -> `ChatTTS` / `Coqui TTS` (Enhancement)  
**Why**: `pyttsx3` is completely free, offline, and natively hooks into the OS's voice synthesis without requiring massive model downloads. It ensures we can get the loop working immediately with near-zero latency. Later, we can upgrade to `ChatTTS` for high-quality, dialogue-optimized conversational voices.

## 4. Reasoning Engine (LLM)
**Choice**: `Ollama` running `Llama-3` (8B) or `Mistral` (7B)  
**Why**: Ollama makes running large local language models trivial on Mac. These models are free, powerful enough to answer codebase queries intelligently, and keep all codebase data private locally. We will query it via its local REST API or LangChain integration.

## 5. Knowledge Base & Vector Memory
**Choice**: `ChromaDB`  
**Why**: Chroma is a fast, lightweight, open-source embedding database. It runs locally as a library, making it easy to store chunks of code documentation as static repo memory and conversational transcripts as short-term meeting memory.

## 6. Orchestration & Prompts
**Choice**: `LangChain` (Python)  
**Why**: Provides the simplest abstractions for wiring together the STT outputs, Vector DB retrievals, LLM generation, and optionally tool calling (e.g., Code Search tools).

## Summary Pipeline
*Microphone (`PyAudio`)* -> *Speech to Text (`Vosk`)* -> *Vector Search (`ChromaDB`)* -> *Reasoning (`Ollama/LLama-3`)* -> *Text to Speech (`pyttsx3`)* -> *Speaker (`PyAudio`)*
