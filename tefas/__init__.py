# pylint: disable=unused-import
# pylint: disable=import-outside-toplevel
# pylint: disable=redefined-outer-name

__version__ = "0.3.0"
__all__ = ["Crawler", "__version__"]


def __getattr__(name):
    # PEP-562: Lazy loaded attributes on python modules
    if name == "Crawler":
        from tefas.crawler import Crawler

        return Crawler

    raise AttributeError(f"module {__name__} has no attribute {name}")


# static checker hack
STATIC_CHECKER_HACK = False
if STATIC_CHECKER_HACK:
    from tefas.crawler import Crawler
