# System Overview and Components  

We will build an **AI Meeting Delegate** as a modular system. Key components include:  

- **Meeting Connector:** Joins calls (Zoom/Meet/Teams) and streams audio.  
- **Speech Processing:** Real-time Speech‑to‑Text (STT) to transcribe audio and Text‑to‑Speech (TTS) for voice responses.  
- **Conversation Manager:** Tracks speakers, identifies questions or cues, and maintains short-term context of the live discussion.  
- **Knowledge Base (Repo Memory):** Pre-loaded “long-term” memory about the user’s codebase (e.g. code documents, commit history, architecture graph).  
- **Vector Store & Retrieval:** A database of embeddings for quick semantic search across prior context (repo docs, past chats, partial transcripts).  
- **AI Reasoning Agent:** The LLM that processes queries. It uses retrieved context and tools (like code search or call-graph lookup) to generate answers.  
- **Escalation Module:** Detects low-confidence or out-of-scope questions and pings the user privately for clarification, then continues.  
- **Meeting Memory & Summary:** Logs transcript and action items, and provides a post-meeting summary.  

These modules interact as follows: upon joining the meeting, the system streams audio into the STT engine. Transcribed utterances go to the Conversation Manager, which detects when participants ask questions or new topics arise. The Agent then queries the Knowledge Base (via the vector store or graph tools) to formulate an answer. The answer is spoken back into the meeting via TTS. Meanwhile, all conversation text is stored in the vector memory for ongoing context. If the agent is unsure, it privately alerts the user (e.g. via a chat interface) for guidance, then resumes. 

This architecture resembles recent research prototypes: for example, Hu *et al.* (2025) describe a delegate system with an **“Information Gathering”** phase (ingesting topics and docs pre-meeting) and a real-time transcript monitor during the meeting【8†L164-L172】. They emphasize supplying the agent with background context beforehand and then continually feeding it live transcript. We will follow a similar design, ensuring low latency at each step. 

> **Key citations:** An ACL 2025 study on meeting delegates shows an architecture with a pre-meeting information module and live transcript analysis【8†L164-L172】. Another analysis notes that even GPT-4 took ~5 seconds per response, highlighting the need for speed optimizations【10†L132-L136】.  

# Meeting Connector and Audio Streaming  

The **Meeting Connector** must reliably join the user’s meeting. Options include:  

- **Zoom/Teams APIs:** Many platforms (Zoom, Teams) offer SDKs or WebSocket APIs for bots/clients. We can write a bot that uses the official Zoom/Teams SDK to join a meeting as a participant. This requires login credentials or an API token.  
- **Web-based Join:** For platforms without a robust API, we can automate a browser (e.g. using Selenium) to join via the meeting link. This approach “fakes” a real user join but is more brittle.  
- **Native VOIP SDKs:** Use a WebRTC client library to join generic calls, if available.  

Once joined, we capture the **audio stream**. Ideally the bot will *both* listen and speak: this might involve virtual audio devices or SDK features to input/output audio. In practice, a simpler initial setup is to join with only audio (listen) and communicate back via text-to-speech played into the meeting audio (either via an audio cable or a virtual microphone driver). The key requirement is **bi‑directional audio** between the meeting and our system, with minimal latency. 

**Low-latency audio** is critical. We want to transcribe in near real-time (sub-500ms delay if possible). This implies using an STT engine that supports streaming. For example:  
- **OpenAI Whisper** (small model) can process audio streams and is very accurate【5†L60-L67】, but requires a GPU for speed. The smallest Whisper models can run on modern CPUs at <1s latency for chunks of audio.  
- **Vosk or Coqui STT** are lightweight and can run on CPU (even offline)【5†L60-L67】. They offer much lower latency (perhaps <100ms on short utterances) but with lower accuracy. If the meeting quality is good, Vosk is a practical choice for responsiveness.  
- Commercial APIs (Google, Azure, AssemblyAI) have low-latency streaming but may incur costs. Since cost is a concern, we will start with open models.  

For **speech-to-text**, a reasonable plan is: start with Vosk for real-time transcription (it’s easy to set up and CPU-friendly), and optionally experiment with Whisper’s “tiny” model for improved accuracy if a GPU is available. We should test both for speed and accuracy trade-offs. The cited comparison notes that Whisper is more accurate and handles noise well, while Vosk is faster and leaner【5†L60-L67】.  

For **text-to-speech (TTS)** (the voice of the agent), we have similar choices:  

- **Coqui TTS** and **Mozilla TTS** offer good voices, but may require significant CPU/GPU.  
- **ChatTTS** (an open model specifically tuned for conversation) is designed for low-latency dialogue and might be ideal【12†L125-L132】.  
- **Mimic3** is a smaller, offline-friendly engine (e.g. used by Mycroft) that can run very fast with moderate quality.  
- **Bark** (from Suno AI) can produce expressive speech but is heavier and might be overkill.  

For a first version, **ChatTTS or Coqui TTS** are sensible. ChatTTS is explicitly “optimized for dialogue” with low-latency【12†L125-L132】, which matches our use-case. We should benchmark a few voices, but ensure the audio output is played into the meeting with minimal delay.

Overall, the **audio pipeline** is:  
```text
Meeting audio → (microphone input) → STT engine (streaming) → Conversation Manager  
↳ Agent answer (text) → TTS engine → (speaker output) → Meeting audio 
```  
We will use streaming (not chunked file uploads) to minimize lag. That means continuously feeding short audio buffers into the STT model and generating partial transcripts. Similarly, for TTS we will prefer streaming APIs or chunked synthesis so the agent can start speaking as soon as some of the text is ready (rather than waiting for the full answer).

# Knowledge Base & Memory Architecture  

Our delegate needs two “memory” sources:  

1. **Static Repo Knowledge (Pre-meeting Memory):** This includes the user’s codebase docs, important GitHub issues, wiki pages, or any provided technical notes. Since Codebase Atlas isn’t built yet, we will manually prepare a knowledge store for testing. For example, we might take README files, key source files, or an architecture diagram (if available) and load them as documents.  

2. **Dynamic Conversation Context (Short-term Memory):** The live transcript generates new text constantly. We must remember recent utterances so that the agent can refer back (“as you said a moment ago…”).  

To handle both, we adopt a **retrieval-augmented** approach:  

- We will **chunk and index** the static documents into a vector database (e.g. **FAISS** or **Chroma/Weaviate/Qdrant**). Each document or code snippet becomes an embedding so that we can quickly retrieve relevant passages based on semantic similarity. This covers “knowledge graph” retrieval even if we lack a formal graph: relevant code descriptions or comments will be found by the vector search.  
- For dynamic context, we stream each transcript utterance into the same or a separate vector store. Every few seconds (or at key speaker changes), we add the utterance text as a new vector entry. This way the agent can “look back” at earlier conversation. We may prune or summarize older entries to avoid unbounded growth.  
- In addition, we may maintain a **short chat memory** buffer (e.g. last 50 lines) passed directly into the prompt. However, to manage context length, we likely keep only key points or use a summarization of the last few minutes. (E.g. every 5 minutes we run a mini-summary of the recent chat and store that as a “note” in memory, discarding old raw text.)  

We can optionally explore **graph-based memory**: since the user mentioned Codebase Atlas, we might in future build an explicit code graph (classes, functions, dependencies). For now, we may simulate this by adding tools (below) for “call_graph” or “dependency_lookup” which query a pre-computed static structure (or stub that returns fake data). 

When the agent needs to answer a query, it will use the memory systems as follows:  

- **Vector Retrieval:** The agent will formulate a search query (often the user’s exact question) and fetch the top N relevant text chunks from the repo docs and recent transcript. For example, if asked “How does authentication work?”, the vector DB might return the README’s authentication section or a snippet of code commentary about login. We use these retrieved texts as part of the prompt.  
- **Tooling:** For precise queries (like “show call graph of login”), the agent can invoke specialized tools (e.g. a static analysis script or precomputed JSON data) to get structured answers, rather than relying purely on raw text.  
- **Summarized Memory:** Periodically, we push summarized context into long-term memory. This could use something like the [Mem0](https://mem0.ai/) layer (as the user mentioned) or a custom SQLite store. However, a simpler approach is to maintain important “notes” identified by the agent (e.g. “Session caching uses Redis”) and store those in a database for quick lookup.  

Importantly, **context window limits** require careful management. Transformer models have limited tokens, and using extremely long prompts hurts latency. As IBM notes, self-attention scales quadratically with context length【17†L369-L377】, so very long prompts (e.g. thousands of tokens) dramatically slow down inference. Also, studies show LLMs struggle to effectively use very long contexts【17†L385-L392】. Therefore, we must **keep the agent’s prompt concise**. 

Our strategy is: provide only the *most relevant* context from memory. For example, after retrieving 3-5 text snippets, we feed only those plus a brief chat history summary to the model, rather than everything said. If the meeting is lengthy, we can use a sliding window or chunking approach, ensuring the model never sees more than, say, ~2000 tokens at once. 

# Agent Loop and Tools  

The **AI Agent** is the core decision-maker. It will loop as follows during the meeting:  

1. **Listen:** Conversation Manager detects a question or topic cue. For example, a participant might ask, “Could you explain the caching mechanism?” We detect the question either by keyword spotting (e.g. “explain X?”) or by using a classifier (an LLM prompt that checks if the last utterance is a question needing an answer).  
2. **Gather Context:** The agent takes that question and queries the memory systems. It retrieves relevant static docs (code comments, README lines, diagrams) and recent chat. It may also call a specialized tool (e.g. a Git grep or code parser if available) to answer factual queries.  
3. **Generate Answer:** The agent combines the question and retrieved info into a prompt for an LLM. It might use a local open-source model (Llama3-8B or Mistral-7B are good free options) or a streaming API like OpenAI/GPT-4o (if latency and cost allow). Since we need fast replies, smaller models or on-prem GPUs are preferable. The agent should be primed not to hallucinate and to base its answer on the provided context (we include retrieved chunks verbatim in the prompt).  
4. **Speak & Display:** The model’s answer (text) is sent to the TTS engine and played into the meeting. We might also display or stream a quick visual (e.g. share a slide or diagram) if the question benefits from it.  
5. **Update Memory:** The Q&A exchange is added to dynamic memory (the transcript store) so future questions can refer back.  

**Tools and Capabilities:** We should give the agent explicit tools so it isn’t purely guessing from text. Example tools:  
- **`code_search(query)`:** Searches code files for relevant functions or comments. Could be a simple text search or use the vector store.  
- **`call_graph(function)`:** Returns a call stack or dependency list for a given function (this could be precomputed by static analysis or stubbed with a hardcoded answer for now).  
- **`diagram_draw(params)`:** (Future) to generate or retrieve an architecture diagram.  
- **`commit_history(file)`:** Fetch recent commits or changes from Git metadata.  

We will orchestrate these either via a framework like **LangChain** or by building our own agent loop. The agent’s **prompt template** will follow a pattern like:  

```
System: You are an AI assistant for [User]'s codebase. Use the provided context to answer accurately.

[Context: Relevant docs and transcript snippets go here.]

Q: [User’s question]
A: 
```  

We ensure to chunk the context so it stays within a few thousand tokens. If the model shows low confidence (e.g. it says “I’m not sure”), we trigger the Escalation. 

> **Latency note:** The end-to-end loop (speech-to-text, retrieve, LLM, text-to-speech) must be optimized for speed. The cited research found even GPT-4 required ~5s to respond【10†L132-L136】. We aim for <2s. To do this:  
> - Use efficient STT (Vosk with <0.5s delay).  
> - Prefetch retrieval: when the meeting is idle, the agent can pre-load possible topics.  
> - Stream the LLM response (for example, with GPT-3.5/GPT-4 streaming or a smaller local model).  
> - Use a faster or smaller model (e.g. Llama-3 “Flash” or Mistral-7b, which Hu *et al.* noted can be quite active in conversation).  

# Escalation and Privacy  

Sometimes the agent will be unsure or lack context. In that case:  

- The agent sends a **private message** to the user (via a separate interface like a bot DM or a mobile notification) saying something like “Meeting asked about [topic]. Need clarification?”  
- The user replies (“Use version X of the API” or “We are using Kubernetes”), and the agent then answers the meeting.  
- This requires a secure channel (perhaps a Slack or Telegram bot) and the agent logic to pause public replies until it gets guidance.  

We must also handle privacy and safety. As Hu *et al.* caution, the delegate must not expose personal data or credentials【8†L164-L172】【10†L132-L136】. We will filter any confidential info out of answers (e.g. API keys from code). The agent’s identity should be announced (“I’m Alice’s AI assistant…”), and we should allow the user to easily abort or correct any answer. 

# Implementation Plan and Roadmap  

**Phase 1 – Prototype (local, manual setup):**  
- **Basic Meeting Join & STT:** Use a Python script or Node app with a Zoom/Meet SDK to join a meeting link. Stream audio into Vosk for transcription. Display transcript to console.  
- **Manual Q&A Loop:** Hardcode a small knowledge base (a couple of text files). When the user says “Example: What does login() do?”, have the agent do a simple keyword search or stub an answer. No audio output yet (just text print).  
- **Basic Response:** Integrate a TTS engine (e.g. Coqui or pyttsx3) and play answers into meeting.  

**Phase 2 – Automated Retrieval & LLM:**  
- **Vector DB:** Set up a local vector store (FAISS or Chroma). Embed the static docs and accumulate some transcripts. Implement RAG retrieval code.  
- **LLM Integration:** Use an open model (e.g. Mistral-7B via HuggingFace or local Llama-3) with a streaming API (e.g. LangChain agent). Prompt it with retrieved context.  
- **Question Detection:** Improve the Conversation Manager to automatically spot questions or key phrases and trigger the agent.  

**Phase 3 – Real-Time Polishing:**  
- **Latency Tuning:** Measure round-trip time. Possibly switch to a faster STT (Whisper-nano if GPU available) or faster TTS. Use streaming APIs to output tokens as speech progressively.  
- **Continuous Context:** Implement the conversation memory store and a summarization routine (e.g. every 5 minutes compress context). Possibly use a small model (or LLM prompt) to summarize the previous dialogue. Store summaries in vector DB.  
- **Escalation Channel:** Create a chat interface for the user (could be a simple Flask app or CLI input) to receive clarifications from the agent.  

**Phase 4 – Advanced Features:**  
- **Diagram Sharing:** If a question calls for it (“Show the architecture”), have the agent trigger a slide or draw a quick graph (maybe using a graphviz tool).  
- **Multi-meeting Handling:** Allow the agent to track multiple rooms (less urgent).  
- **Integration with Future Codebase Atlas:** Once the main Atlas is built, plug its graphs/tools into the delegate (e.g. use real call graphs, dependency edges from Atlas).  

# Technology Stack Suggestions  

- **Language:** Python is well-suited (rich ML libraries, speech libs, web APIs). Node.js or Go could be used for robust meeting connections, but Python should suffice with packages like `webrtcvad`, `vosk`, `pyaudio`, and SDK wrappers.  
- **STT:** Start with [Vosk](https://alphacephei.com/vosk/) for streaming ASR (good Python bindings). If GPU available, test [OpenAI Whisper](https://huggingface.co/blog/openai-whisper) in streaming mode (e.g. `whisper.cpp` also supports streaming).  
- **TTS:** [Coqui TTS](https://github.com/coqui-ai/TTS) or [Mozilla TTS](https://github.com/mozilla/TTS) with a fast voice. Alternatively, [ChatTTS](https://github.com/yanggengpku/ChatTTS) for responsive speech. For a quick prototype, even `pyttsx3` (offline TTS) could work.  
- **Vector DB:** [FAISS](https://github.com/facebookresearch/faiss) (in-process, no external deps) or [Chroma](https://github.com/chroma-core/chroma) (lightweight) for embeddings. Use HuggingFace’s sentence-transformers to create embeddings of docs and transcripts.  
- **Graph DB (future):** If we want a true code graph, [Neo4j](https://neo4j.com/) or NetworkX (in-memory) could represent dependencies. For now, skip unless Codebase Atlas delivers one.  
- **LLM:** Host an open-source model locally (e.g. [Llama 3](https://ai.meta.com/llama/) or [Mistral 7B](https://huggingface.co/mistralai/Mistral-7B)) using [transformers](https://huggingface.co/transformers/). Alternatively, use OpenAI’s API for higher quality answers during dev (with the understanding it’s a placeholder). Ensure to use **streaming outputs** (`stream=True`) to reduce perceived latency.  
- **Agent Framework:** Use [LangChain](https://python.langchain.com/) or [LLM gateway](https://github.com/allenai/llm-workshop/tree/main/llm/agents) libraries to manage the agent’s tools, memories, and LLM calls.  

# Summary 

The **AI Meeting Delegate** will combine streaming speech processing with an LLM-based QA system over the user’s code knowledge. By dividing responsibilities into components (audio capture, transcription, retrieval, LLM reasoning, and TTS), we ensure modularity and scalability. 

We must carefully manage **context and latency**: using vector retrieval and summaries keeps prompts small, and choosing efficient STT/TTS models keeps the interaction snappy. Privacy and correctness are critical, so the agent will operate transparently and defer to the user when uncertain. 

In essence, this delegate acts as your **“digital proxy”** in tech meetings: it listens, reasons over your codebase, and speaks up on your behalf. As Codebase Atlas matures, it will feed richer context into this delegate. For now, a phased approach — build the delegate with a sample repo and then integrate Atlas features — will get us to a working prototype.  

**References:** We draw on recent research into AI meeting assistants, noting that architectures with pre-loaded context and live transcription are effective【8†L164-L172】. Open-source ASR/TTS solutions like Whisper and Vosk offer different trade-offs【5†L60-L67】, and models like ChatTTS are tailored for low-latency chat-style output【12†L125-L132】. Finally, the quadratic cost of long prompts【17†L369-L377】 underscores the importance of retrieval and memory to keep the conversation fluid.  

