# pylint: disable=unused-import
# pylint: disable=import-outside-toplevel

__version__ = "0.2"
__all__ = ["Crawler", "__version__"]


def __getattr__(name):
    # PEP-562: Lazy loaded attributes on python modules
    if name == "Crawler":
        from tefas.crawler import Crawler

    raise AttributeError(f"module {__name__} has no attribute {name}")
