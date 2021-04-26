"""Tefas Crawler"""

from datetime import datetime
from typing import Dict, List, Union

import requests

from tefas.schema import InfoSchema, BreakdownSchema, Fields


def _merge_tables(left: List[Dict], right: List[Dict], on: str) -> List[Dict]:
    """Merge two collection of objects if the values of given key match."""
    left_dict = {row[on]: {k: v for k, v in row.items() if k != on} for row in left}
    right_dict = {row[on]: {k: v for k, v in row.items() if k != on} for row in right}
    merged_dict = {}
    all_keys = set(left_dict.keys()).union(set(right_dict.keys()))
    for key in all_keys:
        left_ = left_dict.get(key, {}).copy()
        right_ = right_dict.get(key, {}).copy()
        left_.update(right_)
        merged_dict[key] = left_
    merged_table = [{on: k, **v} for k, v in merged_dict.items()]
    return merged_table


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


class Crawler:
    """Fetch public fund information from ``http://www.fundturkey.com.tr``.

    Examples:

    >>> tefas = Crawler()
    >>> data = tefas.fetch(date="2020-11-20")
    >>> print(data[0])
    {
        'code': 'PPF',
        'title': 'AZİMUT PORTFÖY AKÇE SERBEST FON',
        'date': datetime.date(2020, 11, 20),
        'other': 0.0,
        'government_bond': 0.0,
        'eurobonds': 0.0,
        ...
    }
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

    def fetch(self, date: Union[str, datetime]) -> List[Dict]:
        """Main entry point of the public API. Get fund information.

        Args:
            date: The date that fund information is crawled for.

        Returns:
            A list of dictionary where each element is the information for a fund.

        Raises:
            ValueError if date format is wrong.
        """
        date = _parse_date(date)
        data = {
            "fontip": "YAT",
            "bastarih": date,
            "bittarih": date,
        }
        # General info pane
        info_schema = InfoSchema(many=True)
        info = self._do_post(self.info_endpoint, data)
        info = info_schema.load(info)
        # Portfolio breakdown pane
        detail_schema = BreakdownSchema(many=True)
        detail = self._do_post(self.detail_endpoint, data)
        detail = detail_schema.load(detail)
        # Merge two panes
        merged = _merge_tables(info, detail, "code")
        # Make sure final data has all required fields
        merged = [{f: d.setdefault(f) for f in Fields.ALL} for d in merged]
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
