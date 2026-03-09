# AI Meeting Delegate - Context Tracker

This document serves as the "brain state" and tracking document for the AI Meeting Delegate module inside Codebase-Atlas. It should be updated whenever significant progress is made, user feedback is received, or architectural pivots occur.

## Current Objective
Build the MVP (Phase 1) of a headless, modular AI Meeting Delegate inside the `backend/delegate` folder of Codebase-Atlas. The delegate must listen, reason, and speak entirely for free using local models.

## Progress & Status
- **Phase**: 1 - Prototype (Local MVP)
- **Status**: Planning Phase
- **What's Done so far**: 
  - Read `deep-research-report.md`
  - Established tech stack and implementation plan
  - Created `docs/delegate_context.md` and `docs/delegate_tech_stack.md`.
  - Initialized `backend/delegate` module with Python 3.11.
  - Integrated Vosk (STT) and pyttsx3 (TTS) in `speech_processor.py`.
  - Fixed "hallucination" feedback loop by pausing mic processing during TTS playback.
  - Installed and configured Ollama with `llama3`.
  - Successfully indexed the `Codebase-Atlas` directory (42 files) into ChromaDB via `index_codebase.py`.
  - Integrated RAG retrieval into `AgentLoop.py`.
  - Established stable "Mute-during-Thinking" logic for local dev.
- **Current Blockers / Feedback**:
  - **High Latency**: Round-trip time (STT -> LLM -> TTS) is currently too slow for fluid meetings.
  - **Prompt Engineering**: The agent's responses need better structuring to handle empty or noisy context.
  - **Echo/Feedback**: Using mute-only for now; deferred advanced AEC.
- **Next Phase (User Researching)**:
  - Optimize inference speed (Streaming LLM -> Streaming TTS).
  - Improve RAG prompt quality and context filtering.

## User Preferences & Feedback
- **Platform preference**: Wants the easiest, easily testable platform first (Local standard Mic/Speaker Audio I/O is chosen as the MVP before web browser or API integration).
- **Tooling Constraints**: Completely free, local tools. No paid APIs to be used at this stage.
- **Code Organization**: To be built entirely inside `backend/delegate` headless. No UI required for now.

## Known Challenges / To-Dos
- Ensuring near real-time latency with completely local models.
- Managing chunk-based transcript streaming into the LLM without overwhelming the context window.
