from unittest.mock import patch

from tefas import Crawler


def test_crawler():
    crawler = Crawler()
    assert crawler


def test_empty_result():
    """Test the client when the API returns an empty resultList."""
    with patch.object(Crawler, "_do_post", return_value=[]):
        crawler = Crawler()
        df = crawler.fetch(start="2020-11-20", name="YAC")
        assert df.empty
