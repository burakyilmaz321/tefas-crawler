# Tefas Crawler

[![PyPI version](https://badge.fury.io/py/tefas-crawler.svg)](https://pypi.org/project/tefas-crawler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Versions](https://img.shields.io/pypi/pyversions/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![Package Status](https://img.shields.io/pypi/status/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![CI Build](https://github.com/burakyilmaz321/tefas-crawler/workflows/Python%20package/badge.svg)](https://github.com/burakyilmaz321/tefas-crawler/actions)

Crawl public invenstment fund information from [Turkey Electronic Fund Trading Platform](https://www.tefas.gov.tr) (TEFAS) with ease.

# Installation

```
pip install tefas-crawler
```

# Usage

Import the `Crawler` object and create an instance of it.

```python
from tefas import Crawler

crawler = Crawler()
```

## API

### `fetch(date="YYYY-MM-DD")`

Get all funds for a given day.

```python
data = crawler.fetch(date="2020-11-20")
```

This should return all fund information for the given day as a list of dictionaries like this:

```
[
    {
        'Tarih': '20.11.2020',
        'Fon Kodu': 'AAK',
        'Fon Adı': 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON',
        'Fiyat': 41.302235,
        'TedavüldekiPaySayısı': 1898223.00,
        'KişiSayısı': 422.0,
        'Fon Toplam Değer': 78400851.68},
        'Banka Bonosu (%)': 0.00,
        ...
    },
    ...
]
```

## Data Schema

As of today, we support the following data schema from [Tefas](https://www.tefas.gov.tr):

| Column | Description | Type |
|---|---|---|
| Tarih | Date | `string`|
| Fon Kodu | Short code of the fund | `string` |
| Fon Adı | Full name of the fund | `string` |
| Fiyat | Price of the fund | `float` |
| TedavüldekiPaySayısı | Number of shares | `float` |
| KişiSayısı | Number of participants | `float` |
| Fon Toplam Değer | Total value | `float` |
| Banka Bonosu (%) | .. | `float` |
| Diğer (%) | .. | `float` |
| Döviz Ödemeli Bono (%) | .. | `float` |
| Devlet Tahvili (%) | .. | `float` |
| Dövize Ödemeli Tahvil (%) | .. | `float` |
| Eurobonds (%) | .. | `float` |
| Finansman Bonosu (%) | .. | `float` |
| Fon Katılma Belgesi (%) | .. | `float` |
| Gayrı Menkul Sertifikası (%) | .. | `float` |
| Hazine Bonosu (%) | .. | `float` |
| Hisse Senedi (%) | .. | `float` |
| Kamu Dış Borçlanma Araçları (%) | .. | `float` |
| Katılım Hesabı (%) | .. | `float` |
| Kamu Kira Sertifikaları (%) | .. | `float` |
| Kıymetli Madenler (%) | .. | `float` |
| Özel Sektör Kira Sertifikaları (%) | .. | `float` |
| Özel Sektör Tahvili (%) | .. | `float` |
| Repo (%) | .. | `float` |
| Türev Araçları (%) | .. | `float` |
| TPP (%) | .. | `float` |
| Ters-Repo (%) | .. | `float` |
| Varlığa Dayalı Menkul Kıymetler (%) | .. | `float` |
| Vadeli Mevduat (%) | .. | `float` |
| Yabancı Borçlanma Aracı (%) | .. | `float` |
| Yabancı Hisse Senedi (%) | .. | `float` |
| Yabancı Menkul Kıymet (%) | .. | `float` |

## To-do

**API**

Below API is planned but not implemented yet.

- `fetch(date="2020-11-20", fund="AAK")` A single fund's inormation for a given day.
- `fetch(start_date="2020-11-19", end_date="2020-11-20")` All fund information for a given date range.
- `fetch(start_date="2020-11-19", end_date="2020-11-20", fund="AAK")` A single fund's information for a given date range.

## License

[MIT](LICENSE)
