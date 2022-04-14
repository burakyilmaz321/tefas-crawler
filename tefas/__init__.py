# pylint: disable=unused-import
# pylint: disable=import-outside-toplevel
# pylint: disable=redefined-outer-name

__version__ = "0.3.3"
__all__ = ["SecuritiesMutualFundsCrawler", "__version__"]


def __getattr__(name):
    # PEP-562: Lazy loaded attributes on python modules
    if name == "SecuritiesMutualFundsCrawler":
        from tefas.securities_mutual_funds_crawler import SecuritiesMutualFundsCrawler

        return SecuritiesMutualFundsCrawler

    raise AttributeError(f"module {__name__} has no attribute {name}")


# static checker hack
STATIC_CHECKER_HACK = False
if STATIC_CHECKER_HACK:
    from tefas.securities_mutual_funds_crawler import SecuritiesMutualFundsCrawler
