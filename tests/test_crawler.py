from unittest.mock import MagicMock

from tefas import SecuritiesMutualFundsCrawler


def test_crawler():
    crawler = SecuritiesMutualFundsCrawler()
    assert crawler


def test_empty_result():
    """Test the client when POST to tefas returns empty list"""
    SecuritiesMutualFundsCrawler._do_post = MagicMock(return_value=[])
    crawler = SecuritiesMutualFundsCrawler()
    crawler.fetch(start="2020-11-20")
