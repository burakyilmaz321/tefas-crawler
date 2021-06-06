"""Tefas Crawler

Crawls public invenstment fund information from Turkey Electronic Fund Trading Platform.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union

import requests
import pandas as pd

from tefas.schema import InfoSchema, BreakdownSchema


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

    root_url = "http://www.fundturkey.com.tr"
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
        "Origin": "http://www.fundturkey.com.tr",
        "Referer": "http://www.fundturkey.com.tr/TarihselVeriler.aspx",
    }

    def __init__(self):
        self.session = requests.Session()
        _ = self.session.get(self.root_url)
        self.cookies = self.session.cookies.get_dict()

    def fetch(
        self,
        start: Union[str, datetime],
        end: Optional[Union[str, datetime]] = None,
        name: Optional[str] = None,
        columns: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """Main entry point of the public API. Get fund information.

        Args:
            start: The date that fund information is crawled for.
            end: End of the period that fund information is crawled for. (optional)
            name: Name of the fund. If not given, all funds will be returned. (optional)
            columns: List of columns to be returned. (optional)

        Returns:
            A pandas DataFrame where each row is the information for a fund.

        Raises:
            ValueError if date format is wrong.
        """
        start_date = _parse_date(start)
        end_date = _parse_date(end or start)
        data = {
            "fontip": "YAT",
            "bastarih": start_date,
            "bittarih": end_date,
            "fonkod": name.upper() if name else "",
        }

        # General info pane
        info_schema = InfoSchema(many=True)
        info = self._do_post(self.info_endpoint, data)
        info = info_schema.load(info)
        info = pd.DataFrame(info)

        # Portfolio breakdown pane
        detail_schema = BreakdownSchema(many=True)
        detail = self._do_post(self.detail_endpoint, data)
        detail = detail_schema.load(detail)
        detail = pd.DataFrame(detail)

        # Merge two panes
        merged = pd.merge(info, detail, on=["code", "date"])

        # Return only desired columns
        merged = merged[columns] if columns else merged

        return merged

    def _do_post(self, endpoint: str, data: Dict[str, str]) -> Dict[str, str]:
        # TODO: error handling. this is quiet fishy now.
        response = self.session.post(
            url=f"{self.root_url}/{endpoint}",
            data=data,
            cookies=self.cookies,
            headers=self.headers,
        )
        return response.json().get("data", {})


def _parse_date(date: Union[str, datetime]) -> str:
    if isinstance(date, datetime):
        formatted = datetime.strftime(date, "%d.%m.%Y")
    elif isinstance(date, str):
        try:
            parsed = datetime.strptime(date, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError(
                "Date string format is incorrect. " "It should be `YYYY-MM-DD`"
            ) from exc
        else:
            formatted = datetime.strftime(parsed, "%d.%m.%Y")
    else:
        raise ValueError(
            "`date` should be a string like 'YYYY-MM-DD' "
            "or a `datetime.datetime` object."
        )
    return formatted
