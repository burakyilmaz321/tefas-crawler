import { useState, useEffect } from 'react';
import { FundKind, FundSummary } from '../types';
import { fetchFunds, fetchFundDetails } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatTry, formatTry6 } from '../utils/format';

interface ExportPageProps {
    fundKind: FundKind;
}

const numberFormatter = new Intl.NumberFormat('tr-TR');
const formatTryOrEmpty = (value: number | null | undefined) => (
    value === null || value === undefined || Number.isNaN(value) ? '' : formatTry(value)
);
const formatTry6OrEmpty = (value: number | null | undefined) => (
    value === null || value === undefined || Number.isNaN(value) ? '' : formatTry6(value)
);
const formatCountOrEmpty = (value: number | null | undefined) => (
    value === null || value === undefined || Number.isNaN(value) ? '' : numberFormatter.format(value)
);

const ExportPage = ({ fundKind: initialFundKind }: ExportPageProps) => {
    const [fundKind, setFundKind] = useState<FundKind>(initialFundKind);
    const [allFunds, setAllFunds] = useState<FundSummary[]>([]);
    const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
    const [fromDate, setFromDate] = useState('01/01/2024');
    const [toDate, setToDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['fund_type', 'date', 'price', 'investor_count', 'market_cap']);
    const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [tefasFilter, setTefasFilter] = useState<'all' | 'tefas_only' | 'non_tefas'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const tefasFilterOptions = [
        { label: 'Tümü', value: 'all' as const },
        { label: 'Sadece TEFAS\'ta İşlem Görenler', value: 'tefas_only' as const },
        { label: 'Sadece TEFAS Dışı', value: 'non_tefas' as const },
    ];

    // Funds that are NOT available on TEFAS
    const unavailableFunds = new Set([
        'ABU', 'ALE', 'ANL', 'AVT', 'AZF', 'ECB', 'ECV', 'FI5', 'FYT', 'GAL', 'GTL', 'GYL', 'HKV', 'HLL', 'HPV', 'IBD', 'IBK', 'IGL', 'INH', 'IOP', 'OGF', 'OTF', 'OYL', 'PAI', 'SKT', 'SLF', 'TAO', 'TBP', 'TGT', 'TI1', 'TIV', 'TKK', 'TKM', 'TNI', 'TNK', 'TPE', 'TPO', 'TPR', 'TSI', 'TZC', 'TZL', 'TZV', 'VK6', 'VKT', 'YAR', 'YBP', 'YDK', 'YLB', 'YOA', 'ZAY', 'ZPK', 'BRG', 'YHP', 'GUE', 'GUA', 'GTK', 'FFD', 'IUZ', 'YIV', 'YVD', 'CVF', 'CVE', 'IPA', 'ARF', 'AIG', 'PYF', 'TTN', 'OFB', 'PYH', 'PYL', 'IYP', 'FBN', 'HMT', 'GFL', 'YCL', 'TZP', 'PPD', 'GZB', 'IDP', 'YCS', 'IZV', 'LHM', 'LHP', 'ITJ', 'MAS', 'GJH', 'YPZ', 'MLS', 'DRS', 'THG', 'OUR', 'TNH', 'TNS', 'YJA', 'HPI', 'HPZ', 'YJO', 'KJK', 'CJD', 'CJG', 'HJA', 'GJE', 'MJH', 'CJF', 'OPZ', 'GJO', 'ZJR', 'ZJT', 'GJF', 'ZPJ', 'FJM', 'OJA', 'TJL', 'OJF', 'YJU', 'EJG', 'IJF', 'GJM', 'ZJH', 'IJK', 'GPH', 'GPV', 'SJP', 'IJE', 'PUA', 'BJO', 'DZG', 'OJU', 'RSF', 'GJA', 'GJD', 'TJB', 'GLP', 'GZO', 'TNP', 'NKJ', 'DKD', 'IJS', 'MJK', 'FJC', 'GAU', 'OJY', 'ILJ', 'NJG', 'GNK', 'GAV', 'GAJ', 'GAC', 'HLR', 'HPL', 'ZLG', 'IZE', 'FJN', 'OZF', 'IZZ', 'GMV', 'GMJ', 'GMG', 'OJH', 'ZPN', 'DTV', 'YDZ', 'NRM', 'LFD', 'DTR', 'CJH', 'IOV', 'OVF', 'KSG', 'NIG', 'ZZL', 'UGL', 'UGH', 'DNL', 'IGZ', 'OLC', 'IGM', 'IGF', 'HVL', 'GFB', 'GZU', 'DVZ', 'UAB', 'HGC', 'LZV', 'PTC', 'DOR', 'HFV', 'HVA', 'IJL', 'HDJ', 'ULL', 'GVL', 'YYO', 'OJN', 'HVB', 'DCV', 'ZBN', 'ZBZ', 'KKB', 'GCA', 'IRL', 'OUY', 'GFD', 'YCG', 'ITV', 'KHU', 'IUM', 'DOA', 'GCI', 'IUN', 'FUM', 'GCZ', 'DOD', 'IZL', 'HUI', 'GCD', 'OCT', 'ZCV', 'OZC', 'DOI', 'YTJ', 'ARP', 'IBG', 'AZV', 'DBG', 'IBR', 'DDS', 'OSH', 'FYM', 'ABS', 'APP', 'IPR', 'IAF', 'IPU', 'FYA', 'IIP', 'FYF', 'OYT', 'IPC', 'IPF', 'ISS', 'IPK', 'IPO', 'IPP', 'ACZ', 'AVC', 'IYR', 'IPE', 'IAS', 'ACN', 'AIR', 'AHH', 'AHZ', 'ICG', 'AIH', 'AII', 'AIM', 'AJE', 'AJN', 'ATJ', 'AVZ', 'AZJ', 'CEY', 'DAI', 'DAT', 'DDC', 'DPC', 'DPE', 'DPG', 'DPL', 'DPN', 'DPP', 'DPR', 'DPZ', 'FRA', 'FRZ', 'FUP', 'FVS', 'FYB', 'IIS', 'FYE', 'FYG', 'IMH', 'FYH', 'IMO', 'GAN', 'IMS', 'IMT', 'GME', 'IMY', 'GSE', 'IMZ', 'GSG', 'GSO', 'HDH', 'HDS', 'ISR', 'HPF', 'IAR', 'KOP', 'IBC', 'IBE', 'DDE', 'KSD', 'KSY', 'UPS', 'YMM', 'KTE', 'KTU', 'MPD', 'YPP', 'YRF', 'OSF', 'YRO', 'YSF', 'PLS', 'PUD', 'PUR', 'SBS', 'SPA', 'SPD', 'SPG', 'SRO', 'SRY', 'SSO', 'STS', 'STZ', 'TCS', 'TDP', 'PPF', 'AJL', 'TSP', 'PBB', 'GMP', 'FFO', 'TIP', 'PUT', 'DCP', 'DNO', 'FPR', 'PRF', 'FDO', 'GGD', 'GGA', 'GGP', 'DAZ', 'GDP', 'GKK', 'PAP', 'TZH', 'DOS', 'TTP', 'TTS', 'UZY', 'TCI', 'DPI', 'GGM', 'HPC', 'OYS', 'HVV', 'HYY', 'IUU', 'YZF', 'GGR', 'GGN', 'HAG', 'OPP', 'HMK', 'TRR', 'GFY', 'GKL', 'HII', 'GEI', 'UAP', 'PSS', 'DDP', 'PBS', 'DSC', 'GZD', 'CTM', 'HNN', 'CTG', 'CTF', 'TTV', 'IFY', 'CTP', 'CTV', 'GMZ', 'TMR', 'GGL', 'KFK', 'GGC', 'KPK', 'ZVB', 'PSG', 'HYK', 'KPB', 'BVB', 'CVA', 'CVD', 'DHS', 'DKV', 'DVA', 'DVC', 'DVI', 'DVN', 'DVO', 'DVU', 'DYJ', 'FDZ', 'FVL', 'FYJ', 'FYV', 'FYZ', 'GBP', 'GEC', 'GFA', 'GFE', 'GFK', 'GFN', 'GFO', 'GFT', 'GLV', 'GVB', 'GVC', 'GVD', 'GVZ', 'GYC', 'GYG', 'GYR', 'HBV', 'HGT', 'HMV', 'HPJ', 'HVC', 'HVN', 'HZV', 'IAC', 'IAI', 'IBP', 'ICK', 'ICU', 'IDV', 'IEZ', 'ILM', 'ILR', 'INV', 'INZ', 'IUA', 'IUB', 'IUC', 'KAC', 'KNC', 'KNP', 'KNS', 'KNT', 'KNV', 'KNZ', 'NKK', 'NTB', 'NTC', 'NTO', 'NYH', 'OAB', 'OAV', 'OCM', 'OCN', 'OFH', 'OFO', 'OGV', 'OKF', 'OMC', 'OME', 'OTE', 'OTS', 'OUB', 'OVR', 'OVT', 'PRZ', 'PTG', 'PUZ', 'RCS', 'RPE', 'RPK', 'RPN', 'RPO', 'SFA', 'TBZ', 'TCG', 'TGV', 'TGZ', 'TIT', 'TLT', 'TMV', 'TRN', 'TTZ', 'URG', 'UYH', 'VCD', 'VCG', 'YNL', 'YON', 'YPD', 'YQA', 'YTR', 'YUD', 'YUI', 'YUY', 'YVF', 'YVO', 'YVS', 'ZCB', 'ZCC', 'ZCE', 'ZCF', 'ZCG', 'ZCH', 'ZFH', 'ZFZ', 'ZSA', 'ZSB', 'ZTF', 'ZUD', 'ZUE', 'ZYC', 'ZYD', 'BVY', 'IHN', 'IVS', 'NHV', 'BVC', 'BVT', 'DKS', 'DUT', 'FSE', 'GLM', 'GYN', 'IFG', 'IHE', 'IOL', 'IRA', 'IUS', 'OTZ', 'ROD', 'RZR', 'URC', 'YZL', 'ZCA', 'ABJ', 'BBI', 'DAL', 'DCD', 'DP1', 'FFF', 'HGH', 'IOJ', 'ITD', 'ITL', 'ITR', 'OAC', 'OIS', 'RCL', 'SBI', 'TP1', 'UFH', 'UHL', 'YP2', 'ZP2', 'AC2', 'ZP1', 'HTZ', 'BGI', 'GP1', 'IBJ', 'IV2', 'FHZ', 'AC7', 'AC8', 'DMV', 'DP2', 'CVB', 'THH', 'YP1', 'ZR2', 'ZR3', 'AC3', 'NVP', 'HAE', 'HME', 'HNS', 'ZP7', 'IV6', 'IV7', 'DP3', 'KLM', 'THS', 'AP2', 'HGU', 'NSS', 'SHS', 'BUP', 'IHY', 'KMS', 'TB9', 'IIC', 'NTF', 'PHS', 'AL4', 'IJI', 'ZKK', 'ZDK', 'OMB', 'TKH', 'ILH', 'THO', 'HKP', 'OBR', 'HIS', 'ICN', 'ZP3', 'LRT', 'NKL', 'DLG', 'ONL', 'IDB', 'SSE', 'LGO', 'FDY', 'ONT', 'DMR', 'EES', 'MKL', 'UCN', 'KKT', 'VKI', 'RTI', 'T3B', 'RUH', 'NTS', 'DKA', 'FS3', 'HSP', 'IBM', 'SYL', 'YPT', 'NP1', 'SER', 'RDH', 'FDE', 'FS1', 'YCH', 'KKP', 'YUK', 'IOM', 'KMA', 'HBM', 'GCC', 'ZP4', 'ZP5', 'AL6', 'DP4', 'DP6', 'GPM', 'PCN', 'FP1', 'ITA', 'PYS', 'INR', 'ZNF', 'ZSN', 'KLL', 'DP7', 'FTY', 'FDV', 'IZM', 'AL7', 'KOZ', 'TNF', 'DP8', 'DP5', 'NHT', 'NFK', 'VTF', 'OFK', 'KDK', 'RDS', 'EPO', 'RBE', 'OPU', 'BSE', 'CSD', 'CSH', 'DP9', 'IIA', 'URS', 'RAY', 'RAF', 'UST', 'URV', 'HFA', 'NOV', 'BAO', 'EHS', 'ILC', 'NDI', 'NDL', 'FKH', 'ILE', 'ILI', 'KDS', 'DMZ', 'TOK', 'NKS', 'IFD', 'THP', 'MJE', 'ION', 'LCT', 'BUT', 'RYF', 'USS', 'ILP', 'MSK', 'PAC', 'HPU', 'RPU', 'FNE', 'DK8', 'ORS', 'TLU', 'DNA', 'SMP', 'BGH', 'DFO', 'FKM', 'KMT', 'OFA', 'RKL', 'IOS', 'FMS', 'SVS', 'VFS', 'FHP', 'KKE', 'RDK', 'ROB', 'TFE', 'BVI', 'BDI', 'DRH', 'GDJ', 'GEZ', 'MGE', 'RYA', 'IZY', 'MPI', 'RMA', 'SRA', 'VOF', 'BHH', 'CAF', 'MOD', 'HUS', 'MSO', 'TAZ', 'IUR', 'FTM', 'IVA', 'RTA', 'CBN', 'PBF', 'IZA', 'MAV', 'IOH', 'FS2', 'HOM', 'KYR', 'TMP', 'CVC', 'KRV', 'ORI', 'RSZ', 'LET', 'YLR', 'DSG', 'MSL', 'BHE', 'DSH', 'OBN', 'ODN', 'OUN', 'ZSK', 'YDL', 'SSN', 'YBJ', 'EGP', 'ITZ', 'GNL', 'GSR', 'IRE', 'KRO', 'DZP', 'GPJ', 'AP6', 'BLE', 'MFT', 'BCC', 'CGD', 'KDZ', 'BAC', 'KBJ', 'RHD', 'MSR', 'PNR', 'FS4', 'DHI', 'RTB', 'BLG', 'FKV', 'KDI', 'KFZ', 'OHI', 'BTY', 'JOT', 'RAN', 'SSD', 'AS3', 'ONB', 'TNB', 'FSV', 'KSL', 'KSM', 'YRB', 'RVS', 'TVR', 'ROY', 'TCN', 'DRD', 'NES', 'DKP', 'NMG', 'TCH', 'PBE', 'PBH', 'PCS', 'PHN', 'PKL', 'GKE', 'HDE', 'SBR', 'DOC', 'GKO', 'ROS', 'BIA', 'BTP', 'BVH', 'BRZ', 'KUP', 'LAI', 'POD', 'EKI', 'PAU', 'OPJ', 'DLN', 'HDV', 'TMS', 'FSM', 'MTL', 'PDE', 'NFH', 'GNP', 'GNZ', 'TGN', 'YPU', 'GOF'
    ]);

    const fundKinds = [
        { label: 'Yatırım Fonları (YAT)', value: 'YAT' as FundKind },
        { label: 'Emeklilik Fonları (EMK)', value: 'EMK' as FundKind },
        { label: 'Borsa Yatırım Fonları (BYF)', value: 'BYF' as FundKind },
    ];

    const columns = [
        { id: 'fund_type', label: 'Fon Türü' },
        { id: 'date', label: 'Tarih' },
        { id: 'price', label: 'Fiyat' },
        { id: 'investor_count', label: 'Yatırımcı Sayısı' },
        { id: 'market_cap', label: 'Portföy Büyüklüğü' },
    ];

    useEffect(() => {
        loadFunds();
    }, [fundKind, showOnlyAvailable]);

    const loadFunds = async () => {
        try {
            const funds = await fetchFunds(fundKind);
            const filteredFunds = showOnlyAvailable
                ? funds.filter(f => !unavailableFunds.has(f.code))
                : funds;
            setAllFunds(filteredFunds);
            setSelectedFunds(filteredFunds.map(f => f.code)); // Select all by default
        } catch (err) {
            setError('Fonlar yüklenemedi');
        }
    };

    // Filter funds based on TEFAS availability (only for YAT) and search query
    const getFilteredFunds = () => {
        let funds = allFunds;

        // Apply TEFAS filter (only for YAT)
        if (fundKind === 'YAT' && tefasFilter !== 'all') {
            funds = funds.filter(fund => {
                if (tefasFilter === 'tefas_only') {
                    return fund.isTefasAvailable === true;
                }
                return fund.isTefasAvailable === false;
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            funds = funds.filter(fund =>
                fund.code.toLowerCase().includes(query) ||
                fund.title.toLowerCase().includes(query)
            );
        }

        return funds;
    };

    const filteredFunds = getFilteredFunds();

    // Count funds after TEFAS filter but before search (for display)
    const tefasFilteredCount = fundKind === 'YAT' && tefasFilter !== 'all'
        ? allFunds.filter(fund => tefasFilter === 'tefas_only' ? fund.isTefasAvailable === true : fund.isTefasAvailable === false).length
        : allFunds.length;

    const toggleSelectAll = () => {
        const filteredCodes = filteredFunds.map(f => f.code);
        const allFilteredSelected = filteredCodes.every(code => selectedFunds.includes(code));

        if (allFilteredSelected) {
            // Deselect all filtered funds
            setSelectedFunds(prev => prev.filter(code => !filteredCodes.includes(code)));
        } else {
            // Select all filtered funds (add to existing selection)
            setSelectedFunds(prev => [...new Set([...prev, ...filteredCodes])]);
        }
    };

    const toggleFund = (code: string) => {
        setSelectedFunds(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const toggleColumn = (columnId: string) => {
        setSelectedColumns(prev =>
            prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]
        );
    };

    const parseDateDDMMYYYY = (dateStr: string): Date | null => {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    };

    const validateDates = (): boolean => {
        const from = parseDateDDMMYYYY(fromDate);
        const to = parseDateDDMMYYYY(toDate);

        if (!from || !to) {
            setError('Geçersiz tarih formatı. GG/AA/YYYY kullanın');
            return false;
        }

        if (from > to) {
            setError('Başlangıç tarihi bitiş tarihinden önce olmalı');
            return false;
        }

        const diffYears = (to.getTime() - from.getTime()) / (365 * 24 * 60 * 60 * 1000);
        if (diffYears > 5) {
            setError('Tarih aralığı 5 yılı geçemez');
            return false;
        }

        return true;
    };

    const calculateDays = (): number => {
        const from = parseDateDDMMYYYY(fromDate)!;
        const to = parseDateDDMMYYYY(toDate)!;
        return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
    };

    const exportData = async () => {
        if (selectedFunds.length === 0) {
            setError('Lütfen en az bir fon seçin');
            return;
        }

        if (selectedColumns.length === 0) {
            setError('Lütfen en az bir sütun seçin');
            return;
        }

        if (!validateDates()) return;

        setIsExporting(true);
        setError(null);
        setProgress(0);

        try {
            const days = calculateDays();
            const fundsData = [];
            const failedFunds: string[] = [];

            for (let i = 0; i < selectedFunds.length; i++) {
                const code = selectedFunds[i];
                const fundSummary = allFunds.find(f => f.code === code);
                if (!fundSummary) continue;

                setProgress(((i + 1) / selectedFunds.length) * 100);

                try {
                    const fundDetails = await fetchFundDetails(code, fundKind, days);
                    fundsData.push({
                        code,
                        title: fundDetails.title || fundSummary.title,
                        details: fundDetails
                    });
                } catch (err) {
                    console.error(`Failed to fetch ${code}:`, err);
                    failedFunds.push(code);
                    // Continue with remaining funds
                }
            }

            if (fundsData.length === 0) {
                setError('Hiçbir fon verisi alınamadı. Lütfen daha sonra tekrar deneyin.');
                return;
            }

            // Generate export based on format
            if (format === 'csv') {
                exportCSV(fundsData);
            } else if (format === 'excel') {
                exportExcel(fundsData);
            } else {
                exportPDF(fundsData);
            }

            setProgress(100);

            if (failedFunds.length > 0) {
                setError(`Dışa aktarma tamamlandı, ancak ${failedFunds.length} fon yüklenemedi: ${failedFunds.slice(0, 5).join(', ')}${failedFunds.length > 5 ? '...' : ''}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setProgress(0);
            }, 1000);
        }
    };

    const exportCSV = (fundsData: any[]) => {
        let csv = 'Fund Code,Fund Name';
        if (selectedColumns.includes('fund_type')) csv += ',Fund Type';
        if (selectedColumns.includes('date')) csv += ',Date';
        if (selectedColumns.includes('price')) csv += ',Price';
        if (selectedColumns.includes('investor_count')) csv += ',Investor Count';
        if (selectedColumns.includes('market_cap')) csv += ',Market Cap';
        csv += '\n';

        fundsData.forEach(({ code, title, details }) => {
            const history = details.priceHistory || details.investorHistory || details.marketCapHistory;

            history?.forEach((point: any) => {
                csv += `${code},"${title}"`;
                if (selectedColumns.includes('fund_type')) csv += `,${fundKind}`;
                if (selectedColumns.includes('date')) csv += `,${point.date}`;
                if (selectedColumns.includes('price')) {
                    const priceValue = formatTry6OrEmpty(details.priceHistory.find((p: any) => p.date === point.date)?.value);
                    csv += priceValue ? `,"${priceValue}"` : ',';
                }
                if (selectedColumns.includes('investor_count')) {
                    const countValue = formatCountOrEmpty(details.investorHistory.find((p: any) => p.date === point.date)?.value);
                    csv += countValue ? `,"${countValue}"` : ',';
                }
                if (selectedColumns.includes('market_cap')) {
                    const capValue = formatTryOrEmpty(details.marketCapHistory.find((p: any) => p.date === point.date)?.value);
                    csv += capValue ? `,"${capValue}"` : ',';
                }
                csv += '\n';
            });
        });

        downloadFile(csv, `tefas_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    };

    const exportExcel = (fundsData: any[]) => {
        const rows: any[] = [];

        fundsData.forEach(({ code, title, details }) => {
            const maxLength = Math.max(
                details.priceHistory?.length || 0,
                details.investorHistory?.length || 0,
                details.marketCapHistory?.length || 0
            );

            for (let i = 0; i < maxLength; i++) {
                const row: any = {
                    'Fund Code': code,
                    'Fund Name': title
                };

                if (selectedColumns.includes('fund_type')) row['Fund Type'] = fundKind;
                if (selectedColumns.includes('date')) row['Date'] = details.priceHistory?.[i]?.date || details.investorHistory?.[i]?.date || details.marketCapHistory?.[i]?.date || '';
                if (selectedColumns.includes('price')) row['Price'] = formatTry6OrEmpty(details.priceHistory?.[i]?.value);
                if (selectedColumns.includes('investor_count')) row['Investor Count'] = formatCountOrEmpty(details.investorHistory?.[i]?.value);
                if (selectedColumns.includes('market_cap')) row['Market Cap'] = formatTryOrEmpty(details.marketCapHistory?.[i]?.value);

                rows.push(row);
            }
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'TEFAS Data');
        XLSX.writeFile(wb, `tefas_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportPDF = (fundsData: any[]) => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('TEFAS Fund Export', 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Range: ${fromDate} - ${toDate}`, 14, 22);

        let startY = 30;

        fundsData.forEach(({ code, title, details }) => {
            if (startY > 250) {
                doc.addPage();
                startY = 20;
            }

            doc.setFontSize(12);
            doc.text(`${code} - ${title}`, 14, startY);
            startY += 7;

            const headers = [];
            if (selectedColumns.includes('fund_type')) headers.push('Type');
            if (selectedColumns.includes('date')) headers.push('Date');
            if (selectedColumns.includes('price')) headers.push('Price');
            if (selectedColumns.includes('investor_count')) headers.push('Investors');
            if (selectedColumns.includes('market_cap')) headers.push('Market Cap');

            const rows: any[] = [];
            const maxLength = Math.max(
                details.priceHistory?.length || 0,
                details.investorHistory?.length || 0,
                details.marketCapHistory?.length || 0
            );

            for (let i = 0; i < Math.min(maxLength, 50); i++) { // Limit to 50 rows per fund for PDF
                const row = [];
                if (selectedColumns.includes('fund_type')) row.push(fundKind);
                if (selectedColumns.includes('date')) row.push(details.priceHistory?.[i]?.date || '');
                if (selectedColumns.includes('price')) row.push(formatTry6OrEmpty(details.priceHistory?.[i]?.value));
                if (selectedColumns.includes('investor_count')) row.push(formatCountOrEmpty(details.investorHistory?.[i]?.value));
                if (selectedColumns.includes('market_cap')) row.push(formatTryOrEmpty(details.marketCapHistory?.[i]?.value));
                rows.push(row);
            }

            autoTable(doc, {
                startY,
                head: [headers],
                body: rows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] }
            });

            startY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save(`tefas_export_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="export-container">
            <h2 className="section-title">Fon Verilerini Dışa Aktar</h2>

            {error && (
                <div className="error-banner">{error}</div>
            )}

            {/* Fund Type Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Fon Türü</h3>
                <div className="chip-group">
                    {fundKinds.map(kind => (
                        <button
                            key={kind.value}
                            className={`chip ${fundKind === kind.value ? 'active' : ''}`}
                            onClick={() => setFundKind(kind.value)}
                        >
                            {kind.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TEFAS Availability Filter */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">TEFAS Kullanılabilirlik Filtresi</h3>
                <div className="chip-group">
                    <button
                        className={`chip ${showOnlyAvailable ? 'active' : ''}`}
                        onClick={() => setShowOnlyAvailable(true)}
                    >
                        Sadece TEFAS'ta Mevcut Fonlar ({allFunds.length} fon)
                    </button>
                    <button
                        className={`chip ${!showOnlyAvailable ? 'active' : ''}`}
                        onClick={() => setShowOnlyAvailable(false)}
                    >
                        Tüm Fonlar (Kullanılamayan Dahil)
                    </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 8 }}>
                    {showOnlyAvailable
                        ? `✅ Yalnızca TEFAS üzerinden veri alınabilen fonlar gösteriliyor`
                        : `⚠️ Bazı fonlar TEFAS'ta mevcut değil ve veri alınamayabilir`
                    }
                </p>
            </div>

            {/* Fund Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Fon Seçimi</h3>
                <div style={{ marginBottom: 12 }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Fon kodu veya ismi ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 12, width: '100%', maxWidth: 400 }}
                    />
                </div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filteredFunds.length > 0 && filteredFunds.every(f => selectedFunds.includes(f.code))}
                            onChange={toggleSelectAll}
                        />
                        <span style={{ marginLeft: 8, fontWeight: 600 }}>Tümünü Seç ({filteredFunds.length} fon)</span>
                    </label>
                    {searchQuery && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                            Arama sonucu: {filteredFunds.length} fon
                        </span>
                    )}
                </div>
                <div className="fund-selection-grid">
                    {filteredFunds.map(fund => (
                        <label key={fund.code} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedFunds.includes(fund.code)}
                                onChange={() => toggleFund(fund.code)}
                            />
                            <span style={{ marginLeft: 8 }}>{fund.code} - {fund.title}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Tarih Aralığı (Maks 5 yıl)</h3>
                <div className="date-range-inputs">
                    <div>
                        <label className="input-label">Başlangıç (GG/AA/YYYY)</label>
                        <input
                            type="text"
                            className="input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            placeholder="01/01/2024"
                        />
                    </div>
                    <div>
                        <label className="input-label">Bitiş (GG/AA/YYYY)</label>
                        <input
                            type="text"
                            className="input"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            placeholder="25/12/2025"
                        />
                    </div>
                </div>
            </div>

            {/* Column Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Sütun Seçimi</h3>
                <div className="column-selection">
                    {columns.map(col => (
                        <label key={col.id} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedColumns.includes(col.id)}
                                onChange={() => toggleColumn(col.id)}
                            />
                            <span style={{ marginLeft: 8 }}>{col.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Dışa Aktarma Formatı</h3>
                <div className="format-selection">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'csv'}
                            onChange={() => setFormat('csv')}
                        />
                        <span style={{ marginLeft: 8 }}>CSV (Büyük veri setleri için önerilir)</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'excel'}
                            onChange={() => setFormat('excel')}
                        />
                        <span style={{ marginLeft: 8 }}>Excel (.xlsx)</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'pdf'}
                            onChange={() => setFormat('pdf')}
                        />
                        <span style={{ marginLeft: 8 }}>PDF (Fon başına maks 50 satır)</span>
                    </label>
                </div>
            </div>

            {/* Export Button */}
            <button
                className="export-button"
                onClick={exportData}
                disabled={isExporting}
            >
                {isExporting ? `Dışa aktarılıyor... ${Math.round(progress)}%` : 'Verileri Dışa Aktar'}
            </button>

            {/* Progress Bar */}
            {isExporting && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
};

export default ExportPage;
