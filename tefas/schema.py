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
        if "TARIH" not in input_data or input_data["TARIH"] is None:
            return input_data
        try:
            tarih_value = int(input_data["TARIH"])
            if tarih_value <= 0:
                return input_data
            seconds_timestamp = tarih_value / 1000
            input_data["TARIH"] = date.fromtimestamp(seconds_timestamp).isoformat()
        except (ValueError, TypeError, OSError):
            return input_data
        return input_data

    @post_load
    def post_load_hook(self, output_data, **kwargs):
        # Fill missing fields with default None
        output_data = {f: output_data.setdefault(f) for f in self.fields}
        return output_data

    # pylint: enable=no-self-use
    # pylint: enable=unused-argument

    class Meta:
        unknown = EXCLUDE


class BreakdownSchema(Schema):
    code = fields.String(data_key="FONKODU", allow_none=True)
    date = fields.Date(data_key="TARIH", allow_none=True)
    bank_bills = fields.Float(data_key="BB", allow_none=True)  # Banka Bonosu
    exchange_traded_fund = fields.Float(data_key="BYF", allow_none=True)  # BYF Katılma Payları
    other = fields.Float(data_key="D", allow_none=True)  # Diğer
    fx_payable_bills = fields.Float(data_key="DB", allow_none=True)  # Döviz Ödemeli Bono
    government_bond = fields.Float(data_key="DT", allow_none=True)  # Devlet Tahvili
    foreign_currency_bills = fields.Float(data_key="DÖT", allow_none=True)  # Dövize Ödemeli Tahvil
    eurobonds = fields.Float(data_key="EUT", allow_none=True)  # Eurobonds
    commercial_paper = fields.Float(data_key="FB", allow_none=True)  # Finansman Bonosu
    fund_participation_certificate = fields.Float(data_key="FKB", allow_none=True)  # Fon Katılma Belgesi
    real_estate_certificate = fields.Float(data_key="GAS", allow_none=True)  # Gayrimenkul Sertifikası
    venture_capital_investment_fund_participation = fields.Float(data_key="GSYKB", allow_none=True)  # Girişim Sermayesi Yatırım Fon Katılma Payları
    real_estate_investment_fund_participation = fields.Float(data_key="GYKB", allow_none=True)  # Gayrimenkul Yatırım Fon Katılma Payları
    treasury_bill = fields.Float(data_key="HB", allow_none=True)  # Hazine Bonosu
    stock = fields.Float(data_key="HS", allow_none=True)  # Hisse Senedi
    government_bonds_and_bills_fx = fields.Float(data_key="KBA", allow_none=True)  # Kamu Dış Borçlanma Araçları
    participation_account = fields.Float(data_key="KH", allow_none=True)  # Katılma Hesabı
    participation_account_au = fields.Float(data_key="KHAU", allow_none=True)  # Katılma Hesabı Altın
    participation_account_d = fields.Float(data_key="KHD", allow_none=True)  # Katılma Hesabı Döviz
    participation_account_tl = fields.Float(data_key="KHTL", allow_none=True)  # Katılma Hesabı Türk Lirası
    government_lease_certificates = fields.Float(data_key="KKS", allow_none=True)  # Kamu Kira Sertifikaları
    government_lease_certificates_d = fields.Float(data_key="KKSD", allow_none=True)  # Kamu Kira Sertifikaları Döviz
    government_lease_certificates_tl = fields.Float(data_key="KKSTL", allow_none=True)  # Kamu Kira Sertifikaları Türk Lirası
    government_lease_certificates_foreign = fields.Float(data_key="KKSYD", allow_none=True)  # Kamu Yurt Dışı Kira Sertifikaları
    precious_metals = fields.Float(data_key="KM", allow_none=True)  # Kıymetli Madenler
    precious_metals_byf = fields.Float(data_key="KMBYF", allow_none=True)  # Kıymetli Madenler Cinsinden BYF
    precious_metals_kba = fields.Float(data_key="KMKBA", allow_none=True)  # Kıymetli Madenler Kamu B. A.
    precious_metals_kks = fields.Float(data_key="KMKKS", allow_none=True)  # Kıymetli Madenler Kamu Kira Sertifikaları
    public_domestic_debt_instruments = fields.Float(data_key="KİBD", allow_none=True)  # Döviz Kamu İç Borçlanma Araçları
    private_sector_lease_certificates = fields.Float(data_key="OSKS", allow_none=True)  # Özel Sektör Kira Sertifikaları
    private_sector_bond = fields.Float(data_key="OST", allow_none=True)  # Özel Sektör Tahvili
    repo = fields.Float(data_key="R", allow_none=True)  # Repo
    derivatives = fields.Float(data_key="T", allow_none=True)  # Türev Araçları
    tmm = fields.Float(data_key="TPP", allow_none=True)  # Takasbank Para Piyasası
    reverse_repo = fields.Float(data_key="TR", allow_none=True)  # Ters Repo
    asset_backed_securities = fields.Float(data_key="VDM", allow_none=True)  # Varlığa Dayalı Menkul Kıymetler
    term_deposit = fields.Float(data_key="VM", allow_none=True)  # Vadeli Mevduat
    term_deposit_au = fields.Float(data_key="VMAU", allow_none=True)  # Vadeli Mevduat Altın
    term_deposit_d = fields.Float(data_key="VMD", allow_none=True)  # Vadeli Mevduat Döviz
    term_deposit_tl = fields.Float(data_key="VMTL", allow_none=True)  # Vadeli Mevduat Türk Lirası
    futures_cash_collateral = fields.Float(data_key="VİNT", allow_none=True)  # Vadeli İşlemler Nakit Teminatları
    foreign_debt_instruments = fields.Float(data_key="YBA", allow_none=True)  # Yabancı Borçlanma Aracı
    foreign_domestic_debt_instruments = fields.Float(data_key="YBKB", allow_none=True)  # Yabancı Kamu Borçlanma Araçları
    foreign_private_sector_debt_instruments = fields.Float(data_key="YBOSB", allow_none=True)  # Yabancı Özel Sektör Borçlanma Araçları
    foreign_exchange_traded_funds = fields.Float(data_key="YBYF", allow_none=True)  # Yabancı Borsa Yatırım Fonları
    foreign_equity = fields.Float(data_key="YHS", allow_none=True)  # Yabancı Hisse Senedi
    foreign_securities = fields.Float(data_key="YMK", allow_none=True)  # Yabancı Menkul Kıymet
    foreign_investment_fund_participation_shares = fields.Float(data_key="YYF", allow_none=True) # Yatırım fonları katılma payları
    private_sector_international_lease_certificate = fields.Float(data_key="ÖKSYD", allow_none=True)  # Özel Sektör Yurt Dışı Kira Sertifikaları
    private_sector_foreign_debt_instruments = fields.Float(data_key="ÖSDB", allow_none=True)  # Özel Sektör Dış Borçlanma Araçları

    # pylint: disable=no-self-use
    # pylint: disable=unused-argument
    @pre_load
    def pre_load_hook(self, input_data, **kwargs):
        if "TARIH" not in input_data or input_data["TARIH"] is None:
            return input_data
        try:
            tarih_value = int(input_data["TARIH"])
            if tarih_value <= 0:
                return input_data
            seconds_timestamp = tarih_value / 1000
            input_data["TARIH"] = date.fromtimestamp(seconds_timestamp).isoformat()
        except (ValueError, TypeError, OSError):
            return input_data
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
