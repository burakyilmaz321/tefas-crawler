"""Data schema validation"""

from tefas import SecuritiesMutualFundsCrawler
from tefas.schemas import InfoSchema, BreakdownSchema


def test_data_schema():
    """Make an API call to Tefas and validate all required fields are present"""
    crawler = SecuritiesMutualFundsCrawler()
    df = crawler.fetch(start="2020-11-20")
    all_fields = set(InfoSchema().fields).union(set(BreakdownSchema().fields))
    assert all_fields == set(df.columns)
