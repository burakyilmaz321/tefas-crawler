# setup.py needs __version__, but it does not need all imports coming
# from crawler.Crawler. So if __init__.py is loaded from setup.py,
# don't import crawler.Crawler
if __name__ != "setup.py":
    from tefas.crawler import Crawler

__version__ = "0.2"
__all__ = ["Crawler", "__version__"]
