"""Tefas Crawler

Crawls public invenstment fund information from Turkey Electronic Fund Trading Platform.
"""

import ssl
from datetime import datetime
from typing import Dict, List, Optional, Union

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
import time

from tefas.schema import BreakdownSchema, InfoSchema


class Crawler:
    """Fetch public fund information from ``http://www.fundturkey.com.tr``.

    Examples:

    >>> tefas = Crawler()
    >>> data = tefas.fetch(start="2020-11-20")
    >>> data.head(1)
           price  number_of_shares code  ... precious_metals  stock  private_sector_bond
    0  41.302235         1898223.0  AAK  ...             0.0  31.14                 3.28
    >>> data = tefas.fetch(name="YAC",
    >>>                    start="2020-11-15",
    >>>                    end="2020-11-20",
    >>>                    columns=["date", "code", "price"])
    >>> data.head()
             date code     price
    0  2020-11-20  YAC  1.844274
    1  2020-11-19  YAC  1.838618
    2  2020-11-18  YAC  1.833198
    3  2020-11-17  YAC  1.838440
    4  2020-11-16  YAC  1.827832
    """

    root_url = "https://fundturkey.com.tr"
    detail_endpoint = "/api/DB/BindHistoryAllocation"
    info_endpoint = "/api/DB/BindHistoryInfo"
    headers = {
        "Connection": "keep-alive",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
        ),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Origin": "https://fundturkey.com.tr",
        "Referer": "https://fundturkey.com.tr/TarihselVeriler.aspx",
    }

    def __init__(self):
        self.session = _get_session()
        _ = self.session.get(self.root_url)
        self.cookies = self.session.cookies.get_dict()

    def fetch(
        self,
        start: Union[str, datetime],
        end: Optional[Union[str, datetime]] = None,
        name: Optional[str] = None,
        columns: Optional[List[str]] = None,
        kind: Optional[str] = "YAT",
    ) -> pd.DataFrame:
        """Main entry point of the public API. Get fund information.

        Args:
            start: The date that fund information is crawled for.
            end: End of the period that fund information is crawled for. (optional)
            name: Name of the fund. If not given, all funds will be returned. (optional)
            columns: List of columns to be returned. (optional)
            kind: Type of the fund. One of `YAT`, `EMK`, or `BYF`. Defaults to `YAT`. (optional)
                - `YAT`: Securities Mutual Funds
                - `EMK`: Pension Funds
                - `BYF`: Exchange Traded Funds

        Returns:
            A pandas DataFrame where each row is the information for a fund.

        Raises:
            ValueError if date format is wrong.
        """  # noqa
        assert kind in [
            "YAT",
            "EMK",
            "BYF",
        ], "`kind` should be one of `YAT`, `EMK`, or `BYF`"
        start_date = _parse_date(start)
        end_date = _parse_date(end or start)
        data = {
            "fontip": kind,
            "bastarih": start_date,
            "bittarih": end_date,
            "fonkod": name.upper() if name else "",
        }

        # General info pane
        info_schema = InfoSchema(many=True)
        info = self._do_post(self.info_endpoint, data)
        info = info_schema.load(info)
        info = pd.DataFrame(info, columns=info_schema.fields.keys())

        # Portfolio breakdown pane
        detail_schema = BreakdownSchema(many=True)
        detail = self._do_post(self.detail_endpoint, data)
        detail = detail_schema.load(detail)
        detail = pd.DataFrame(detail, columns=detail_schema.fields.keys())

        # Merge two panes
        merged = pd.merge(info, detail, on=["code", "date"])

        # Return only desired columns
        merged = merged[columns] if columns else merged

        return merged

    def _do_post(self, endpoint: str, data: Dict[str, str], attempt: int = 0) -> Dict[str, str]:
        max_attempt = 5
        try:
            response = self.session.post(
                url=f"{self.root_url}/{endpoint}",
                data=data,
                cookies=self.cookies,
                headers=self.headers,
            )
            return response.json().get("data", {})
        except ValueError:
            if attempt == max_attempt:
                raise Exception("Max attempt limit reached. Wait for a while before trying again")
            attempt += 1
            sleep_sec = attempt * 5
            print("Stuck at rate limiting or robot check. Waiting for "+str(sleep_sec)+" seconds to retry. Attempt #"+str(attempt))
            time.sleep(sleep_sec)
            print("Trying..")
            return self._do_post(endpoint, data, attempt)

def _parse_date(date: Union[str, datetime]) -> str:
    if isinstance(date, datetime):
        formatted = datetime.strftime(date, "%d.%m.%Y")
    elif isinstance(date, str):
        try:
            parsed = datetime.strptime(date, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError(
                "Date string format is incorrect. It should be `YYYY-MM-DD`"
            ) from exc
        else:
            formatted = datetime.strftime(parsed, "%d.%m.%Y")
    else:
        raise ValueError(
            "`date` should be a string like 'YYYY-MM-DD' "
            "or a `datetime.datetime` object."
        )
    return formatted


def _get_session() -> requests.Session:
    """
    Create and return a custom requests session with a modified SSL context.

    This function configures a custom SSL context to use the `OP_LEGACY_SERVER_CONNECT`
    option, which allows for legacy server connections, addressing specific issues
    with OpenSSL 3.0.0.

    The custom session uses a custom HTTP adapter that incorporates this modified
    SSL context for the session's connections.

    This approach is based on solutions found at:
    - https://stackoverflow.com/questions/71603314/ssl-error-unsafe-legacy-renegotiation-disabled/
    - https://github.com/urllib3/urllib3/issues/2653
    """

    class CustomHttpAdapter(HTTPAdapter):
        def __init__(self, ssl_context=None, **kwargs):
            self.ssl_context = ssl_context
            super().__init__(**kwargs)

        def init_poolmanager(
            self, connections, maxsize, block=False
        ):  # pylint: disable=arguments-differ
            self.poolmanager = PoolManager(
                num_pools=connections,
                maxsize=maxsize,
                block=block,
                ssl_context=self.ssl_context,
            )

    ctx = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    ctx.options |= 0x4  # OP_LEGACY_SERVER_CONNECT
    session = requests.session()
    session.mount("https://", CustomHttpAdapter(ctx))
    return session
