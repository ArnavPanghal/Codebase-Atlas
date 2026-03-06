# Architecture Overview

## Architecture Goals
Provide a robust system for ingesting GitHub repositories, parsing code structures into a graph, and serving that graph alongside an AI agent to a dynamic, visual frontend.

## Components

### 1. Frontend (React + Tailwind + React Flow)
A visually rich, highly interactive "map interface".
- **Graph Viewer:** Renders nodes and edges based on dependency and module structures.
- **Chat Interface:** Connects to the LLM backend for contextual AI queries.
- **Timeline Slider:** For moving through git history.

### 2. Backend (Python + FastAPI)
A performance-friendly layer exposing both REST APIs and WebSocket connections (for the AI agent / execution flow simulations).
- **Ingestion Engine:** Clones and pulls GitHub data.
- **Analysis Engine:** Parses files (AST extraction), scans dependencies, and reviews architecture.
- **Graph Builder:** Generates the structured graph.
- **Agent Orchestrator:** Manages conversation state, invokes tools against the graph and code index.

### 3. Storage
TBD: Likely a combination of a Graph Database (like Neo4j) or an in-memory graph (NetworkX) and a persistent store for repository metadata / embeddings (PostgreSQL + pgvector / ChromaDB).
