# Tefas Crawler

Crawl public fund information from [Tefas](https://www.tefas.gov.tr) with ease.

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
        'FonKodu': 'AAK',
        'Fon Adı': 'ATA PORTFÖY ÇOKLU VARLIK DEĞİŞKEN FON',
        'Fiyat': '41,302235',
        'TedavüldekiPaySayısı': '1.898.223,00',
        'KişiSayısı': '422',
        'Fon Toplam Değer': '78.400.851,68'},
        'Banka Bonosu (%)': '0,00',
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
| FonKodu | Short code of the fund | `string` |
| Fon Adı | Full name of the fund | `string` |
| Fiyat | Price of the fund | `string` |
| TedavüldekiPaySayısı | Number of shares | `string` |
| KişiSayısı | Number of participants | `string` |
| Fon Toplam Değer | Total value | `string` |

## To-do

**API**

Below API is planned but not implemented yet.

- `fetch(date="2020-11-20", fund="AAK")` A single fund's inormation for a given day.
- `fetch(start_date="2020-11-19", end_date="2020-11-20")` All fund information for a given date range.
- `fetch(start_date="2020-11-19", end_date="2020-11-20", fund="AAK")` A single fund's information for a given date range.

**Data Schema**

- Map each field to an appropriate data type instead of string.
- Add the "distribution" pane.

## License

[MIT](LICENSE)
