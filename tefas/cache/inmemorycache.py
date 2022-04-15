from expiringdict import ExpiringDict
import pandas as pd

cache = ExpiringDict(max_len=1000, max_age_seconds=3600)


def get_from_cache(key: str):
    return cache.get(key, pd.DataFrame({}))


def set_cache(key: str, value: any):
    cache[key] = value
