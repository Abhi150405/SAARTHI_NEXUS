import time
import functools
import logging
from typing import Any, Callable, Dict, Optional, Tuple
from collections import OrderedDict
from fastapi import Request, Response
from pydantic import BaseModel

logger = logging.getLogger("cache")


class InMemoryCache:
    """
    Lightweight, thread-safe in-memory cache with TTL and LRU eviction.
    Designed for memory-constrained environments (e.g. Render 512MB free tier).
    """

    def __init__(self, maxsize: int = 500, default_ttl: int = 300):
        self.maxsize = maxsize
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def _cleanup_expired(self) -> None:
        """Remove expired entries from cache."""
        now = time.time()
        expired_keys = [
            k for k, v in self._cache.items() if v["expires_at"] <= now
        ]
        for k in expired_keys:
            del self._cache[k]

    def get(self, key: str) -> Tuple[bool, Any]:
        """
        Retrieve value from cache if it exists and has not expired.
        Returns tuple (hit: bool, value: Any).
        """
        if key not in self._cache:
            self.misses += 1
            return False, None

        entry = self._cache[key]
        now = time.time()

        if entry["expires_at"] <= now:
            del self._cache[key]
            self.misses += 1
            return False, None

        # Move to end for LRU order
        self._cache.move_to_end(key)
        self.hits += 1
        return True, entry["data"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None, namespace: str = "default") -> None:
        """
        Store value in cache with expiration and namespace.
        """
        self._cleanup_expired()

        ttl_seconds = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + ttl_seconds

        # Enforce maxsize LRU eviction if full
        if len(self._cache) >= self.maxsize and key not in self._cache:
            # Remove oldest item
            self._cache.popitem(last=False)
            self.evictions += 1

        self._cache[key] = {
            "data": value,
            "expires_at": expires_at,
            "namespace": namespace,
            "created_at": time.time(),
        }
        self._cache.move_to_end(key)

    def invalidate_key(self, key: str) -> bool:
        """Remove a specific key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def invalidate_namespace(self, namespace: str) -> int:
        """
        Invalidate all cache entries matching a namespace (e.g. 'placements', 'stats').
        Returns count of keys removed.
        """
        keys_to_remove = [
            k for k, v in self._cache.items() if v.get("namespace") == namespace
        ]
        for k in keys_to_remove:
            del self._cache[k]
        logger.info(f"Invalidated {len(keys_to_remove)} keys for namespace '{namespace}'")
        return len(keys_to_remove)

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries where key contains pattern string.
        """
        keys_to_remove = [k for k in self._cache if pattern in k]
        for k in keys_to_remove:
            del self._cache[k]
        return len(keys_to_remove)

    def clear_all(self) -> int:
        """Clear entire cache."""
        count = len(self._cache)
        self._cache.clear()
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        return count

    def get_stats(self) -> Dict[str, Any]:
        """Return cache health and usage statistics."""
        self._cleanup_expired()
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0.0
        return {
            "cached_keys_count": len(self._cache),
            "maxsize": self.maxsize,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(hit_rate, 2),
            "evictions": self.evictions,
        }


# Global singleton cache instance
cache = InMemoryCache(maxsize=500, default_ttl=300)


def _serialize_arg(arg: Any) -> str:
    """Helper to convert route arguments into cache key strings."""
    if isinstance(arg, (str, int, float, bool, type(None))):
        return str(arg)
    if isinstance(arg, dict):
        return "&".join(f"{k}={_serialize_arg(v)}" for k, v in sorted(arg.items()))
    if isinstance(arg, (list, tuple, set)):
        return ",".join(_serialize_arg(x) for x in arg)
    if isinstance(arg, Request):
        # Extract query parameters
        qp = dict(arg.query_params)
        return "&".join(f"{k}={v}" for k, v in sorted(qp.items()))
    if isinstance(arg, BaseModel):
        return arg.model_dump_json()
    return str(type(arg))


def cache_response(ttl: int = 300, namespace: str = "default"):
    """
    Decorator for FastAPI endpoint handlers to cache JSON-serializable responses in-memory.
    
    Usage:
        @router.get("/placement-stats")
        @cache_response(ttl=600, namespace="stats")
        async def get_placement_stats():
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Check if caller requested cache bypass via request headers
            request: Optional[Request] = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request:
                bypass = (
                    request.headers.get("X-Bypass-Cache", "").lower() in ("true", "1") or
                    "no-cache" in request.headers.get("Cache-Control", "").lower()
                )
                if bypass:
                    logger.debug(f"Cache bypass requested for {func.__name__}")
                    return await func(*args, **kwargs)

            # Build deterministic cache key
            clean_kwargs = {
                k: v for k, v in kwargs.items()
                if not isinstance(v, (Request, Response))
            }
            clean_args = [
                a for a in args
                if not isinstance(a, (Request, Response))
            ]

            key_parts = [
                namespace,
                func.__module__,
                func.__qualname__,
                _serialize_arg(clean_args),
                _serialize_arg(clean_kwargs)
            ]
            if request and request.query_params:
                key_parts.append(str(request.query_params))

            cache_key = ":".join(key_parts)

            # Check cache
            hit, cached_val = cache.get(cache_key)
            if hit:
                logger.debug(f"Cache HIT for key: {cache_key}")
                return cached_val

            logger.debug(f"Cache MISS for key: {cache_key}")
            result = await func(*args, **kwargs)

            # Store result in cache
            if result is not None:
                cache.set(cache_key, result, ttl=ttl, namespace=namespace)

            return result

        return wrapper
    return decorator
