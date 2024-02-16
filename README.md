# Tefas Crawler

[![PyPI version](https://badge.fury.io/py/tefas-crawler.svg)](https://pypi.org/project/tefas-crawler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Versions](https://img.shields.io/pypi/pyversions/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![Package Status](https://img.shields.io/pypi/status/tefas-crawler)](https://pypi.org/project/tefas-crawler)
[![CI Build](https://github.com/burakyilmaz321/tefas-crawler/workflows/Python%20package/badge.svg)](https://github.com/burakyilmaz321/tefas-crawler/actions)

Crawl public invenstment fund information from [Turkey Electronic Fund Trading Platform](https://fundturkey.com.tr) (TEFAS) with ease.

# Installation

```
pip install tefas-crawler
```

# Usage

Import the `Crawler` object and create an instance of it.

```python
from tefas import Crawler

tefas = Crawler()
```

## API

### `fetch(start, end, name, columns, kind)`

|Argument|Type|Description|Required|
|--|--|--|--|
|**start**|`string` or `datetime.datetime`|The date that fund information is crawled for.|Yes|
|**end**|`string` or `datetime.datetime`|End of the period that fund information is crawled for.|No|
|**name**|`string`|Name of the fund. If not given, all funds will be returned.|No|
|**columns[]**|`list` of `string`|List of columns to be returned.|No|
|**kind**|`string`|Type of the fund. One of `YAT`, `EMK`, or `BYF`. Defaults to `YAT`.|No|

### Examples

Get all funds for a given day.

```python
data = tefas.fetch(start="2020-11-20")
```

Get a specific fund for a time period, and select columns.

```python
data = tefas.fetch(start="2020-11-15", end="2020-11-20", name="YAC", columns=["code", "date", "price"])
```

## Data Schema

As of today, we support the following data schema from [Tefas](http://www.fundturkey.com.tr):

| Column                                         | Description                                                | Type |
|------------------------------------------------|------------------------------------------------------------|---|
| date                                           | Sate                                                       | `date` |
| price                                          | Price of the fund for a given date                         | `string` |
| code                                           | Short code of the fund                                     | `string` |
| title                                          | Full name of the fund                                      | `string` |
| market_cap                                     | Total value of the fund                                    | `float` |
| number_of_shares                               | Number of outstanding shares                               | `float` |
| number_of_investors                            | Number of participants                                     | `float` |
| bank_bills                                     | Share of bank bills                                        | `float` |
| exchange_traded_fund                           | Share of exchange traded fund                              | `float` |
| other                                          | Share of other                                             | `float` |
| fx_payable_bills                               | Share of fx payable bills                                  | `float` |
| government_bond                                | Share of government bond                                   | `float` |
| foreign_currency_bills                         | Share of foreign currency bills                            | `float` |
| eurobonds                                      | Share of eurobonds                                         | `float` |
| commercial_paper                               | Share of commercial paper                                  | `float` |
| fund_participation_certificate                 | Share of fund participation certificate                    | `float` |
| real_estate_certificate                        | Share of real estate certificate                           | `float` |
| venture_capital_investment_fund_participation  | Share of venture capital investment fund                   | `float` |
| real_estate_investment_fund_participation      | Share of real estate investment fund                       | `float` |
| treasury_bill                                  | Share of treasury bill                                     | `float` |
| stock                                          | Share of stock                                             | `float` |
| government_bonds_and_bills_fx                  | Share of government bonds and bills (fx)                   | `float` |
| participation_account                          | Share of participation account                             | `float` |
| participation_account_au                       | Share of gold participation account                        | `float` |
| participation_account_d                        | Share of foreign currency participation account            | `float` |
| participation_account_tl                       | Share of Turkish Lira participation account                | `float` |
| government_lease_certificates                  | Share of government lease certificates                     | `float` |
| government_lease_certificates_d                | Share of foreign currency government lease certificates    | `float` |
| government_lease_certificates_tl               | Share of Turkish Lira government lease certificates        | `float` |
| government_lease_certificates_foreign          | Share of government foreign lease certificates             | `float` |
| precious_metals                                | Share of precious metals                                   | `float` |
| precious_metals_byf                            | Share of precious metals stock market investment fund      | `float` |
| precious_metals_kba                            | Share of precious metals government dept instrument        | `float` |
| precious_metals_kks                            | Share of precious metals public lease certificates         | `float` |
| public_domestic_debt_instruments               | Share of foreign exchange public domestic debt instruments | `float` |
| private_sector_lease_certificates              | Share of private sector lease certificates                 | `float` |
| private_sector_bond                            | Share of private sector bond                               | `float` |
| repo                                           | Share of repo                                              | `float` |
| derivatives                                    | Share of derivatives                                       | `float` |
| tmm                                            | Share of tmm                                               | `float` |
| reverse_repo                                   | Share of reverse-repo                                      | `float` |
| asset_backed_securities                        | Share of asset-backed securities                           | `float` |
| term_deposit                                   | Share of term deposit                                      | `float` |
| term_deposit_au                                | Share of gold term deposit                                 | `float` |
| term_deposit_d                                 | Share of foreign currency term deposit                     | `float` |
| term_deposit_tl                                | Share of Turkish Lira term deposit                         | `float` |
| futures_cash_collateral                        | Share of futures cash collateral                           | `float` |
| foreign_debt_instruments                       | Share of foreign debt instruments                          | `float` |
| foreign_domestic_debt_instruments              | Share of foreign domestic debt instruments                 | `float` |
| foreign_private_sector_debt_instruments        | Share of foreign private sector debt instruments           | `float` |
| foreign_exchange_traded_funds                  | Share of foreign exchange traded funds                     | `float` |
| foreign_equity                                 | Share of foreign equity                                    | `float` |
| foreign_securities                             | Share of foreign securities                                | `float` |
| foreign_investment_fund_participation_shares   | Share of foreign investment fund participation             | `float` |
| private_sector_international_lease_certificate | Share of private sector international lease certificate    | `float` |
| private_sector_foreign_debt_instruments        | Share of private sector foreign dept instruments           | `float` |

## To-do

* Increase test coverage
* Request error handling
* Cache query results

## License

[MIT](LICENSE)
