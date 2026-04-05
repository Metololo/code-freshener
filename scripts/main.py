#!/usr/bin/env python3
import json
import sys
from code_freshener import CodeFreshener

if __name__ == "__main__":
    debug_mode = "--debug" in sys.argv
    args = [arg for arg in sys.argv[1:] if arg != "--debug"]
    
    if not args:
        print(json.dumps({"error": "No GitHub URL provided"}))
        sys.exit(1)
        
    freshener = CodeFreshener(debug=debug_mode)
    freshener.analyze(args[0])