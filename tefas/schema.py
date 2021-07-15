""""Schema validation"""

from datetime import date

from marshmallow import Schema, fields, EXCLUDE, pre_load, post_load


class InfoSchema(Schema):
    date = fields.Date(data_key="TARIH", allow_none=True)
    price = fields.Float(data_key="FIYAT", allow_none=True)
    code = fields.String(data_key="FONKODU", allow_none=True)
    title = fields.String(data_key="FONUNVAN", allow_none=True)
    market_cap = fields.Float(data_key="PORTFOYBUYUKLUK", allow_none=True)
    number_of_shares = fields.Float(data_key="TEDPAYSAYISI", allow_none=True)
    number_of_investors = fields.Float(data_key="KISISAYISI", allow_none=True)

    # pylint: disable=no-self-use
    # pylint: disable=unused-argument
    @pre_load
    def pre_load_hook(self, input_data, **kwargs):
        # Convert milliseconds Unix timestamp to date
        seconds_timestamp = int(input_data["TARIH"]) / 1000
        input_data["TARIH"] = date.fromtimestamp(seconds_timestamp).isoformat()
        return input_data

    @post_load
    def post_load_hool(self, output_data, **kwargs):
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE


class BreakdownSchema(Schema):
    date = fields.Date(data_key="TARIH", allow_none=True)
    tmm = fields.Float(data_key="TMM (%)", allow_none=True)
    repo = fields.Float(data_key="R", allow_none=True)
    code = fields.String(data_key="FONKODU", allow_none=True)
    other = fields.Float(data_key="D", allow_none=True)
    stock = fields.Float(data_key="HS", allow_none=True)
    eurobonds = fields.Float(data_key="EUT", allow_none=True)
    bank_bills = fields.Float(data_key="BB", allow_none=True)
    derivatives = fields.Float(data_key="T", allow_none=True)
    reverse_repo = fields.Float(data_key="TR", allow_none=True)
    term_deposit = fields.Float(data_key="VM", allow_none=True)
    treasury_bill = fields.Float(data_key="HB", allow_none=True)
    foreign_equity = fields.Float(data_key="YHS", allow_none=True)
    government_bond = fields.Float(data_key="DT", allow_none=True)
    precious_metals = fields.Float(data_key="KM", allow_none=True)
    commercial_paper = fields.Float(data_key="FB", allow_none=True)
    fx_payable_bills = fields.Float(data_key="DB", allow_none=True)
    foreign_securities = fields.Float(data_key="YMK", allow_none=True)
    private_sector_bond = fields.Float(data_key="OST", allow_none=True)
    participation_account = fields.Float(data_key="KH", allow_none=True)
    foreign_currency_bills = fields.Float(data_key="DÖT", allow_none=True)
    asset_backed_securities = fields.Float(data_key="VDM", allow_none=True)
    real_estate_certificate = fields.Float(data_key="GAS", allow_none=True)
    foreign_debt_instruments = fields.Float(data_key="YBA", allow_none=True)
    government_lease_certificates = fields.Float(data_key="KKS", allow_none=True)
    fund_participation_certificate = fields.Float(data_key="FKB", allow_none=True)
    government_bonds_and_bills_fx = fields.Float(data_key="KBA", allow_none=True)
    private_sector_lease_certificates = fields.Float(data_key="OSKS", allow_none=True)

    # pylint: disable=no-self-use
    # pylint: disable=unused-argument
    @pre_load
    def pre_load_hook(self, input_data, **kwargs):
        # Convert milliseconds Unix timestamp to date
        seconds_timestamp = int(input_data["TARIH"]) / 1000
        input_data["TARIH"] = date.fromtimestamp(seconds_timestamp).isoformat()
        return input_data

    @post_load
    def post_load_hook(self, output_data, **kwargs):
        # Replace None values with 0 for float fields
        output_data = {
            k: v
            if not (isinstance(self.fields[k], fields.Float) and v is None)
            else 0.0
            for k, v in output_data.items()
        }
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE
