"""Data schema validation"""

from tefas import Crawler


REQUIRED_FIELDS = {
    "FonKodu",
    "Tarih",
    "Fon Adı",
    "Fiyat",
    "TedavüldekiPaySayısı",
    "KişiSayısı",
    "Fon Toplam Değer",
    "Banka Bonosu (%)",
    "Diğer (%)",
    "Döviz Ödemeli Bono (%)",
    "Devlet Tahvili (%)",
    "Dövize Ödemeli Tahvil (%)",
    "Eurobonds (%)",
    "Finansman Bonosu (%)",
    "Fon Katılma Belgesi (%)",
    "Gayrı Menkul Sertifikası (%)",
    "Hazine Bonosu (%)",
    "Hisse Senedi (%)",
    "Kamu Dış Borçlanma Araçları (%)",
    "Katılım Hesabı (%)",
    "Kamu Kira Sertifikaları (%)",
    "Kıymetli Madenler (%)",
    "Özel Sektör Kira Sertifikaları (%)",
    "Özel Sektör Tahvili (%)",
    "Repo (%)",
    "Türev Araçları (%)",
    "TPP (%)",
    "Ters-Repo (%)",
    "Varlığa Dayalı Menkul Kıymetler (%)",
    "Vadeli Mevduat (%)",
    "Yabancı Borçlanma Aracı (%)",
    "Yabancı Hisse Senedi (%)",
    "Yabancı Menkul Kıymet (%)",
}

def test_data_schema():
    """Make an API call to Tefas and validate all required fields are present"""
    crawler = Crawler()
    data = crawler.fetch("2020-11-20")
    assert REQUIRED_FIELDS == set(data[0].keys())
