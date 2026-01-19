
import requests
import time
import statistics

BASE_URL = "http://localhost:5001/api/cases?page=1&limit=10"

def benchmark_endpoint(trials=5):
    times = []
    print(f"Benchmarking {BASE_URL} with {trials} trials...")
    
    for i in range(trials):
        start_time = time.time()
        try:
            response = requests.get(BASE_URL)
            end_time = time.time()
            duration = end_time - start_time
            
            if response.status_code == 200:
                print(f"Trial {i+1}: {duration:.4f} seconds")
                times.append(duration)
            else:
                print(f"Trial {i+1}: Failed with status {response.status_code}")
                
        except Exception as e:
            print(f"Trial {i+1}: Error - {e}")
            
    if times:
        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        print(f"\nStats:")
        print(f"Average: {avg_time:.4f} seconds")
        print(f"Min: {min_time:.4f} seconds")
        print(f"Max: {max_time:.4f} seconds")
    else:
        print("No successful trials.")

if __name__ == "__main__":
    benchmark_endpoint()
