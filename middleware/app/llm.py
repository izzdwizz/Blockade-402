from functools import lru_cache

from openai import OpenAI

from .config import Settings


@lru_cache
def get_openai_client(api_key: str, base_url: str) -> OpenAI:
    return OpenAI(api_key=api_key, base_url=base_url or None)


def ask_llm(settings: Settings, prompt: str, full: bool = True) -> str:
    client = get_openai_client(settings.openai_api_key, settings.llm_base_url)
    messages = [{"role": "user", "content": prompt}]
    if not full:
        messages.insert(
            0,
            {
                "role": "system",
                "content": "Answer in one short sentence only. This is a free-tier preview.",
            },
        )

    extra_params = {}
    if "gpt-oss" in settings.llm_model:
        # GPT-OSS (Groq) is a reasoning model — its hidden reasoning trace counts
        # against max_tokens, which can exhaust a small free-tier budget before any
        # visible content is written, returning an empty response. "low" keeps the
        # reasoning trace short enough to leave room for the actual answer.
        extra_params["reasoning_effort"] = "low"

    completion = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        max_tokens=None if full else settings.free_max_tokens,
        **extra_params,
    )
    return completion.choices[0].message.content
