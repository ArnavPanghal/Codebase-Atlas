import chromadb
from chromadb.utils import embedding_functions
import os
import uuid

class MemoryManager:
    def __init__(self, persist_directory="chroma_db", collection_name="codebase_atlas"):
        """
        Initializes the ChromaDB memory manager.
        """
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Use a local embedding function (Sentence Transformers)
        # This will download a model locally on the first run.
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_function
        )

    def add_document(self, content, metadata=None):
        """
        Adds a single document/snippet to the vector store.
        """
        doc_id = str(uuid.uuid4())
        self.collection.add(
            documents=[content],
            metadatas=[metadata or {}],
            ids=[doc_id]
        )
        return doc_id

    def search(self, query, n_results=3):
        """
        Searches for the most relevant documents related to the query.
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        # Format results into a helpful string
        context = ""
        if results['documents'] and len(results['documents'][0]) > 0:
            for i in range(len(results['documents'][0])):
                doc = results['documents'][0][i]
                meta = results['metadatas'][0][i]
                path = meta.get('path', 'unknown')
                context += f"\n--- Source: {path} ---\n{doc}\n"
        
        return context

    def index_directory(self, root_path, extensions=['.py', '.js', '.tsx', '.ts', '.md']):
        """
        Recursively indexes all files in a directory.
        """
        print(f"Indexing directory: {root_path}...")
        count = 0
        for root, dirs, files in os.walk(root_path):
            if ".venv" in root or ".git" in root or "node_modules" in root or "chroma_db" in root:
                continue
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            # Chunking can be refined, here we just take the whole file for small files
                            # or use simple logic for bigger files.
                            if len(content) > 2000:
                                # Simple chunking by lines for now
                                lines = content.split('\n')
                                for i in range(0, len(lines), 50):
                                    chunk = '\n'.join(lines[i:i+50])
                                    if chunk.strip():
                                        self.add_document(chunk, {"path": file_path, "type": "code_chunk"})
                            else:
                                if content.strip():
                                    self.add_document(content, {"path": file_path, "type": "code_full"})
                        count += 1
                    except Exception as e:
                        print(f"Skipping {file_path}: {e}")
        
        print(f"Successfully indexed {count} files.")

if __name__ == "__main__":
    # Test instance
    mm = MemoryManager()
    # mm.index_directory("/Users/arnavpanghal/Apolis/Codebase-Atlas")
    print(mm.search("What is the 목적 of Codebase Atlas?"))
