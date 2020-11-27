"""Tefas Crawler"""

from datetime import datetime
from typing import Dict, List, Union

import requests
from bs4 import BeautifulSoup

MAX_FETCH = 10000

FORM_DATA = {
    # variable data
    "ctl00$MainContent$ScriptManager1": "",
    "ctl00$MainContent$TextBoxStartDate": "",
    "ctl00$MainContent$TextBoxEndDate": "",
    "ctl00$MainContent$HTarihselBitTarih": "",
    "ctl00$MainContent$HTarihselBasTarih": "",
    "ctl00$MainContent$HGeneralBasSira": "0",
    "ctl00$MainContent$HGeneralBitSira": str(MAX_FETCH),
    "ctl00$MainContent$HAllocationBasSira": "0",
    "ctl00$MainContent$HAllocationBitSira": str(MAX_FETCH),
    "ctl00$MainContent$ImageButtonGenelNext.x": "",
    "ctl00$MainContent$ImageButtonGenelNext.y": "",
    # fixed data
    "ctl00$MainContent$ButtonSearchDates": "G\xF6r\xFCnt\xFCle",
    "ctl00$MainContent$RadioButtonListFundMainType": "YAT",
    "ctl00$MainContent$TextBoxOtherFund": "",
    "ctl00$MainContent$TextBoxWatermarkExtenderFund_ClientState": "",
    "ctl00$MainContent$HiddenFieldFundId": "",
    "ctl00$MainContent$DropDownListExtraFundType": "T\xFCm\xFC",
    "ctl00$MainContent$DropDownListFundTypeExplanation": "",
    "ctl00$MainContent$TextBoxWatermarkExtenderStartDate_ClientState": "",
    "ctl00$MainContent$TextBoxWatermarkExtenderEndDate_ClientState": "",
    "ctl00$MainContent$HTarihselFonTip": "YAT",
    "ctl00$MainContent$hdnSelectedTab": "0",
    "ctl00$MainContent$HTarihselFonKod": "",
    "ctl00$MainContent$HTarihselFonTurKod": "",
    "ctl00$MainContent$HTarihselFonExtraTur": "",
    "ctl00$MainContent$HSortDirection": "Descending",
    "ctl00$MainContent$HGeneralSortExpression": "Descending",
    "ctl00$MainContent$HAllocationSortExpression": "Descending",
    "hiddenInputToUpdateATBuffer_CommonToolkitScripts": "1",
}

SESSION_DATA = {
    "__EVENTTARGET": "",
    "__EVENTARGUMENT": "",
    "__LASTFOCUS": "",
    "__VIEWSTATE": "",
    "__VIEWSTATEGENERATOR": "",
    "__VIEWSTATEENCRYPTED": "",
    "__EVENTVALIDATION": "",
    "__ASYNCPOST": "",
}

HTML_TABLE_IDS = ["MainContent_GridViewGenel", "MainContent_GridViewDagilim"]

FORM_DATA_DATE_FIELDS = {
    "ctl00$MainContent$TextBoxStartDate",
    "ctl00$MainContent$TextBoxEndDate",
    "ctl00$MainContent$HTarihselBasTarih",
    "ctl00$MainContent$HTarihselBitTarih",
}


def _update_session_data(res, data):
    soup = BeautifulSoup(res.text, features="html.parser")
    updated_data = {
        key: soup.find(attrs={"name": key}).get("value", "")
        if soup.find(attrs={"name": key})
        else data[key]
        for key in data
    }
    return updated_data


def _parse_table(content, table_id):
    bs = BeautifulSoup(content, features="html.parser")
    table = bs.find("table", attrs={"id": table_id})
    data = []
    rows = table.find_all("tr")
    header = rows.pop(0).find_all("th")
    header = [ele.text.strip() for ele in header]
    for row in rows:
        cols = row.find_all("td")
        cols = [ele.text.strip() for ele in cols]
        data.append(dict(zip(header, cols)))
    return data


def _parse_date(date):
    if isinstance(date, datetime):
        formatted = datetime.strftime(date, "%d.%m.%Y")
    elif isinstance(date, str):
        try:
            parsed = datetime.strptime(date, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError(
                "Date string format is incorrect. "
                "It should be `YYYY-MM-DD`"
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
    """Fetch public fund information from ``https://www.tefas.gov.tr``.

    Examples:

    >>> tefas = Crawler()
    >>> data = tefas.fetch(date="2020-11-20")
    >>> data = tefas.fetch(date="2020-11-20", fund="AAK")
    >>> data = tefas.fetch(start_date="2020-11-19", end_date="2020-11-20")
    >>> data = tefas.fetch(start_date="2020-11-19", end_date="2020-11-20", fund="AAK")
    >>> print(data[0])
    {
        'Tarih': '20.11.2020',
        'FonKodu': 'AAK',
        'Fon Adı': 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON',
        'Fiyat': '41,302235',
        'TedavüldekiPaySayısı': '1.898.223,00',
        'KişiSayısı': '422',
        'Fon Toplam Değer': '78.400.851,68'},
        'Banka Bonosu (%)': '0,00',
        ...
    }
    """

    endpoint = "https://www.tefas.gov.tr/TarihselVeriler.aspx"
    headers = {
        "Connection": "keep-alive",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "DNT": "1",
        "X-Requested-With": "XMLHttpRequest",
        "X-MicrosoftAjax": "Delta=true",
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
        ),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "*/*",
        "Origin": "https://www.tefas.gov.tr",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://www.tefas.gov.tr/TarihselVeriler.aspx",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6",
    }

    def __init__(self):
        self.session = requests.Session()
        res = self.session.get(self.endpoint)
        self.cookies = self.session.cookies.get_dict()
        self.initial_form_data = {
            **FORM_DATA,
            **_update_session_data(res, SESSION_DATA),
        }

    def fetch(self, date: Union[str, datetime]) -> List[Dict]:
        """ Main entry point of the public API. Get fund information.

        Args:
            date: The date that fund imformation is crawled for.

        Returns:
            A list of dictionary where each element is the information for a fund.
        """
        date = _parse_date(date)
        # Get first page
        data = self.initial_form_data
        for field in FORM_DATA_DATE_FIELDS:
            data[field] = date
        # Get remaining pages
        first_page = self._get_first_page(data)
        first_page = _parse_table(first_page.text, HTML_TABLE_IDS[0])
        next_pages = self._get_next_pages(data)
        next_pages = _parse_table(next_pages.text, HTML_TABLE_IDS[0])
        return [*first_page, *next_pages]

    def _do_post(self, data):
        # TODO: error handling
        response = self.session.post(
            url=self.endpoint,
            data=data,
            cookies=self.cookies,
            headers=self.headers,
        )
        return response

    def _get_first_page(self, data):
        mng = "ctl00$MainContent$UpdatePanel1|ctl00$MainContent$ButtonSearchDates"
        data["ctl00$MainContent$ScriptManager1"] = mng
        return self._do_post(data)

    def _get_next_pages(self, data):
        mng = "ctl00$MainContent$UpdatePanel1|ctl00$MainContent$ImageButtonGenelNext"
        data["ctl00$MainContent$ScriptManager1"] = mng
        data["ctl00$MainContent$ImageButtonGenelNext.x"] = "1"
        data["ctl00$MainContent$ImageButtonGenelNext.y"] = "1"
        return self._do_post(data)
