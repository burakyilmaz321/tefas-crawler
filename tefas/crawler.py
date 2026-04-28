"""Tefas Crawler

Crawls public investment fund information from Turkey Electronic Fund Trading
Platform (TEFAS).

The legacy ``BindHistoryInfo`` / ``BindHistoryAllocation`` endpoints on
``fundturkey.com.tr`` were retired in 2026 and replaced by JSON endpoints under
``https://www.tefas.gov.tr/api/funds/...``. The new API is structured per-fund
with a months-back ``periyod`` parameter, NOT per-date with all-funds output.
This crawler keeps the original ``fetch(start, end, name)`` signature, but when
``name`` is omitted it has to fan out one HTTP call per fund — which is slow.
A fund-count cap and a ``UserWarning`` keep that path from quietly hammering
the API.
"""

import math
import warnings
from datetime import date, datetime
from typing import List, Optional, Union

import pandas as pd
import requests

from tefas.schema import InfoSchema


class Crawler:
    """Fetch public fund information from ``https://www.tefas.gov.tr``.

    Examples:

    >>> tefas = Crawler()
    >>> data = tefas.fetch(start="2025-04-01", end="2025-04-15", name="YAC")
    >>> data.head()
             date code  ...     price  category_rank  category_total
    0  2025-04-01  YAC  ...
    """

    root_url = "https://www.tefas.gov.tr"
    price_endpoint = "/api/funds/fonFiyatBilgiGetir"
    list_endpoint = "/api/funds/fonGetiriBazliBilgiGetir"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
    }

    DEFAULT_FUND_LIMIT = 50

    def __init__(self, fund_limit: int = DEFAULT_FUND_LIMIT):
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.fund_limit = fund_limit

    def fetch(
        self,
        start: Union[str, datetime],
        end: Optional[Union[str, datetime]] = None,
        name: Optional[str] = None,
        columns: Optional[List[str]] = None,
        kind: Optional[str] = "YAT",
    ) -> pd.DataFrame:
        """Get fund price information.

        When ``name`` is provided, hits the per-fund endpoint directly.
        When ``name`` is None, lists funds of the requested ``kind`` and
        fetches the first ``self.fund_limit`` of them — slow, and emits a
        ``UserWarning``.

        Note: ``market_cap``, ``number_of_shares``, ``number_of_investors``
        and the asset-allocation breakdown columns returned by the previous
        version of this library are no longer exposed by the new
        tefas.gov.tr API, so they are dropped from the output.
        """
        assert kind in ("YAT", "EMK", "BYF"), (
            "`kind` should be one of `YAT`, `EMK`, or `BYF`"
        )
        start_date = _parse_date(start)
        end_date = _parse_date(end or start)
        period_months = _months_back(start_date)

        if name:
            codes = [name.upper()]
        else:
            warnings.warn(
                "`fetch` was called without `name`. The new tefas.gov.tr API "
                "no longer supports a single bulk-by-date request, so this "
                f"call fans out one HTTP request per fund and is capped at "
                f"{self.fund_limit} funds (kind={kind}). Pass `name=<fund_code>`"
                " for a fast, complete result, or raise the cap with "
                "`Crawler(fund_limit=N)`.",
                UserWarning,
                stacklevel=2,
            )
            codes = self._list_fund_codes(kind)[: self.fund_limit]

        schema = InfoSchema(many=True)
        frames = []
        for code in codes:
            payload = {"fonKodu": code, "dil": "TR", "periyod": period_months}
            raw = self._do_post(self.price_endpoint, payload)
            if not raw:
                continue
            rows = schema.load(raw)
            frames.append(pd.DataFrame(rows, columns=schema.fields.keys()))

        if not frames:
            return pd.DataFrame(columns=list(InfoSchema().fields.keys()))

        merged = pd.concat(frames, ignore_index=True)
        merged = merged[
            (merged["date"] >= start_date) & (merged["date"] <= end_date)
        ].reset_index(drop=True)

        if columns:
            available = [c for c in columns if c in merged.columns]
            dropped = [c for c in columns if c not in merged.columns]
            if dropped:
                warnings.warn(
                    "Columns no longer exposed by the tefas.gov.tr API and "
                    f"omitted from the result: {dropped}",
                    UserWarning,
                    stacklevel=2,
                )
            merged = merged[available]

        return merged

    def _do_post(self, endpoint: str, payload: dict) -> list:
        response = self.session.post(
            url=f"{self.root_url}{endpoint}",
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        body = response.json()
        return body.get("resultList") or []

    def _list_fund_codes(self, kind: str) -> List[str]:
        payload = {
            "dil": "TR",
            "fonTipi": kind,
            "kurucuKodu": None,
            "sfonTurKod": None,
            "fonTurAciklama": None,
            "islem": 1,
            "fonTurKod": None,
            "fonGrubu": None,
            "donemGetiri1a": "1",
            "donemGetiri3a": "1",
            "donemGetiri6a": "1",
            "donemGetiri1y": "1",
            "donemGetiriyb": "1",
            "donemGetiri3y": "1",
            "donemGetiri5y": "1",
            "basTarih": None,
            "bitTarih": None,
            "calismaTipi": 2,
            "getiriOrani": "1",
        }
        rows = self._do_post(self.list_endpoint, payload)
        return [r["fonKodu"] for r in rows if r.get("fonKodu")]


def _parse_date(value: Union[str, datetime, date]) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError as exc:
            raise ValueError(
                "Date string format is incorrect. It should be `YYYY-MM-DD`"
            ) from exc
    raise ValueError(
        "`date` should be a string like 'YYYY-MM-DD' "
        "or a `datetime.datetime` object."
    )


_VALID_PERIODS = (1, 3, 6, 12, 36, 60)


def _months_back(start: date) -> int:
    """Snap the requested look-back to one of the periods the API actually
    accepts. The endpoint enumerates ``{1, 3, 6, 12, 36, 60}`` months —
    other values return ``Sistem Hatası!!``. Anything older than 5 years is
    not retrievable.
    """
    delta_days = max(0, (date.today() - start).days)
    months_needed = math.ceil(delta_days / 30) + 1
    for period in _VALID_PERIODS:
        if period >= months_needed:
            return period
    return _VALID_PERIODS[-1]
