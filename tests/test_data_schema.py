"""Data schema validation"""

from tefas import Crawler
from tefas.schema import InfoSchema


def test_data_schema():
    """Make a real API call to Tefas and validate columns match the schema."""
    crawler = Crawler()
    df = crawler.fetch(start="2025-04-01", end="2025-04-15", name="YAC")
    assert set(InfoSchema().fields) == set(df.columns)
    assert not df.empty
