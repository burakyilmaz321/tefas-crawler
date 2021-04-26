# Tefas Crawler

[![PyPI version](https://badge.fury.io/py/tefas-crawler.svg)](https://pypi.org/project/tefas-crawler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Versions](https://img.shields.io/pypi/pyversions/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![Package Status](https://img.shields.io/pypi/status/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![CI Build](https://github.com/burakyilmaz321/tefas-crawler/workflows/Python%20package/badge.svg)](https://github.com/burakyilmaz321/tefas-crawler/actions)

Crawl public invenstment fund information from [Turkey Electronic Fund Trading Platform](http://www.fundturkey.com.tr) (TEFAS) with ease.

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
        'code': 'PPF',
        'title': 'AZİMUT PORTFÖY AKÇE SERBEST FON',
        'date': datetime.date(2020, 11, 20),
        'other': 0.0,
        'government_bond': 0.0,
        'eurobonds': 0.0,
        ...
    },
    ...
]
```

## Data Schema

As of today, we support the following data schema from [Tefas](http://www.fundturkey.com.tr):

| Column | Description | Type |
|---|---|---|
| date | Sate | `datetime.date` |
| price | Price of the fund for a given date | `string` |
| code | Short code of the fund | `string` |
| title | Full name of the fund | `string` |
| market_cap | Total value of the fund | `float` |
| number_of_shares | Number of outstanding shares | `float` |
| number_of_investors | Number of participants | `float` |
| tmm | Share of tmm | `float` |
| repo | Share of repo | `float` |
| other | Share of other | `float` |
| stock | Share of stock | `float` |
| eurobonds | Share of eurobonds | `float` |
| bank_bills | Share of bank bills | `float` |
| derivatives | Share of derivatives | `float` |
| reverse_repo | Share of reverse-repo | `float` |
| term_deposit | Share of term deposit | `float` |
| treasury_bill | Share of treasury bill | `float` |
| foreign_equity | Share of foreign equity | `float` |
| government_bond | Share of government bond | `float` |
| precious_metals | Share of precious metals | `float` |
| commercial_paper | Share of commercial paper | `float` |
| fx_payable_bills | Share of fx payable bills | `float` |
| foreign_securities | Share of foreign securities | `float` |
| private_sector_bond | Share of private sector bond | `float` |
| participation_account | Share of participation account | `float` |
| foreign_currency_bills | Share of foreign currency bills | `float` |
| asset_backed_securities | Share of asset-backed securities | `float` |
| real_estate_certificate | Share of real estate certificate | `float` |
| foreign_debt_instruments | Share of foreign debt instruments | `float` |
| government_lease_certificates | Share of government lease certificates | `float` |
| fund_participation_certificate | Share of fund participation certificate | `float` |
| government_bonds_and_bills_fx | Share of government bonds and bills (fx) | `float` |
| private_sector_lease_certificates | Share of private sector lease certificates | `float` |

## To-do

**API**

Below API is planned but not implemented yet.

- `fetch(date="2020-11-20", fund="AAK")` A single fund's inormation for a given day.
- `fetch(start_date="2020-11-19", end_date="2020-11-20")` All fund information for a given date range.
- `fetch(start_date="2020-11-19", end_date="2020-11-20", fund="AAK")` A single fund's information for a given date range.

## License

[MIT](LICENSE)
