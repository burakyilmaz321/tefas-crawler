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
    contribution_shares = fields.Float(data_key="BYF", allow_none=True)
    venture_capital_mutual_fund_participation_shares = fields.Float(data_key="GSYKB", allow_none=True)
    real_estate_investment_fund_participation_shares = fields.Float(data_key="GYKB", allow_none=True)
    participation_account_currency = fields.Float(data_key="KHD", allow_none=True)
    participation_account_turk_lira = fields.Float(data_key="KHTL", allow_none=True)
    public_lease_certificate_currency = fields.Float(data_key="KKSD", allow_none=True)
    public_lease_certificate_turk_lira = fields.Float(data_key="KKSTL", allow_none=True)
    public_lease_certificate_abroad = fields.Float(data_key="KKSYD", allow_none=True)
    precious_metals_BYF = fields.Float(data_key="KMBYF", allow_none=True)
    precious_metals_public_lease_certificate = fields.Float(data_key="KMKKS", allow_none=True)
    Precious_metals_dept_instruments = fields.Float(data_key="KMKBA", allow_none=True)
    exchange_money_market = fields.Float(data_key="TPP", allow_none=True)
    term_deposit_dollar = fields.Float(data_key="VMD", allow_none=True)
    term_deposit_turk_lira = fields.Float(data_key="VMTL", allow_none=True)
    term_deposit_gold = fields.Float(data_key="VMAU", allow_none=True)
    futures_cash_collateral = fields.Float(data_key="VİNT", allow_none=True)
    foreign_exchange_traded_funds = fields.Float(data_key="YBYF", allow_none=True)
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


class ComparisonFundReturnSchema(Schema):
    code = fields.String(data_key="FONKODU", allow_none=True)
    title = fields.String(data_key="FONUNVAN", allow_none=True)

    fon_type = fields.String(data_key="FONTURACIKLAMA", allow_none=True)
    return_1a = fields.Float(data_key="GETIRI1A", allow_none=True)
    return_3a = fields.Float(data_key="GETIRI3A", allow_none=True)
    return_6a = fields.Float(data_key="GETIRI6A", allow_none=True)
    return_1y = fields.Float(data_key="GETIRI1Y", allow_none=True)
    return_yb = fields.Float(data_key="GETIRIYB", allow_none=True)
    return_3y = fields.Float(data_key="GETIRI3Y", allow_none=True)
    return_5y = fields.Float(data_key="GETIRI5Y", allow_none=True)

    @post_load
    def post_load_hool(self, output_data, **kwargs):
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE


class ComparisonManagementFeedsSchema(Schema):
    code = fields.String(data_key="FONKODU", allow_none=True)
    title = fields.String(data_key="FONUNVAN", allow_none=True)

    founder_code = fields.String(data_key="KURUCUKODU", allow_none=True)
    fon_type_code = fields.Float(data_key="FONTURKOD", allow_none=True)
    fund_type_explanation = fields.String(data_key="FONTURACIKLAMA", allow_none=True)
    sub_title_1 = fields.String(data_key="ALTBASLIK1", allow_none=True)
    applied_management_fee_annual = fields.String(data_key="UYGULANANYU1Y", allow_none=True)
    sub_title_2 = fields.String(data_key="ALTBASLIK2", allow_none=True)
    management_fee_specified_fund_rules_annual = fields.String(data_key="FONICTUZUKYU1G", allow_none=True)
    annual_net_rate_of_return = fields.Float(data_key="YILLIKGETIRI", allow_none=True)
    sub_title_3 = fields.String(data_key="ALTBASLIK3", allow_none=True)
    annual_maximum_fund_total_expense_ratio = fields.String(data_key="FONTOPGIDERKESORAN", allow_none=True)

    @post_load
    def post_load_hool(self, output_data, **kwargs):
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE


class ComparisonFundSizesSchema(Schema):
    code = fields.String(data_key="FONKODU", allow_none=True)
    title = fields.String(data_key="FONUNVAN", allow_none=True)

    founder_code = fields.String(data_key="KURUCUKODU", allow_none=True)
    fund_type = fields.String(data_key="FONTIPI", allow_none=True)
    fon_type_code = fields.Float(data_key="FONTURKOD", allow_none=True)
    fund_type_explanation = fields.String(data_key="FONTURACIKLAMA", allow_none=True)
    first_portfolio_value = fields.Float(data_key="ILKPORTFOYDEGERI", allow_none=True)
    last_portfolio_value = fields.Float(data_key="SONPORTFOYDEGERI", allow_none=True)
    portfolio_size_change = fields.Float(data_key="PORTBUYUKLUKDEGISIM", allow_none=True)
    numb_of_first_shares = fields.Float(data_key="ILKPAYADEDI", allow_none=True)
    numb_of_last_shares = fields.Float(data_key="SONPAYADEDI", allow_none=True)
    change_payment = fields.Float(data_key="PAYADETDEGISIM", allow_none=True)
    clear_rate_of_return = fields.Float(data_key="NETGETIRIORANI", allow_none=True)

    @post_load
    def post_load_hool(self, output_data, **kwargs):
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE
