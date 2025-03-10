import torch
from peft import AutoPeftModelForCausalLM
from transformers import AutoTokenizer
from django.apps import AppConfig


class LLMModelApiConfig(AppConfig):
    name = 'llm_model_api'
    path = "/Users/teasgen/workspace/diploma/llm_backend/lora_model_mark_answer_comment_first_system_prompt"

    def ready(self):
        self.model = AutoPeftModelForCausalLM.from_pretrained(
            self.path,
            torch_dtype=torch.bfloat16,
            low_cpu_mem_usage=True,
        ).to("mps")
        self.tokenizer = AutoTokenizer.from_pretrained(self.path)
        print("LLM was initialized")