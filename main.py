from tefas.securities_mutual_funds_crawler import SecuritiesMutualFundsCrawler

# from tefas.filters.static.turkey_stock_fund_filters import turkey_stock_mutual_fund_types_tr

tefas = SecuritiesMutualFundsCrawler(True)
data1 = tefas.fetch_historical_data(
    start="2022-04-15", columns=["code", "title"])
print(data1)

# data2 = tefas.fetch_comparison_return_data()
# print(data2)

# data3 = tefas.fetch_comparison_management_feeds_data()
# print(data3)

# data4 = tefas.fetch_comparison_fund_sizes_data(start="2019-9-15", end="2019-11-15")
# print(data4)
