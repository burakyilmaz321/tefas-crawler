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
    date = fields.Date(data_key="Tarih", allow_none=True)
    tmm = fields.Float(data_key="TMM (%)", allow_none=True)
    repo = fields.Float(data_key="Repo (%)", allow_none=True)
    code = fields.String(data_key="Fon Kodu", allow_none=True)
    other = fields.Float(data_key="Other (%)", allow_none=True)
    stock = fields.Float(data_key="Stock (%)", allow_none=True)
    eurobonds = fields.Float(data_key="Eurobonds (%)", allow_none=True)
    bank_bills = fields.Float(data_key="Bank Bills (%)", allow_none=True)
    derivatives = fields.Float(data_key="Derivatives (%)", allow_none=True)
    reverse_repo = fields.Float(data_key="Reverse-Repo (%)", allow_none=True)
    term_deposit = fields.Float(data_key="Term Deposit (%)", allow_none=True)
    treasury_bill = fields.Float(data_key="Treasury Bill (%)", allow_none=True)
    foreign_equity = fields.Float(data_key="Foreign Equity (%)", allow_none=True)
    government_bond = fields.Float(data_key="Government Bond (%)", allow_none=True)
    precious_metals = fields.Float(data_key="Precious Metals (%)", allow_none=True)
    commercial_paper = fields.Float(data_key="Commercial Paper (%)", allow_none=True)
    fx_payable_bills = fields.Float(data_key="FX Payable Bills (%)", allow_none=True)
    foreign_securities = fields.Float(
        data_key="Foreign Securities (%)", allow_none=True
    )
    private_sector_bond = fields.Float(
        data_key="Private Sector Bond (%)", allow_none=True
    )
    participation_account = fields.Float(
        data_key="Participation Account (%)", allow_none=True
    )
    foreign_currency_bills = fields.Float(
        data_key="Foreign Currency Bills (%)", allow_none=True
    )
    asset_backed_securities = fields.Float(
        data_key="Asset-Backed Securities (%)", allow_none=True
    )
    real_estate_certificate = fields.Float(
        data_key="Real Estate Certificate (%)", allow_none=True
    )
    foreign_debt_instruments = fields.Float(
        data_key="Foreign Debt Instruments (%)", allow_none=True
    )
    government_lease_certificates = fields.Float(
        data_key="Government Lease Certificates (%)", allow_none=True
    )
    fund_participation_certificate = fields.Float(
        data_key="Fund Participation Certificate (%)", allow_none=True
    )
    government_bonds_and_bills_fx = fields.Float(
        data_key="Government Bonds and Bills (FX) (%)", allow_none=True
    )
    private_sector_lease_certificates = fields.Float(
        data_key="Private Sector Lease Certificates (%)", allow_none=True
    )

    # pylint: disable=no-self-use
    # pylint: disable=unused-argument
    @pre_load
    def pre_load_hook(self, input_data, **kwargs):
        # Convert milliseconds Unix timestamp to date
        seconds_timestamp = int(input_data["Tarih"]) / 1000
        input_data["Tarih"] = date.fromtimestamp(seconds_timestamp).isoformat()
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
