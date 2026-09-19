from functools import lru_cache

from openai import OpenAI

from .config import Settings

MODEL = "gpt-4o-mini"


@lru_cache
def get_openai_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)


def ask_llm(settings: Settings, prompt: str) -> str:
    client = get_openai_client(settings.openai_api_key)
    completion = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return completion.choices[0].message.content
