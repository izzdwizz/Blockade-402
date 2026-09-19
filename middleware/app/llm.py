from functools import lru_cache

from openai import OpenAI

from .config import Settings

MODEL = "gpt-4o-mini"


@lru_cache
def get_openai_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)


def ask_llm(settings: Settings, prompt: str, full: bool = True) -> str:
    client = get_openai_client(settings.openai_api_key)
    messages = [{"role": "user", "content": prompt}]
    if not full:
        messages.insert(
            0,
            {
                "role": "system",
                "content": "Answer in one short sentence only. This is a free-tier preview.",
            },
        )

    completion = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        max_tokens=None if full else settings.free_max_tokens,
    )
    return completion.choices[0].message.content
