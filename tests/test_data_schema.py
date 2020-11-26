"""Data schema validation"""

from tefas import Crawler


REQUIRED_FIELDS = {
    "Tarih",
    "FonKodu",
    "Fon Adı",
    "Fiyat",
    "TedavüldekiPaySayısı",
    "KişiSayısı",
    "Fon Toplam Değer",
}

def test_data_schema():
    """Make an API call to Tefas and validate all required fields are present"""
    crawler = Crawler()
    data = crawler.fetch("2020-11-20")
    assert REQUIRED_FIELDS == set(data[0].keys())
