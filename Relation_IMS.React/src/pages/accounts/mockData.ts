// Mock data for the Sales & Income section

export interface MonthlySalesRow {
    period: string;
    grossSales: number;
    discounts: number;
    returns: number;
    netIncome: number;
    trend: 'up' | 'down' | 'rocket';
}

export interface IncomeMixCategory {
    name: string;
    percentage: number;
    amount: number;
    colorClass: string;
}

export interface TopCustomer {
    name: string;
    tier: string;
    revenue: number;
    orders: number;
    avatar: string;
}

export const salesMetrics = {
    totalGrossRevenue: 842910.00,
    revenueChange: 12.4,
    netIncomeMargin: 68.2,
    marginTarget: 65,
    returnsClaims: 14203.15,
    returnsPercent: 1.8,
    topRegion: 'Scandinavia',
    topRegionUnits: 2410,
};

export const monthlySalesData: MonthlySalesRow[] = [
    { period: 'January 2024', grossSales: 142500.00, discounts: 4200.00, returns: 1500.00, netIncome: 136800.00, trend: 'up' },
    { period: 'February 2024', grossSales: 128400.00, discounts: 3100.00, returns: 2400.00, netIncome: 122900.00, trend: 'down' },
    { period: 'March 2024', grossSales: 165000.00, discounts: 5500.00, returns: 900.00, netIncome: 158600.00, trend: 'up' },
    { period: 'April 2024', grossSales: 189200.00, discounts: 6200.00, returns: 3200.00, netIncome: 179800.00, trend: 'rocket' },
    { period: 'May 2024', grossSales: 110500.00, discounts: 2800.00, returns: 1100.00, netIncome: 106600.00, trend: 'down' },
    { period: 'June 2024', grossSales: 107310.00, discounts: 2700.00, returns: 5103.15, netIncome: 99506.85, trend: 'down' },
];

export const incomeMixData: IncomeMixCategory[] = [
    { name: 'Shirt', percentage: 42, amount: 251202, colorClass: 'bg-primary' },
    { name: 'Pant', percentage: 28, amount: 167468, colorClass: 'bg-secondary' },
    { name: 'T-shirt', percentage: 18, amount: 107658, colorClass: 'bg-tertiary' },
    { name: 'Polo', percentage: 12, amount: 71772, colorClass: 'bg-gray-400 dark:bg-gray-500' },
];

export const topCustomersData: TopCustomer[] = [
    { name: 'Elias Thorne', tier: 'Premium Member', revenue: 12450.00, orders: 14, avatar: 'ET' },
    { name: 'Sienna Vance', tier: 'Architect Partner', revenue: 9820.50, orders: 9, avatar: 'SV' },
    { name: 'Marcus Reed', tier: 'Standard Tier', revenue: 8110.00, orders: 22, avatar: 'MR' },
    { name: 'Clara Schmidt', tier: 'VIP Executive', revenue: 7445.00, orders: 6, avatar: 'CS' },
];

export const salesTotals = {
    grossSales: 625100.00,
    discounts: 19000.00,
    returns: 8000.00,
    netIncome: 598100.00,
};

// =========================================
// General Ledger Mock Data
// =========================================

export interface LedgerEntry {
    date: string;
    accountCode: string;
    description: string;
    reference: string;
    debit: number | null;
    credit: number | null;
    balance: number;
}

export interface LedgerSummary {
    openingBalance: number;
    openingDate: string;
    totalDebits: number;
    debitsChange: number;
    totalCredits: number;
    creditsChange: number;
    closingBalance: number;
}

export const ledgerSummary: LedgerSummary = {
    openingBalance: 142500.00,
    openingDate: 'Oct 01, 2024',
    totalDebits: 54230.15,
    debitsChange: 12.4,
    totalCredits: 31890.00,
    creditsChange: -8.1,
    closingBalance: 164840.15,
};

export const ledgerEntries: LedgerEntry[] = [
    {
        date: 'Oct 12, 2024',
        accountCode: '1010-001',
        description: 'Main Operating Account Deposit',
        reference: 'REF: INV-2024-8829 | Customer: Verde Designs',
        debit: 12450.00,
        credit: null,
        balance: 154950.00,
    },
    {
        date: 'Oct 15, 2024',
        accountCode: '5020-015',
        description: 'Sustainable Sourcing Fees',
        reference: 'REF: VOU-551 | Vendor: Forest Collective',
        debit: null,
        credit: 3200.00,
        balance: 151750.00,
    },
    {
        date: 'Oct 18, 2024',
        accountCode: '1010-001',
        description: 'Quarterly Maintenance Payout',
        reference: 'REF: CHQ-9012 | Facility Services',
        debit: null,
        credit: 1850.50,
        balance: 149899.50,
    },
    {
        date: 'Oct 22, 2024',
        accountCode: '4010-002',
        description: 'Architectural Consultation Revenue',
        reference: 'REF: INV-2024-8840 | Client: Bloom Studio',
        debit: 8500.00,
        credit: null,
        balance: 158399.50,
    },
    {
        date: 'Oct 25, 2024',
        accountCode: '1050-000',
        description: 'Petty Cash Reimbursement',
        reference: 'REF: PC-045 | Office Supplies',
        debit: null,
        credit: 450.00,
        balance: 157949.50,
    },
    {
        date: 'Oct 28, 2024',
        accountCode: '1010-001',
        description: 'Bulk Stock Acquisition',
        reference: 'REF: PO-8871 | Supplier: BioFrame Intl.',
        debit: null,
        credit: 14200.00,
        balance: 143749.50,
    },
];

export const ledgerPeriodTotals = {
    totalDebit: 20950.00,
    totalCredit: 19700.50,
    closingBalance: 143749.50,
};

// =========================================
// Balance Sheet Mock Data
// =========================================

export interface BalanceSheetLineItem {
    label: string;
    amount: number;
    isNegative?: boolean; // for items like depreciation
}

export interface BalanceSheetSection {
    title: string;
    subtitle: string;
    colorClass: string; // 'primary' or 'secondary'
    items: BalanceSheetLineItem[];
    total: number;
    totalLabel: string;
}

export const currentAssets: BalanceSheetSection = {
    title: 'Current Assets',
    subtitle: 'Liquidity: High',
    colorClass: 'primary',
    items: [
        { label: 'Cash & Equivalents', amount: 142500.00 },
        { label: 'Architectural Inventory', amount: 285750.00 },
        { label: 'Accounts Receivable', amount: 64200.00 },
        { label: 'Prepaid Sustainable Materials', amount: 12000.00 },
    ],
    total: 504450.00,
    totalLabel: 'Total Current Assets',
};

export const fixedAssets: BalanceSheetSection = {
    title: 'Fixed Assets',
    subtitle: 'Long-term Investments',
    colorClass: 'primary',
    items: [
        { label: 'Office & Studio Equipment', amount: 85000.00 },
        { label: 'Sustainable Showroom (Real Estate)', amount: 1200000.00 },
        { label: 'Accumulated Depreciation', amount: -120000.00, isNegative: true },
    ],
    total: 1165000.00,
    totalLabel: 'Total Fixed Assets',
};

export const currentLiabilities: BalanceSheetSection = {
    title: 'Current Liabilities',
    subtitle: 'Payable < 1 Year',
    colorClass: 'secondary',
    items: [
        { label: 'Accounts Payable', amount: 42300.00 },
        { label: 'Short-term Bridge Loan', amount: 150000.00 },
        { label: 'Accrued Taxes (Eco-Tariff)', amount: 28150.00 },
    ],
    total: 220450.00,
    totalLabel: 'Total Current Liabilities',
};

export const longTermLiabilities: BalanceSheetSection = {
    title: 'Long-Term Liabilities',
    subtitle: 'Mortgages & Debentures',
    colorClass: 'secondary',
    items: [
        { label: 'Showroom Mortgage', amount: 650000.00 },
        { label: 'Equipment Finance Lease', amount: 45000.00 },
    ],
    total: 695000.00,
    totalLabel: 'Total Long-term Debt',
};

export const shareholderEquity: BalanceSheetSection = {
    title: 'Shareholder Equity',
    subtitle: 'Net Worth',
    colorClass: 'secondary',
    items: [
        { label: 'Initial Capital Investment', amount: 500000.00 },
        { label: 'Retained Earnings', amount: 254000.00 },
    ],
    total: 754000.00,
    totalLabel: 'Total Equity',
};

export const balanceSheetTotals = {
    totalAssets: 1669450.00,
    totalLiabilitiesEquity: 1669450.00,
    isBalanced: true,
    asOfDate: 'December 31, 2024',
};

// =========================================
// Cash Book Mock Data
// =========================================

export interface CashBookSummary {
    openingBalance: number;
    openingDate: string;
    totalCashIn: number;
    cashInChange: string;
    totalCashOut: number;
    cashOutChange: string;
    closingBalance: number;
    reconciled: boolean;
}

export interface CashBookEntry {
    date: string;
    refNo: string;
    description: string;
    reference: string;
    category: string;
    categoryColor: string;
    cashIn: number | null;
    cashOut: number | null;
    balance: number;
    status: 'verified' | 'pending';
}

export const cashBookSummary: CashBookSummary = {
    openingBalance: 42850.00,
    openingDate: 'Oct 1, 2024',
    totalCashIn: 12410.50,
    cashInChange: '+14% vs last period',
    totalCashOut: 5920.15,
    cashOutChange: '8% lower expenditure',
    closingBalance: 49340.35,
    reconciled: true,
};

export const cashBookEntries: CashBookEntry[] = [
    {
        date: 'Oct 12, 2024',
        refNo: 'INV-88210',
        description: 'Client Payment: Aris Designs',
        reference: 'E-Transfer Received',
        category: 'Project Revenue',
        categoryColor: 'emerald',
        cashIn: 4200.00,
        cashOut: null,
        balance: 47050.00,
        status: 'verified',
    },
    {
        date: 'Oct 14, 2024',
        refNo: 'EXP-9902',
        description: 'Sustainable Timber Supply',
        reference: 'Supplier: Nordic Woods',
        category: 'Inventory',
        categoryColor: 'stone',
        cashIn: null,
        cashOut: 2150.20,
        balance: 44899.80,
        status: 'verified',
    },
    {
        date: 'Oct 15, 2024',
        refNo: 'VCHR-004',
        description: 'Utility: Solar Grid Maint.',
        reference: 'Recurring Monthly',
        category: 'Maintenance',
        categoryColor: 'stone',
        cashIn: null,
        cashOut: 340.00,
        balance: 44559.80,
        status: 'verified',
    },
    {
        date: 'Oct 18, 2024',
        refNo: 'INV-88214',
        description: 'Store Sales: Batch #042',
        reference: 'Point of Sale Summary',
        category: 'Sales',
        categoryColor: 'emerald',
        cashIn: 8210.50,
        cashOut: null,
        balance: 52770.30,
        status: 'verified',
    },
    {
        date: 'Oct 20, 2024',
        refNo: 'EXP-9915',
        description: 'Office Equipment Repair',
        reference: 'Unplanned Expenditure',
        category: 'Repairs',
        categoryColor: 'error',
        cashIn: null,
        cashOut: 3429.95,
        balance: 49340.35,
        status: 'pending',
    },
];

export const cashBookPeriodTotals = {
    cashIn: 12410.50,
    cashOut: 5920.15,
    closingBalance: 49340.35,
};

// =========================================
// Profit & Loss Mock Data
// =========================================

export interface ProfitLossMetrics {
    netProfitMargin: number;
    marginChange: string; // e.g., '+2.4% vs Q2'
    operatingRatio: number;
    revenueValue: number;
    expensesValue: number;
}

export interface ProfitLossStatementRow {
    id: string;
    section: string; // 'Revenue', 'COGS', 'OPEX', etc.
    label: string;
    amount: number;
    isSubtotal?: boolean;
    isNegative?: boolean;
    isHeader?: boolean;
}

export const profitLossMetrics: ProfitLossMetrics = {
    netProfitMargin: 28.4,
    marginChange: '+2.4% vs Q2',
    operatingRatio: 64.2,
    revenueValue: 428500.00,
    expensesValue: 340300.00,
};

export const profitLossStatement: ProfitLossStatementRow[] = [
    // Revenue
    { id: '1', section: 'Revenue', label: 'Gross Sales', amount: 428500.00, isHeader: true },
    { id: '2', section: 'Revenue', label: 'Returns & Credits', amount: -12400.00, isNegative: true },
    { id: '3', section: 'Revenue', label: 'Net Revenue', amount: 416100.00, isSubtotal: true },
    
    // COGS
    { id: '4', section: 'COGS', label: 'Fabric & Materials', amount: 154200.00, isHeader: true },
    { id: '5', section: 'COGS', label: 'Labor', amount: 82400.00 },
    { id: '6', section: 'COGS', label: 'Freight', amount: 18900.00 },
    { id: '7', section: 'COGS', label: 'Gross Margin', amount: 160600.00, isSubtotal: true },
    
    // OPEX
    { id: '8', section: 'OPEX', label: 'Rent', amount: 12000.00, isHeader: true },
    { id: '9', section: 'OPEX', label: 'Salary (Administrative)', amount: 34500.00 },
    { id: '10', section: 'OPEX', label: 'Utilities', amount: 4200.00 },
    { id: '11', section: 'OPEX', label: 'Marketing', amount: 18600.00 },
    { id: '12', section: 'OPEX', label: 'Packaging', amount: 3100.00 },
    { id: '13', section: 'OPEX', label: 'Total OPEX', amount: 72400.00, isSubtotal: true },
];

export const profitLossFinalCalc = {
    netOperatingIncome: 88200.00,
    taxProvision: 18522.00, 
    effectiveRate: 21,
};


