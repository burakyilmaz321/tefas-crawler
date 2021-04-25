"""Data schema validation"""

from tefas import Crawler
from tefas.schema import REQUIRED_FIELDS


def test_data_schema():
    """Make an API call to Tefas and validate all required fields are present"""
    crawler = Crawler()
    data = crawler.fetch("2020-11-20")
    for datum in data:
        assert REQUIRED_FIELDS == set(datum.keys())
