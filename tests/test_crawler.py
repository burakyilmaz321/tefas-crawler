from unittest.mock import MagicMock

from tefas import Crawler


def test_crawler():
    crawler = Crawler()
    assert crawler

def test_empty_result():
    """Test the client when POST to tefas returns empty list"""
    Crawler._do_post = MagicMock(return_value=[])
    crawler = Crawler()
    crawler.fetch(start="2020-11-20")
