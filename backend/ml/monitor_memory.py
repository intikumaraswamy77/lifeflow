import psutil
import time
import os
import json

def monitor_memory():
    """Monitor Python process memory usage"""
    try:
        # Get current process
        process = psutil.Process(os.getpid())
        
        # Get memory info
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        
        # Get system memory
        system_memory = psutil.virtual_memory()
        
        data = {
            "timestamp": time.time(),
            "process_memory_mb": round(memory_mb, 2),
            "system_memory_percent": system_memory.percent,
            "system_memory_available_gb": round(system_memory.available / (1024**3), 2),
            "process_cpu_percent": process.cpu_percent()
        }
        
        print(json.dumps(data))
        return data
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return None

if __name__ == "__main__":
    monitor_memory()
