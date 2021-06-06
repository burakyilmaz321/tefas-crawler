"""Data schema validation"""

from tefas import Crawler
from tefas.schema import InfoSchema, BreakdownSchema


def test_data_schema():
    """Make an API call to Tefas and validate all required fields are present"""
    crawler = Crawler()
    df = crawler.fetch(start="2020-11-20")
    all_fields = set(InfoSchema().fields).union(set(BreakdownSchema().fields))
    assert all_fields == set(df.columns)
