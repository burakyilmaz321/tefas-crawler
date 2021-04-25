"""Tefas Crawler"""

from datetime import datetime
from typing import Dict, List, Union

import requests

from tefas.schema import REQUIRED_FIELDS


def _merge_tables(
    left: List[Dict], right: List[Dict], left_on: List[str], right_on: List[str]
) -> List[Dict]:
    """Merge two collection of objects if the values of given key match."""
    left_dict = {
        row[left_on]: {k: v for k, v in row.items() if k != left_on} for row in left
    }
    right_dict = {
        row[right_on]: {k: v for k, v in row.items() if k != right_on} for row in right
    }
    merged_dict = {}
    all_keys = set(left_dict.keys()).union(set(right_dict.keys()))
    for key in all_keys:
        left_ = left_dict.get(key, {}).copy()
        right_ = right_dict.get(key, {}).copy()
        left_.update(right_)
        merged_dict[key] = left_
    merged_table = [{left_on: k, **v} for k, v in merged_dict.items()]
    return merged_table


def _parse_date(date: str) -> str:
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


def _map_fields(data: Dict) -> Dict:
    mapping = {
        "FONKODU": "FonKodu",
        "TARIH": "Tarih",
        "FONUNVAN": "Fon Adı",
        "FIYAT": "Fiyat",
        "TEDPAYSAYISI": "TedavüldekiPaySayısı",
        "KISISAYISI": "KişiSayısı",
        "PORTFOYBUYUKLUK": "Fon Toplam Değer",
        "Banka Bonosu (%)": "Banka Bonosu (%)",
        "Diğer (%)": "Diğer (%)",
        "Döviz Ödemeli Bono (%)": "Döviz Ödemeli Bono (%)",
        "Devlet Tahvili (%)": "Devlet Tahvili (%)",
        "Dövize Ödemeli Tahvil (%)": "Dövize Ödemeli Tahvil (%)",
        "Eurobonds (%)": "Eurobonds (%)",
        "Finansman Bonosu (%)": "Finansman Bonosu (%)",
        "Fon Katılma Belgesi (%)": "Fon Katılma Belgesi (%)",
        "Gayrı Menkul Sertifikası (%)": "Gayrı Menkul Sertifikası (%)",
        "Hazine Bonosu (%)": "Hazine Bonosu (%)",
        "Hisse Senedi (%)": "Hisse Senedi (%)",
        "Kamu Dış Borçlanma Araçları (%)": "Kamu Dış Borçlanma Araçları (%)",
        "Katılım Hesabı (%)": "Katılım Hesabı (%)",
        "Kamu Kira Sertifikaları (%)": "Kamu Kira Sertifikaları (%)",
        "Kıymetli Madenler (%)": "Kıymetli Madenler (%)",
        "Özel Sektör Kira Sertifikaları (%)": "Özel Sektör Kira Sertifikaları (%)",
        "Özel Sektör Tahvili (%)": "Özel Sektör Tahvili (%)",
        "Repo (%)": "Repo (%)",
        "Türev Araçları (%)": "Türev Araçları (%)",
        "TPP (%)": "TPP (%)",
        "Ters-Repo (%)": "Ters-Repo (%)",
        "Varlığa Dayalı Menkul Kıymetler (%)": "Varlığa Dayalı Menkul Kıymetler (%)",
        "Vadeli Mevduat (%)": "Vadeli Mevduat (%)",
        "Yabancı Borçlanma Aracı (%)": "Yabancı Borçlanma Aracı (%)",
        "Yabancı Hisse Senedi (%)": "Yabancı Hisse Senedi (%)",
        "Yabancı Menkul Kıymet (%)": "Yabancı Menkul Kıymet (%)",
    }
    return [{mapping[k]: v for k, v in d.items() if k in mapping} for d in data]


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
        'Fon Kodu': 'AAK',
        'Fon Adı': 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON',
        'Fiyat': '41,302235',
        'TedavüldekiPaySayısı': '1.898.223,00',
        'KişiSayısı': '422',
        'Fon Toplam Değer': '78.400.851,68'},
        'Banka Bonosu (%)': '0,00',
        ...
    }
    """

    root_url = "https://www.tefas.gov.tr"
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
        "Origin": "https://www.tefas.gov.tr",
        "Referer": "https://www.tefas.gov.tr/TarihselVeriler.aspx",
    }

    def __init__(self):
        self.session = requests.Session()
        _ = self.session.get(self.root_url)
        self.cookies = self.session.cookies.get_dict()

    def fetch(self, date: Union[str, datetime]) -> List[Dict]:
        """Main entry point of the public API. Get fund information.

        Args:
            date: The date that fund imformation is crawled for.

        Returns:
            A list of dictionary where each element is the information for a fund.
        """
        date = _parse_date(date)
        data = {
            "fontip": "YAT",
            "bastarih": date,
            "bittarih": date,
        }
        info = self._do_post(self.info_endpoint, data)
        detail = self._do_post(self.detail_endpoint, data)
        merged = _merge_tables(info, detail, "FONKODU", "Fon Kodu")
        merged = _map_fields(merged)
        # Make sure final data has all required fields
        merged = [{f: d.setdefault(f) for f in REQUIRED_FIELDS} for d in merged]
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
