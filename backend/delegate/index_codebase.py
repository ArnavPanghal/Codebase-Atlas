import os
from memory_manager import MemoryManager

def run_indexing():
    # The Codebase-Atlas root is two levels up from backend/delegate
    # /Users/arnavpanghal/Apolis/Codebase-Atlas/backend/delegate -> /Users/arnavpanghal/Apolis/Codebase-Atlas
    codebase_root = os.path.abspath(os.path.join(os.getcwd(), "../../"))
    
    print(f"Using codebase root: {codebase_root}")
    
    mm = MemoryManager()
    
    # We index common source files and documentation
    # We exclude large node_modules and .git folders in memory_manager.py's logic
    mm.index_directory(codebase_root)
    
    print("Done indexing codebase into ChromaDB.")

if __name__ == "__main__":
    run_indexing()
