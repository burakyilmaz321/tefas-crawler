"""Tefas PensionFundsCrawler

Crawls public invenstment fund information from Turkey Electronic Fund Trading Platform.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union

import pandas as pd
import requests
from tefas.cache.inmemorycache import get_from_cache, set_cache
from tefas.response import ResponseModel

from tefas.schemas import InfoSchema, BreakdownSchema, \
    ComparisonManagementFeedsSchema, \
    ComparisonFundSizesSchema, \
    ComparisonFundReturnSchema


class PensionFundsCrawler:
    """Fetch public fund information from ``https://www.tefas.gov.tr or http://www.fundturkey.com.tr``.

    Examples:

    >>> tefas = PensionFundsCrawler()
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
    comparison_fund_returns_endpoint = "/api/DB/BindComparisonFundReturns"
    comparison_management_feeds_endpoint = "/api/DB/BindComparisonManagementFees"
    comparison_fund_sizes_endpoint = "/api/DB/BindComparisonFundSizes"

    def __init__(self, is_tr=True):
        self.is_tr = is_tr
        self.session = requests.Session()
        if is_tr:
            self.root_url = "https://www.tefas.gov.tr"
        _ = self.session.get(self.root_url)
        self.cookies = self.session.cookies.get_dict()

    def fetch_historical_data(
            self,
            start: Union[str, datetime],
            end: Optional[Union[str, datetime]] = None,
            fund_group: Optional[str] = None,
            columns: Optional[List[str]] = None,
            name: Optional[str] = None,
            **fund_type_codes: Optional[str],
    ) -> pd.DataFrame:

        fund_type_code = self._format_fund_type(fund_type_codes)
        start_date = _parse_date(start)
        end_date = _parse_date(end or start)

        data = {
            "fontip": "EMK",
            "fonturkod": fund_type_code,
            "fongrup": fund_group,
            "bastarih": start_date,
            "bittarih": end_date,
            "fonkod": name.upper() if name else "",
            "sfontur": "",
            "fonunvantip": "",
        }

        # ask from cache
        key = str(data) + "fetch_historical_data"
        result = get_from_cache(key)
        if len(result.index) > 0:
            return result

        # General info pane
        info_schema = InfoSchema(many=True)
        info = self._do_post(self.info_endpoint, "/TarihselVeriler.aspx", data)
        info = info_schema.load(info)
        info = pd.DataFrame(info, columns=info_schema.fields.keys())

        # Portfolio breakdown pane
        detail_schema = BreakdownSchema(many=True)
        detail = self._do_post(self.detail_endpoint,
                               "/TarihselVeriler.aspx", data)
        detail = detail_schema.load(detail)
        detail = pd.DataFrame(detail, columns=detail_schema.fields.keys())

        # Merge two panes
        merged = pd.merge(info, detail, on=["code", "date"])

        # Return only desired columns
        merged = merged[columns] if columns else merged
        set_cache(key, merged)
        return merged

    def fetch_comparison_return_data(self,
                                     start: Union[str, datetime] = "Başlangıç",
                                     end: Optional[Union[str,
                                                         datetime]] = "Bitiş",
                                     fund_group: Optional[str] = None,
                                     fund_type_code: Optional[str] = None,
                                     fund_title_type: Optional[str] = None,
                                     columns: Optional[List[str]] = None,
                                     ) -> pd.DataFrame:

        start_date = start
        end_date = end
        if start != "Başlangıç":
            start_date = _parse_date(start)

        if end != "Bitiş":
            end_date = _parse_date(end or start)

        data = {
            "calismatipi": "2",
            "fontip": "EMK",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": fund_group,
            "bastarih": start_date,
            "bittarih": end_date,
            "fonturkod": fund_type_code,
            "fonunvantip": fund_title_type,
            "strperiod": "1,1,1,1,1,1,1",
            "islemdurum": "",
        }

        # ask from cache
        key = str(data) + "fetch_comparison_return_data"
        result = get_from_cache(key)
        if len(result.index) > 0:
            return result

        # comparison fund return pane
        comparison_return_schema = ComparisonFundReturnSchema(many=True)
        comparison_return = self._do_post(
            self.comparison_fund_returns_endpoint, "", data)
        comparison_return = comparison_return_schema.load(comparison_return)
        comparison_return = pd.DataFrame(
            comparison_return, columns=comparison_return_schema.fields.keys())

        result_data = comparison_return[columns] if columns else comparison_return
        set_cache(key, result_data)
        return result_data

    def fetch_comparison_management_feeds_data(self,
                                               fund_title_type: Optional[str] = None,
                                               fund_group: Optional[str] = None,
                                               fund_type_code: Optional[str] = None,
                                               columns: Optional[List[str]
                                                                 ] = None,
                                               ) -> pd.DataFrame:

        data = {
            "fontip": "EMK",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": fund_group,
            "fonturkod": fund_type_code,
            "fonunvantip": fund_title_type,
            "islemdurum": "", }

        # ask from cache
        key = str(data) + "fetch_comparison_management_feeds_data"
        result = get_from_cache(key)
        if len(result.index) > 0:
            return result

        # comparison management feeds pane
        comparison_management_feeds_schema = ComparisonManagementFeedsSchema(
            many=True)
        comparison_management_feeds = self._do_post(self.comparison_management_feeds_endpoint, "",
                                                    data)
        comparison_management_feeds = comparison_management_feeds_schema.load(
            comparison_management_feeds)
        comparison_management_feeds = pd.DataFrame(comparison_management_feeds,
                                                   columns=comparison_management_feeds_schema.fields.keys())
        result_data = comparison_management_feeds[columns] if columns else comparison_management_feeds
        set_cache(key, result_data)
        return result_data

    def fetch_comparison_fund_sizes_data(self,
                                         start: Union[str, datetime],
                                         end: Optional[Union[str, datetime]],
                                         fund_title_type: Optional[str] = None,
                                         fund_group: Optional[str] = None,
                                         fund_type_code: Optional[str] = None,
                                         columns: Optional[List[str]] = None,
                                         ) -> pd.DataFrame:

        start_date = _parse_date(start)
        end_date = _parse_date(end or start)

        data = {
            "calismatipi": "2",
            "fontip": "EMK",
            "sfontur": "",
            "kurucukod": "",
            "fongrup": fund_group,
            "bastarih": start_date,
            "bittarih": end_date,
            "fonturkod": fund_type_code,
            "fonunvantip": fund_title_type,
            "strperiod": "1,1,1,1,1,1,1",
            "islemdurum": "", }

        # ask from cache
        key = str(data) + "fetch_comparison_fund_sizes_data"
        result = get_from_cache(key)
        if len(result.index) > 0:
            return result

        # comparison fund sizes pane
        comparison_fund_sizes_schema = ComparisonFundSizesSchema(many=True)
        comparison_fund_sizes = self._do_post(self.comparison_fund_sizes_endpoint, "",
                                              data)
        comparison_fund_sizes = comparison_fund_sizes_schema.load(
            comparison_fund_sizes)
        comparison_fund_sizes = pd.DataFrame(comparison_fund_sizes,
                                             columns=comparison_fund_sizes_schema.fields.keys())
        result_data = comparison_fund_sizes[columns] if columns else comparison_fund_sizes
        set_cache(key, result_data)
        return result_data

    def _do_post(self, endpoint: str, referer: str, data: Dict[str, str]) -> ResponseModel:
        try:
            response = self.session.post(
                url=f"{self.root_url}/{endpoint}",
                data=data,
                cookies=self.cookies,
                headers={
                    "Connection": "keep-alive",
                    "X-Requested-With": "XMLHttpRequest",
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
                    ),
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Origin": self.root_url,
                    "Referer": self.root_url + referer,
                },
            )
            return ResponseModel("", True, response.json().get("data", {}))
        except requests.exceptions.Timeout:
            return ResponseModel("System Timeout", False)
        except requests.exceptions.TooManyRedirects:
            return ResponseModel("Too Many Redirects", False)
        except requests.exceptions.RequestException as e:
            return ResponseModel("Request Exception", False)

    def _format_fund_type(self, fund_type_codes):
        fund_type_code = ""
        if fund_type_codes != "":
            for key, value in fund_type_codes.items():
                if key == 0:
                    fund_type_code += value
                fund_type_code += fund_type_code + "," + value
        return fund_type_code


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
