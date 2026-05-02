# Changelog

All notable changes to `tefas-crawler` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-04-28

### Changed

- **Migrated to the new `tefas.gov.tr` JSON API.** TEFAS retired the legacy
  `fundturkey.com.tr/api/DB/BindHistory*` endpoints in 2026; the crawler now
  posts JSON to `https://www.tefas.gov.tr/api/funds/...`.
- **`fetch()` signature is unchanged**, but the new backend is structured
  per-fund with a fixed look-back enum (`{1, 3, 6, 12, 36, 60}` months;
  max 5 years). When `name` is provided the call is fast and direct.
- **`fetch()` without `name` now fans out one HTTP call per fund** and is
  capped at `Crawler.fund_limit` (default `50`) with a `UserWarning`.
  Raise the cap with `Crawler(fund_limit=N)`.
- **Date columns are now real `datetime.date` objects** in the result frame
  (no more millisecond-Unix-timestamp parsing).

### Removed

- `market_cap`, `number_of_shares`, `number_of_investors` columns — the new
  API only returns the latest snapshot for these, not historical series.
- The full asset-allocation breakdown (`stock`, `government_bond`,
  `precious_metals`, ... ~50 columns) — no historical equivalent exists on
  the new backend. `BreakdownSchema` is kept as an empty stub so existing
  imports don't break, but it is no longer populated by `fetch()`.
- The OpenSSL `OP_LEGACY_SERVER_CONNECT` workaround — the new domain
  negotiates standard TLS, so the custom HTTP adapter is gone.
- The session/cookie warm-up GET — the new API is stateless.

### Added

- `Crawler(fund_limit=N)` constructor argument.
- `tefas.crawler._VALID_PERIODS` reflecting the API's enumerated look-back
  values, with `_months_back()` snapping arbitrary date ranges to the
  nearest accepted period.
- New `InfoSchema` columns: `category_rank`, `category_total` (the fund's
  rank within its category over the trailing year).

### Fixed

- `tests/test_crawler.py` no longer mutates `Crawler._do_post` at the class
  level; uses `unittest.mock.patch.object` so the mock is scoped to one
  test and doesn't pollute subsequent tests.

### Migration

```python
# Before (0.5.x):
data = tefas.fetch(start="2020-11-20")  # all funds, one call

# After (0.6.0):
data = tefas.fetch(start="2020-11-20", name="YAC")              # fast path
data = tefas.fetch(start="2020-11-20")                          # warns; capped at 50 funds
data = Crawler(fund_limit=200).fetch(start="2020-11-20")        # raise cap
```

If your code requested `market_cap`, `number_of_shares`, `number_of_investors`,
or any allocation-breakdown column, it will still run — those columns are
silently dropped from the result with a `UserWarning`.

## [0.5.0] - 2024

Previous releases. See git history.
