"""Schema for the new tefas.gov.tr JSON API.

The legacy ASP.NET endpoints (BindHistoryInfo, BindHistoryAllocation) were
retired. The new SPA backend exposes per-fund daily prices only — historical
asset-allocation breakdowns and AUM/investor counts are no longer published
through any public endpoint we can reach. Schemas reflect what's available.
"""

from datetime import datetime

from marshmallow import EXCLUDE, Schema, fields, post_load, pre_load


class InfoSchema(Schema):
    date = fields.Date(data_key="tarih", allow_none=True)
    code = fields.String(data_key="fonKodu", allow_none=True)
    title = fields.String(data_key="fonUnvan", allow_none=True)
    price = fields.Float(data_key="fiyat", allow_none=True)
    category_rank = fields.Integer(data_key="kategoriDerece", allow_none=True)
    category_total = fields.Integer(data_key="kategoriFonSay", allow_none=True)

    # pylint: disable=no-self-use,unused-argument
    @pre_load
    def pre_load_hook(self, input_data, **kwargs):
        raw = input_data.get("tarih")
        if isinstance(raw, str):
            input_data["tarih"] = datetime.strptime(raw, "%Y-%m-%d").date().isoformat()
        return input_data

    @post_load
    def post_load_hook(self, output_data, **kwargs):
        return {f: output_data.setdefault(f) for f in self.fields}

    class Meta:
        unknown = EXCLUDE


class BreakdownSchema(Schema):
    """Deprecated. Historical asset-allocation breakdowns are no longer exposed
    by tefas.gov.tr. Kept as an empty schema so existing imports don't break.
    """

    class Meta:
        unknown = EXCLUDE
