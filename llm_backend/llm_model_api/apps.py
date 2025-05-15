import queue
from mlc_llm import MLCEngine

POOL_SIZE = 2
engine_pool = queue.Queue(maxsize=POOL_SIZE)


model_path = "../mlc_qwen2"

for _ in range(POOL_SIZE):
    engine = MLCEngine(model_path)
    engine_pool.put(engine)
