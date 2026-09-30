import {
  Account,
  AppDatabaseState,
  CashTransaction,
  CashTransactionType,
  Category,
  CompanySettings,
  CustomerReceipt,
  JournalEntry,
  JournalLine,
  Party,
  Product,
  Purchase,
  PurchaseLine,
  Sale,
  SaleLine,
  StockMovement,
  SupplierPayment,
  Unit,
} from '../types';
import { StatementLedgerLine } from '../utils/htmlPrintRenderer';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createInitialDatabaseState(): AppDatabaseState {
  const today = todayIsoDate();
  const nowIso = new Date().toISOString();

  const units: Unit[] = [
    { id: 1, code: 'pcs', name: 'Pieces', allowsFractionalQuantity: false, isActive: true },
    { id: 2, code: 'kg', name: 'Kilogram', allowsFractionalQuantity: true, isActive: true },
    { id: 3, code: 'g', name: 'Gram', allowsFractionalQuantity: true, isActive: true },
    { id: 4, code: 'ltr', name: 'Liter', allowsFractionalQuantity: true, isActive: true },
    { id: 5, code: 'box', name: 'Box', allowsFractionalQuantity: false, isActive: true },
  ];

  const categories: Category[] = [
    { id: 1, name: 'Groceries & Staples', description: 'Rice, lentils, oil, sugar, flour', isActive: true },
    { id: 2, name: 'Beverages & Dairy', description: 'Tea, milk powder, juices, drinks', isActive: true },
    { id: 3, name: 'Household & Personal Care', description: 'Soap, detergent, cleaning supplies', isActive: true },
    { id: 4, name: 'Stationery & Electrical', description: 'Paper, pens, LED bulbs, cables', isActive: true },
  ];

  const accounts: Account[] = [
    { id: 1, code: '1000', name: 'Cash', accountType: 'Asset', normalBalance: 'Debit', isSystem: true },
    { id: 2, code: '1100', name: 'Inventory', accountType: 'Asset', normalBalance: 'Debit', isSystem: true },
    { id: 3, code: '1200', name: 'Accounts Receivable', accountType: 'Asset', normalBalance: 'Debit', isSystem: true },
    { id: 4, code: '2000', name: 'Accounts Payable', accountType: 'Liability', normalBalance: 'Credit', isSystem: true },
    { id: 5, code: '3000', name: 'Owner Capital', accountType: 'Equity', normalBalance: 'Credit', isSystem: true },
    { id: 6, code: '3100', name: 'Opening Balance', accountType: 'Equity', normalBalance: 'Credit', isSystem: true },
    { id: 7, code: '4000', name: 'Sales Revenue', accountType: 'Income', normalBalance: 'Credit', isSystem: true },
    { id: 8, code: '4100', name: 'Other Income', accountType: 'Income', normalBalance: 'Credit', isSystem: true },
    { id: 9, code: '5000', name: 'Cost of Goods Sold', accountType: 'Expense', normalBalance: 'Debit', isSystem: true },
    { id: 10, code: '5100', name: 'General Expense', accountType: 'Expense', normalBalance: 'Debit', isSystem: true },
  ];

  const products: Product[] = [
    {
      id: 1,
      name: 'Miniket Rice Premium',
      sku: 'GRC-001',
      barcode: '8901001000011',
      categoryId: 1,
      unitId: 2,
      purchasePriceMinor: 6400, // 64.00 BDT/kg
      sellingPriceMinor: 7200, // 72.00 BDT/kg
      currentStock: 85,
      reorderLevel: 25,
      notes: '50kg sack loose & retail sale',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      name: 'Soyabean Oil 5L Bottle',
      sku: 'GRC-002',
      barcode: '8901001000028',
      categoryId: 1,
      unitId: 1,
      purchasePriceMinor: 76000, // 760.00 BDT
      sellingPriceMinor: 81500, // 815.00 BDT
      currentStock: 14,
      reorderLevel: 10,
      notes: 'Fortified edible oil 5L jar',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      name: 'Red Lentils (Masoor Dal)',
      sku: 'GRC-003',
      barcode: '8901001000035',
      categoryId: 1,
      unitId: 2,
      purchasePriceMinor: 11800, // 118.00 BDT/kg
      sellingPriceMinor: 13200, // 132.00 BDT/kg
      currentStock: 6, // Low stock!
      reorderLevel: 15,
      notes: 'Fine deshi lentil',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 4,
      name: 'Sylhet Black Tea 400g Pack',
      sku: 'BEV-001',
      barcode: '8901002000018',
      categoryId: 2,
      unitId: 1,
      purchasePriceMinor: 18500, // 185.00 BDT
      sellingPriceMinor: 21500, // 215.00 BDT
      currentStock: 22,
      reorderLevel: 8,
      notes: 'Best seller tea pack',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 5,
      name: 'Full Cream Milk Powder 1kg',
      sku: 'BEV-002',
      barcode: '8901002000025',
      categoryId: 2,
      unitId: 1,
      purchasePriceMinor: 74000, // 740.00 BDT
      sellingPriceMinor: 81000, // 810.00 BDT
      currentStock: 4, // Low stock!
      reorderLevel: 6,
      notes: 'Foil pouch',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 6,
      name: 'A4 Offset Paper 80gsm Ream',
      sku: 'STN-001',
      barcode: '8901004000012',
      categoryId: 4,
      unitId: 5,
      purchasePriceMinor: 49000, // 490.00 BDT
      sellingPriceMinor: 55000, // 550.00 BDT
      currentStock: 0, // Out of stock!
      reorderLevel: 5,
      notes: '500 sheets per box/ream',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 7,
      name: 'LED Daylight Bulb 15W',
      sku: 'ELC-001',
      barcode: '8901004000029',
      categoryId: 4,
      unitId: 1,
      purchasePriceMinor: 16500, // 165.00 BDT
      sellingPriceMinor: 21000, // 210.00 BDT
      currentStock: 18,
      reorderLevel: 6,
      notes: '1 year warranty',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const parties: Party[] = [
    {
      id: 1,
      partyType: 'Customer',
      name: 'Rahman General Store',
      phone: '01711-234567',
      address: '14 Mirpur Road, Dhaka',
      openingBalanceMinor: 120000, // 1,200.00 BDT opening due
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      partyType: 'Customer',
      name: 'Karim Enterprise',
      phone: '01819-876543',
      address: 'Banani Bazar, Block C',
      openingBalanceMinor: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      partyType: 'Supplier',
      name: 'Meghna Agro Traders',
      phone: '01713-998877',
      address: 'Chawk Bazar Wholesale Hub',
      openingBalanceMinor: 250000, // 2,500.00 BDT opening payable
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 4,
      partyType: 'Both',
      name: 'Padma Distribution Co.',
      phone: '01911-445566',
      address: 'Tejgaon Industrial Area',
      openingBalanceMinor: 0,
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const settings: CompanySettings = {
    companyName: 'Bismillah Retail & Mart',
    storeTagline: 'Quality Wholesale & Retail Mart',
    address: 'House 24, Road 7, Dhanmondi, Dhaka-1205',
    phone: '01700-112233',
    email: 'billing@bismillahmart.com',
    taxNumber: 'BIN-002849102-01',
    currencyCode: 'BDT',
    invoicePrefix: 'INV-',
    purchasePrefix: 'PO-',
    allowNegativeStock: false,
    allowSalePriceEditing: true,
    requireCustomerForCreditSale: true,
    defaultPaymentMethod: 'Cash',
    costingMethod: 'WeightedAverage',
    defaultPrintProfile: 'A4',
    logoPath: '',
    footerNote: 'Thank you for shopping with us. Goods once sold can be exchanged within 3 days with invoice.',
    showPreviousDueOnSalesInvoice: true,
    theme: 'Light',
    adminUsername: 'admin',
    adminPassword: 'Bill1ng!0',
    requireLoginOnStart: true,
  };

  const stockMovements: StockMovement[] = [
    {
      id: 1,
      productId: 1,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 1,
      referenceNumber: 'OPEN-000001',
      quantity: 100,
      direction: 'In',
      unitCostMinor: 6400,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    {
      id: 2,
      productId: 2,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 2,
      referenceNumber: 'OPEN-000002',
      quantity: 6,
      direction: 'In',
      unitCostMinor: 76000,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    {
      id: 3,
      productId: 3,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 3,
      referenceNumber: 'OPEN-000003',
      quantity: 6,
      direction: 'In',
      unitCostMinor: 11800,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    {
      id: 4,
      productId: 4,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 4,
      referenceNumber: 'OPEN-000004',
      quantity: 25,
      direction: 'In',
      unitCostMinor: 18500,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    {
      id: 5,
      productId: 5,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 5,
      referenceNumber: 'OPEN-000005',
      quantity: 4,
      direction: 'In',
      unitCostMinor: 74000,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    {
      id: 6,
      productId: 7,
      movementDate: today,
      movementType: 'OpeningStock',
      referenceType: 'Product',
      referenceId: 7,
      referenceNumber: 'OPEN-000007',
      quantity: 20,
      direction: 'In',
      unitCostMinor: 16500,
      description: 'Opening stock entry',
      notes: 'Initial inventory count',
      createdAt: nowIso,
    },
    // Purchase PO-000001 adds 10 pcs of Soyabean Oil 5L
    {
      id: 7,
      productId: 2,
      movementDate: today,
      movementType: 'Purchase',
      referenceType: 'Purchase',
      referenceId: 1,
      referenceNumber: 'PO-000001',
      quantity: 10,
      direction: 'In',
      unitCostMinor: 76000,
      description: 'Supplier purchase from Meghna Agro Traders',
      notes: 'Restock edible oil',
      createdAt: nowIso,
    },
    // Sale INV-000001 sells 15 kg Miniket Rice and 2 pcs Soyabean Oil 5L
    {
      id: 8,
      productId: 1,
      movementDate: today,
      movementType: 'Sale',
      referenceType: 'Sale',
      referenceId: 1,
      referenceNumber: 'INV-000001',
      quantity: 15,
      direction: 'Out',
      unitCostMinor: 6400,
      description: 'Sale invoice INV-000001',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 9,
      productId: 2,
      movementDate: today,
      movementType: 'Sale',
      referenceType: 'Sale',
      referenceId: 1,
      referenceNumber: 'INV-000001',
      quantity: 2,
      direction: 'Out',
      unitCostMinor: 76000,
      description: 'Sale invoice INV-000001',
      notes: '',
      createdAt: nowIso,
    },
    // Sale INV-000002 sells 3 packs Tea and 2 LED Bulbs
    {
      id: 10,
      productId: 4,
      movementDate: today,
      movementType: 'Sale',
      referenceType: 'Sale',
      referenceId: 2,
      referenceNumber: 'INV-000002',
      quantity: 3,
      direction: 'Out',
      unitCostMinor: 18500,
      description: 'Sale invoice INV-000002',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 11,
      productId: 7,
      movementDate: today,
      movementType: 'Sale',
      referenceType: 'Sale',
      referenceId: 2,
      referenceNumber: 'INV-000002',
      quantity: 2,
      direction: 'Out',
      unitCostMinor: 16500,
      description: 'Sale invoice INV-000002',
      notes: '',
      createdAt: nowIso,
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 1,
      purchaseNumber: 'PO-000001',
      supplierId: 3,
      supplierName: 'Meghna Agro Traders',
      supplierInvoiceNumber: 'MAT-8842',
      purchaseDate: today,
      status: 'Posted',
      totalAmountMinor: 760000, // 7,600.00 BDT
      paidAmountMinor: 500000, // 5,000.00 BDT paid
      dueAmountMinor: 260000, // 2,600.00 BDT payable created
      previousPayableMinor: 250000,
      updatedPayableMinor: 510000,
      notes: 'Regular weekly oil restock',
      createdAt: nowIso,
      lines: [
        {
          id: 1,
          purchaseId: 1,
          productId: 2,
          productName: 'Soyabean Oil 5L Bottle',
          unitCode: 'pcs',
          quantity: 10,
          unitPurchasePriceMinor: 76000,
          lineTotalMinor: 760000,
        },
      ],
    },
  ];

  const sales: Sale[] = [
    {
      id: 1,
      invoiceNumber: 'INV-000001',
      customerId: 1,
      customerName: 'Rahman General Store',
      saleDate: today,
      status: 'Posted',
      totalAmountMinor: 271000, // 15*72.00 (1080) + 2*815.00 (1630) = 2,710.00 BDT
      paidAmountMinor: 200000, // 2,000.00 BDT paid
      dueAmountMinor: 71000, // 710.00 BDT due
      previousReceivableMinor: 120000,
      updatedReceivableMinor: 191000,
      notes: 'Partial credit sale',
      createdAt: nowIso,
      lines: [
        {
          id: 1,
          saleId: 1,
          productId: 1,
          productName: 'Miniket Rice Premium',
          unitCode: 'kg',
          quantity: 15,
          unitPriceMinor: 7200,
          unitCostMinor: 6400,
          lineTotalMinor: 108000,
        },
        {
          id: 2,
          saleId: 1,
          productId: 2,
          productName: 'Soyabean Oil 5L Bottle',
          unitCode: 'pcs',
          quantity: 2,
          unitPriceMinor: 81500,
          unitCostMinor: 76000,
          lineTotalMinor: 163000,
        },
      ],
    },
    {
      id: 2,
      invoiceNumber: 'INV-000002',
      customerId: null,
      customerName: 'Walk-in customer',
      saleDate: today,
      status: 'Posted',
      totalAmountMinor: 106500, // 3*215.00 (645) + 2*210.00 (420) = 1,065.00 BDT
      paidAmountMinor: 106500,
      dueAmountMinor: 0,
      previousReceivableMinor: 0,
      updatedReceivableMinor: 0,
      notes: 'Counter cash sale',
      createdAt: nowIso,
      lines: [
        {
          id: 3,
          saleId: 2,
          productId: 4,
          productName: 'Sylhet Black Tea 400g Pack',
          unitCode: 'pcs',
          quantity: 3,
          unitPriceMinor: 21500,
          unitCostMinor: 18500,
          lineTotalMinor: 64500,
        },
        {
          id: 4,
          saleId: 2,
          productId: 7,
          productName: 'LED Daylight Bulb 15W',
          unitCode: 'pcs',
          quantity: 2,
          unitPriceMinor: 21000,
          unitCostMinor: 16500,
          lineTotalMinor: 42000,
        },
      ],
    },
  ];

  const customerReceipts: CustomerReceipt[] = [
    {
      id: 1,
      receiptNumber: 'CR-000001',
      customerId: 1,
      customerName: 'Rahman General Store',
      receiptDate: today,
      status: 'Posted',
      amountMinor: 50000, // 500.00 BDT collected
      previousBalanceMinor: 191000,
      updatedBalanceMinor: 141000,
      paymentMethod: 'Cash',
      reference: 'RCPT-101',
      notes: 'Collected previous due installment',
      createdAt: nowIso,
    },
  ];

  const supplierPayments: SupplierPayment[] = [
    {
      id: 1,
      paymentNumber: 'SP-000001',
      supplierId: 3,
      supplierName: 'Meghna Agro Traders',
      paymentDate: today,
      status: 'Posted',
      amountMinor: 150000, // 1,500.00 BDT paid
      previousBalanceMinor: 510000,
      updatedBalanceMinor: 360000,
      paymentMethod: 'Cash',
      reference: 'VCH-301',
      notes: 'Part payment to supplier representative',
      createdAt: nowIso,
    },
  ];

  const cashTransactions: CashTransaction[] = [
    {
      id: 1,
      transactionNumber: 'CSH-000001',
      transactionDate: today,
      transactionType: 'OwnerCapital',
      referenceType: 'ManualCash',
      referenceId: 1,
      referenceNumber: 'CSH-000001',
      cashInMinor: 2500000, // 25,000.00 BDT opening cash capital
      cashOutMinor: 0,
      paymentMethod: 'Cash',
      reference: 'OPEN-CASH',
      description: 'Opening shop cash float introduced by owner',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 2,
      transactionNumber: 'CSH-000002',
      transactionDate: today,
      transactionType: 'CashPurchase',
      referenceType: 'Purchase',
      referenceId: 1,
      referenceNumber: 'PO-000001',
      cashInMinor: 0,
      cashOutMinor: 500000, // 5,000.00 BDT
      paymentMethod: 'Cash',
      reference: 'PO-000001',
      description: 'Cash paid for purchase PO-000001 (Meghna Agro Traders)',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 3,
      transactionNumber: 'CSH-000003',
      transactionDate: today,
      transactionType: 'CashSale',
      referenceType: 'Sale',
      referenceId: 1,
      referenceNumber: 'INV-000001',
      cashInMinor: 200000, // 2,000.00 BDT
      cashOutMinor: 0,
      paymentMethod: 'Cash',
      reference: 'INV-000001',
      description: 'Cash received on sale INV-000001 (Rahman General Store)',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 4,
      transactionNumber: 'CSH-000004',
      transactionDate: today,
      transactionType: 'CashSale',
      referenceType: 'Sale',
      referenceId: 2,
      referenceNumber: 'INV-000002',
      cashInMinor: 106500, // 1,065.00 BDT
      cashOutMinor: 0,
      paymentMethod: 'Cash',
      reference: 'INV-000002',
      description: 'Cash received on sale INV-000002 (Walk-in customer)',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 5,
      transactionNumber: 'CSH-000005',
      transactionDate: today,
      transactionType: 'CustomerReceipt',
      referenceType: 'CustomerReceipt',
      referenceId: 1,
      referenceNumber: 'CR-000001',
      cashInMinor: 50000, // 500.00 BDT
      cashOutMinor: 0,
      paymentMethod: 'Cash',
      reference: 'CR-000001',
      description: 'Customer due collection CR-000001 from Rahman General Store',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 6,
      transactionNumber: 'CSH-000006',
      transactionDate: today,
      transactionType: 'SupplierPayment',
      referenceType: 'SupplierPayment',
      referenceId: 1,
      referenceNumber: 'SP-000001',
      cashInMinor: 0,
      cashOutMinor: 150000, // 1,500.00 BDT
      paymentMethod: 'Cash',
      reference: 'SP-000001',
      description: 'Supplier payable payment SP-000001 to Meghna Agro Traders',
      notes: '',
      createdAt: nowIso,
    },
    {
      id: 7,
      transactionNumber: 'CSH-000007',
      transactionDate: today,
      transactionType: 'GeneralExpense',
      referenceType: 'ManualCash',
      referenceId: 7,
      referenceNumber: 'CSH-000007',
      cashInMinor: 0,
      cashOutMinor: 35000, // 350.00 BDT
      paymentMethod: 'Cash',
      reference: 'EXP-101',
      description: 'Daily shop electricity & van delivery charge',
      notes: 'Paid in cash',
      createdAt: nowIso,
    },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: 1,
      entryNumber: 'JRN-000001',
      entryDate: today,
      referenceType: 'ManualCash',
      referenceId: 1,
      referenceNumber: 'CSH-000001',
      description: 'Opening shop cash float introduced by owner',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 1, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 2500000, creditMinor: 0, description: 'Cash in' },
        { id: 2, accountId: 5, accountCode: '3000', accountName: 'Owner Capital', debitMinor: 0, creditMinor: 2500000, description: 'Owner capital introduced' },
      ],
    },
    {
      id: 2,
      entryNumber: 'JRN-000002',
      entryDate: today,
      referenceType: 'Purchase',
      referenceId: 1,
      referenceNumber: 'PO-000001',
      description: 'Supplier purchase PO-000001 from Meghna Agro Traders',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 3, accountId: 2, accountCode: '1100', accountName: 'Inventory', debitMinor: 760000, creditMinor: 0, description: 'Inventory increase' },
        { id: 4, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 0, creditMinor: 500000, description: 'Cash paid' },
        { id: 5, accountId: 4, accountCode: '2000', accountName: 'Accounts Payable', debitMinor: 0, creditMinor: 260000, description: 'Supplier payable' },
      ],
    },
    {
      id: 3,
      entryNumber: 'JRN-000003',
      entryDate: today,
      referenceType: 'Sale',
      referenceId: 1,
      referenceNumber: 'INV-000001',
      description: 'Sale invoice INV-000001 to Rahman General Store',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 6, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 200000, creditMinor: 0, description: 'Cash received' },
        { id: 7, accountId: 3, accountCode: '1200', accountName: 'Accounts Receivable', debitMinor: 71000, creditMinor: 0, description: 'Customer due' },
        { id: 8, accountId: 7, accountCode: '4000', accountName: 'Sales Revenue', debitMinor: 0, creditMinor: 271000, description: 'Sales revenue' },
        { id: 9, accountId: 9, accountCode: '5000', accountName: 'Cost of Goods Sold', debitMinor: 248000, creditMinor: 0, description: 'COGS (15*64 + 2*760)' },
        { id: 10, accountId: 2, accountCode: '1100', accountName: 'Inventory', debitMinor: 0, creditMinor: 248000, description: 'Inventory reduction' },
      ],
    },
    {
      id: 4,
      entryNumber: 'JRN-000004',
      entryDate: today,
      referenceType: 'Sale',
      referenceId: 2,
      referenceNumber: 'INV-000002',
      description: 'Sale invoice INV-000002 to Walk-in customer',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 11, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 106500, creditMinor: 0, description: 'Cash received' },
        { id: 12, accountId: 7, accountCode: '4000', accountName: 'Sales Revenue', debitMinor: 0, creditMinor: 106500, description: 'Sales revenue' },
        { id: 13, accountId: 9, accountCode: '5000', accountName: 'Cost of Goods Sold', debitMinor: 88500, creditMinor: 0, description: 'COGS (3*185 + 2*165)' },
        { id: 14, accountId: 2, accountCode: '1100', accountName: 'Inventory', debitMinor: 0, creditMinor: 88500, description: 'Inventory reduction' },
      ],
    },
    {
      id: 5,
      entryNumber: 'JRN-000005',
      entryDate: today,
      referenceType: 'CustomerReceipt',
      referenceId: 1,
      referenceNumber: 'CR-000001',
      description: 'Customer receipt CR-000001 from Rahman General Store',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 15, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 50000, creditMinor: 0, description: 'Cash received' },
        { id: 16, accountId: 3, accountCode: '1200', accountName: 'Accounts Receivable', debitMinor: 0, creditMinor: 50000, description: 'Receivable reduced' },
      ],
    },
    {
      id: 6,
      entryNumber: 'JRN-000006',
      entryDate: today,
      referenceType: 'SupplierPayment',
      referenceId: 1,
      referenceNumber: 'SP-000001',
      description: 'Supplier payment SP-000001 to Meghna Agro Traders',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 17, accountId: 4, accountCode: '2000', accountName: 'Accounts Payable', debitMinor: 150000, creditMinor: 0, description: 'Payable reduced' },
        { id: 18, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 0, creditMinor: 150000, description: 'Cash paid' },
      ],
    },
    {
      id: 7,
      entryNumber: 'JRN-000007',
      entryDate: today,
      referenceType: 'ManualCash',
      referenceId: 7,
      referenceNumber: 'CSH-000007',
      description: 'Daily shop electricity & van delivery charge',
      status: 'Posted',
      createdAt: nowIso,
      lines: [
        { id: 19, accountId: 10, accountCode: '5100', accountName: 'General Expense', debitMinor: 35000, creditMinor: 0, description: 'General expense' },
        { id: 20, accountId: 1, accountCode: '1000', accountName: 'Cash', debitMinor: 0, creditMinor: 35000, description: 'Cash out' },
      ],
    },
  ];

  return {
    units,
    categories,
    products,
    parties,
    sales,
    heldSales: [],
    purchases,
    customerReceipts,
    supplierPayments,
    stockMovements,
    cashTransactions,
    accounts,
    journalEntries,
    sequences: {
      SALE: { key: 'SALE', prefix: 'INV-', nextValue: 3, paddingWidth: 6 },
      PURCHASE: { key: 'PURCHASE', prefix: 'PO-', nextValue: 2, paddingWidth: 6 },
      CUSTOMER_RECEIPT: { key: 'CUSTOMER_RECEIPT', prefix: 'CR-', nextValue: 2, paddingWidth: 6 },
      SUPPLIER_PAYMENT: { key: 'SUPPLIER_PAYMENT', prefix: 'SP-', nextValue: 2, paddingWidth: 6 },
      STOCK_ADJUSTMENT: { key: 'STOCK_ADJUSTMENT', prefix: 'STK-', nextValue: 1, paddingWidth: 6 },
      CASH: { key: 'CASH', prefix: 'CSH-', nextValue: 8, paddingWidth: 6 },
      JOURNAL: { key: 'JOURNAL', prefix: 'JRN-', nextValue: 8, paddingWidth: 6 },
    },
    settings,
  };
}

export function nextSequenceNumber(state: AppDatabaseState, key: string, overridePrefix?: string): string {
  const seq = state.sequences[key] || { key, prefix: `${key}-`, nextValue: 1, paddingWidth: 6 };
  const prefix = overridePrefix ?? seq.prefix;
  const formatted = `${prefix}${String(seq.nextValue).padStart(seq.paddingWidth, '0')}`;
  seq.nextValue += 1;
  state.sequences[key] = seq;
  return formatted;
}

export function getCustomerSummary(state: AppDatabaseState, customerId: number) {
  const party = state.parties.find((p) => p.id === customerId);
  const opening = party ? party.openingBalanceMinor : 0;

  const postedSales = state.sales.filter((s) => s.customerId === customerId && s.status === 'Posted');
  const postedReceipts = state.customerReceipts.filter((r) => r.customerId === customerId && r.status === 'Posted');

  const totalSalesMinor = postedSales.reduce((acc, s) => acc + s.totalAmountMinor, 0);
  const salePaidMinor = postedSales.reduce((acc, s) => acc + s.paidAmountMinor, 0);
  const receiptPaidMinor = postedReceipts.reduce((acc, r) => acc + r.amountMinor, 0);
  const totalPaidMinor = salePaidMinor + receiptPaidMinor;
  const currentDueMinor = Math.max(0, opening + totalSalesMinor - totalPaidMinor);

  const allDates = [
    ...postedSales.map((s) => s.saleDate),
    ...postedReceipts.map((r) => r.receiptDate),
  ].sort();

  return {
    customerId,
    name: party?.name || 'Unknown Customer',
    phone: party?.phone || '',
    address: party?.address || '',
    openingBalanceMinor: opening,
    totalSalesMinor,
    totalPaidMinor,
    currentDueMinor,
    lastTransactionDate: allDates.length > 0 ? allDates[allDates.length - 1] : '',
  };
}

export function getCustomerLedger(state: AppDatabaseState, customerId: number): StatementLedgerLine[] {
  const party = state.parties.find((p) => p.id === customerId);
  if (!party) return [];

  const events: {
    date: string;
    createdAt: string;
    ref: string;
    desc: string;
    debit: number;
    credit: number;
    refType?: string;
    refId?: number;
    canCancel?: boolean;
  }[] = [];

  if (party.openingBalanceMinor > 0) {
    events.push({
      date: party.createdAt.slice(0, 10),
      createdAt: '0000-01-01T00:00:00Z',
      ref: 'OPENING',
      desc: 'Opening receivable balance',
      debit: party.openingBalanceMinor,
      credit: 0,
      canCancel: false,
    });
  }

  for (const sale of state.sales) {
    if (sale.customerId !== customerId) continue;
    if (sale.status === 'Posted') {
      events.push({
        date: sale.saleDate,
        createdAt: sale.createdAt,
        ref: sale.invoiceNumber,
        desc: `Sales invoice (${sale.lines.length} items)`,
        debit: sale.totalAmountMinor,
        credit: sale.paidAmountMinor,
        refType: 'Sale',
        refId: sale.id,
        canCancel: true,
      });
    } else if (sale.status === 'Cancelled') {
      events.push({
        date: sale.saleDate,
        createdAt: sale.createdAt,
        ref: sale.invoiceNumber,
        desc: `[CANCELLED] Sales invoice (${sale.cancelReason || 'Reversed'})`,
        debit: 0,
        credit: 0,
        refType: 'Sale',
        refId: sale.id,
        canCancel: false,
      });
    }
  }

  for (const receipt of state.customerReceipts) {
    if (receipt.customerId !== customerId) continue;
    if (receipt.status === 'Posted') {
      events.push({
        date: receipt.receiptDate,
        createdAt: receipt.createdAt,
        ref: receipt.receiptNumber,
        desc: `Due collection (${receipt.paymentMethod})${receipt.notes ? ' - ' + receipt.notes : ''}`,
        debit: 0,
        credit: receipt.amountMinor,
        refType: 'CustomerReceipt',
        refId: receipt.id,
        canCancel: true,
      });
    } else if (receipt.status === 'Cancelled') {
      events.push({
        date: receipt.receiptDate,
        createdAt: receipt.createdAt,
        ref: receipt.receiptNumber,
        desc: `[CANCELLED] Due collection (${receipt.cancelReason || 'Reversed'})`,
        debit: 0,
        credit: 0,
        refType: 'CustomerReceipt',
        refId: receipt.id,
        canCancel: false,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let running = 0;
  return events.map((ev) => {
    running = running + ev.debit - ev.credit;
    return {
      transactionDate: ev.date,
      referenceNumber: ev.ref,
      description: ev.desc,
      debitMinor: ev.debit,
      creditMinor: ev.credit,
      runningBalanceMinor: running,
      referenceType: ev.refType,
      referenceId: ev.refId,
      canCancel: ev.canCancel,
    };
  });
}

export function getSupplierSummary(state: AppDatabaseState, supplierId: number) {
  const party = state.parties.find((p) => p.id === supplierId);
  const opening = party ? party.openingBalanceMinor : 0;

  const postedPurchases = state.purchases.filter((p) => p.supplierId === supplierId && p.status === 'Posted');
  const postedPayments = state.supplierPayments.filter((p) => p.supplierId === supplierId && p.status === 'Posted');

  const totalPurchasesMinor = postedPurchases.reduce((acc, p) => acc + p.totalAmountMinor, 0);
  const purchasePaidMinor = postedPurchases.reduce((acc, p) => acc + p.paidAmountMinor, 0);
  const supplierPaymentMinor = postedPayments.reduce((acc, p) => acc + p.amountMinor, 0);
  const totalPaidMinor = purchasePaidMinor + supplierPaymentMinor;
  const currentPayableMinor = Math.max(0, opening + totalPurchasesMinor - totalPaidMinor);

  const allDates = [
    ...postedPurchases.map((p) => p.purchaseDate),
    ...postedPayments.map((p) => p.paymentDate),
  ].sort();

  return {
    supplierId,
    name: party?.name || 'Unknown Supplier',
    phone: party?.phone || '',
    address: party?.address || '',
    openingBalanceMinor: opening,
    totalPurchasesMinor,
    totalPaidMinor,
    currentPayableMinor,
    lastTransactionDate: allDates.length > 0 ? allDates[allDates.length - 1] : '',
  };
}

export function getSupplierLedger(state: AppDatabaseState, supplierId: number): StatementLedgerLine[] {
  const party = state.parties.find((p) => p.id === supplierId);
  if (!party) return [];

  const events: {
    date: string;
    createdAt: string;
    ref: string;
    desc: string;
    debit: number;
    credit: number;
    refType?: string;
    refId?: number;
    canCancel?: boolean;
  }[] = [];

  if (party.openingBalanceMinor > 0) {
    events.push({
      date: party.createdAt.slice(0, 10),
      createdAt: '0000-01-01T00:00:00Z',
      ref: 'OPENING',
      desc: 'Opening supplier payable balance',
      debit: 0,
      credit: party.openingBalanceMinor,
      canCancel: false,
    });
  }

  for (const pur of state.purchases) {
    if (pur.supplierId !== supplierId) continue;
    if (pur.status === 'Posted') {
      events.push({
        date: pur.purchaseDate,
        createdAt: pur.createdAt,
        ref: pur.purchaseNumber,
        desc: `Purchase (${pur.lines.length} items)${pur.supplierInvoiceNumber ? ' Inv#' + pur.supplierInvoiceNumber : ''}`,
        debit: pur.paidAmountMinor,
        credit: pur.totalAmountMinor,
        refType: 'Purchase',
        refId: pur.id,
        canCancel: true,
      });
    } else if (pur.status === 'Cancelled') {
      events.push({
        date: pur.purchaseDate,
        createdAt: pur.createdAt,
        ref: pur.purchaseNumber,
        desc: `[CANCELLED] Purchase (${pur.cancelReason || 'Reversed'})`,
        debit: 0,
        credit: 0,
        refType: 'Purchase',
        refId: pur.id,
        canCancel: false,
      });
    }
  }

  for (const pay of state.supplierPayments) {
    if (pay.supplierId !== supplierId) continue;
    if (pay.status === 'Posted') {
      events.push({
        date: pay.paymentDate,
        createdAt: pay.createdAt,
        ref: pay.paymentNumber,
        desc: `Supplier payment (${pay.paymentMethod})${pay.notes ? ' - ' + pay.notes : ''}`,
        debit: pay.amountMinor,
        credit: 0,
        refType: 'SupplierPayment',
        refId: pay.id,
        canCancel: true,
      });
    } else if (pay.status === 'Cancelled') {
      events.push({
        date: pay.paymentDate,
        createdAt: pay.createdAt,
        ref: pay.paymentNumber,
        desc: `[CANCELLED] Supplier payment (${pay.cancelReason || 'Reversed'})`,
        debit: 0,
        credit: 0,
        refType: 'SupplierPayment',
        refId: pay.id,
        canCancel: false,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let running = 0;
  return events.map((ev) => {
    running = running + ev.credit - ev.debit;
    return {
      transactionDate: ev.date,
      referenceNumber: ev.ref,
      description: ev.desc,
      debitMinor: ev.debit,
      creditMinor: ev.credit,
      runningBalanceMinor: running,
      referenceType: ev.refType,
      referenceId: ev.refId,
      canCancel: ev.canCancel,
    };
  });
}

export function postBalancedJournal(
  state: AppDatabaseState,
  params: {
    entryDate: string;
    referenceType: string;
    referenceId: number | null;
    referenceNumber: string;
    description: string;
    lines: { accountCode: string; debitMinor: number; creditMinor: number; description: string }[];
  }
): JournalEntry {
  const validLines = params.lines.filter((l) => l.debitMinor > 0 || l.creditMinor > 0);
  const totalDebit = validLines.reduce((acc, l) => acc + l.debitMinor, 0);
  const totalCredit = validLines.reduce((acc, l) => acc + l.creditMinor, 0);

  if (totalDebit !== totalCredit) {
    throw new Error(`Accounting validation failed: Total debit (${totalDebit}) does not equal total credit (${totalCredit}).`);
  }

  const entryNumber = nextSequenceNumber(state, 'JOURNAL');
  const nextId = state.journalEntries.reduce((max, j) => Math.max(max, j.id), 0) + 1;

  const journalLines: JournalLine[] = validLines.map((l, idx) => {
    const account = state.accounts.find((a) => a.code === l.accountCode);
    if (!account) {
      throw new Error(`System account ${l.accountCode} not found.`);
    }
    return {
      id: nextId * 100 + idx + 1,
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      debitMinor: l.debitMinor,
      creditMinor: l.creditMinor,
      description: l.description,
    };
  });

  const entry: JournalEntry = {
    id: nextId,
    entryNumber,
    entryDate: params.entryDate,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    description: params.description,
    status: 'Posted',
    lines: journalLines,
    createdAt: new Date().toISOString(),
  };

  state.journalEntries.unshift(entry);
  return entry;
}

export function recordCashTransaction(
  state: AppDatabaseState,
  params: {
    transactionDate: string;
    transactionType: CashTransactionType;
    referenceType: string;
    referenceId: number | null;
    referenceNumber?: string;
    cashInMinor: number;
    cashOutMinor: number;
    paymentMethod?: string;
    reference?: string;
    description: string;
    notes?: string;
  }
): CashTransaction {
  const transactionNumber = nextSequenceNumber(state, 'CASH');
  const nextId = state.cashTransactions.reduce((max, c) => Math.max(max, c.id), 0) + 1;

  const tx: CashTransaction = {
    id: nextId,
    transactionNumber,
    transactionDate: params.transactionDate,
    transactionType: params.transactionType,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber || transactionNumber,
    cashInMinor: params.cashInMinor,
    cashOutMinor: params.cashOutMinor,
    paymentMethod: params.paymentMethod || state.settings.defaultPaymentMethod,
    reference: params.reference || '',
    description: params.description,
    notes: params.notes || '',
    createdAt: new Date().toISOString(),
  };

  state.cashTransactions.push(tx);
  return tx;
}

export function createSaleTransaction(
  state: AppDatabaseState,
  input: {
    customerId: number | null;
    saleDate: string;
    paidAmountMinor: number;
    notes: string;
    lines: { productId: number; quantity: number; unitPriceMinor: number }[];
  }
): Sale {
  if (!input.lines || input.lines.length === 0) {
    throw new Error('Cannot save an empty sale invoice. Add at least one item.');
  }

  let totalAmountMinor = 0;
  let totalCogsMinor = 0;

  for (const item of input.lines) {
    if (item.quantity <= 0) {
      throw new Error('Line quantity must be greater than zero.');
    }
    if (item.unitPriceMinor < 0) {
      throw new Error('Selling price cannot be negative.');
    }
    const product = state.products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product #${item.productId} not found.`);
    }
    const unit = state.units.find((u) => u.id === product.unitId);
    if (unit && !unit.allowsFractionalQuantity && !Number.isInteger(item.quantity)) {
      throw new Error(`${product.name} (${unit.code}) does not allow fractional quantities.`);
    }
    if (!state.settings.allowNegativeStock && product.currentStock < item.quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Available: ${product.currentStock} ${unit?.code || ''}, requested: ${item.quantity}.`
      );
    }
    totalAmountMinor += Math.round(item.quantity * item.unitPriceMinor);
    totalCogsMinor += Math.round(item.quantity * product.purchasePriceMinor);
  }

  if (input.paidAmountMinor < 0) {
    throw new Error('Paid amount cannot be negative.');
  }
  if (input.paidAmountMinor > totalAmountMinor) {
    throw new Error('Paid amount cannot exceed invoice total.');
  }

  const dueAmountMinor = totalAmountMinor - input.paidAmountMinor;
  if (dueAmountMinor > 0 && state.settings.requireCustomerForCreditSale && !input.customerId) {
    throw new Error('A customer must be selected for credit or partial-due sales.');
  }

  const customer = input.customerId ? state.parties.find((p) => p.id === input.customerId) ?? null : null;
  const previousReceivableMinor = customer ? getCustomerSummary(state, customer.id).currentDueMinor : 0;
  const updatedReceivableMinor = customer ? previousReceivableMinor + dueAmountMinor : 0;

  const invoiceNumber = nextSequenceNumber(state, 'SALE', state.settings.invoicePrefix);
  const saleId = state.sales.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const nowIso = new Date().toISOString();

  const saleLines: SaleLine[] = input.lines.map((item, idx) => {
    const product = state.products.find((p) => p.id === item.productId)!;
    const unit = state.units.find((u) => u.id === product.unitId);
    const lineTotalMinor = Math.round(item.quantity * item.unitPriceMinor);
    const unitCostMinor = product.purchasePriceMinor;

    // Reduce product stock
    product.currentStock = Number((product.currentStock - item.quantity).toFixed(4));
    product.updatedAt = nowIso;

    // Record stock movement
    const movId = state.stockMovements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    state.stockMovements.push({
      id: movId,
      productId: product.id,
      movementDate: input.saleDate,
      movementType: 'Sale',
      referenceType: 'Sale',
      referenceId: saleId,
      referenceNumber: invoiceNumber,
      quantity: item.quantity,
      direction: 'Out',
      unitCostMinor,
      description: `Sale invoice ${invoiceNumber}`,
      notes: input.notes,
      createdAt: nowIso,
    });

    return {
      id: saleId * 100 + idx + 1,
      saleId,
      productId: product.id,
      productName: product.name,
      unitCode: unit?.code || 'pcs',
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      unitCostMinor,
      lineTotalMinor,
    };
  });

  const sale: Sale = {
    id: saleId,
    invoiceNumber,
    customerId: customer ? customer.id : null,
    customerName: customer ? customer.name : 'Walk-in customer',
    saleDate: input.saleDate,
    status: 'Posted',
    totalAmountMinor,
    paidAmountMinor: input.paidAmountMinor,
    dueAmountMinor,
    previousReceivableMinor,
    updatedReceivableMinor,
    notes: input.notes,
    lines: saleLines,
    createdAt: nowIso,
  };

  state.sales.unshift(sale);

  if (input.paidAmountMinor > 0) {
    recordCashTransaction(state, {
      transactionDate: input.saleDate,
      transactionType: 'CashSale',
      referenceType: 'Sale',
      referenceId: sale.id,
      referenceNumber: invoiceNumber,
      cashInMinor: input.paidAmountMinor,
      cashOutMinor: 0,
      description: `Cash received on sale ${invoiceNumber} (${sale.customerName})`,
      notes: input.notes,
    });
  }

  const journalLines: { accountCode: string; debitMinor: number; creditMinor: number; description: string }[] = [];
  if (input.paidAmountMinor > 0) {
    journalLines.push({
      accountCode: '1000',
      debitMinor: input.paidAmountMinor,
      creditMinor: 0,
      description: 'Cash received on sale',
    });
  }
  if (dueAmountMinor > 0) {
    journalLines.push({
      accountCode: '1200',
      debitMinor: dueAmountMinor,
      creditMinor: 0,
      description: 'Customer receivable created',
    });
  }
  journalLines.push({
    accountCode: '4000',
    debitMinor: 0,
    creditMinor: totalAmountMinor,
    description: 'Sales revenue',
  });

  if (totalCogsMinor > 0) {
    journalLines.push({
      accountCode: '5000',
      debitMinor: totalCogsMinor,
      creditMinor: 0,
      description: 'Cost of goods sold',
    });
    journalLines.push({
      accountCode: '1100',
      debitMinor: 0,
      creditMinor: totalCogsMinor,
      description: 'Inventory reduction',
    });
  }

  postBalancedJournal(state, {
    entryDate: input.saleDate,
    referenceType: 'Sale',
    referenceId: sale.id,
    referenceNumber: invoiceNumber,
    description: `Sale invoice ${invoiceNumber} to ${sale.customerName}`,
    lines: journalLines,
  });

  return sale;
}

export function createPurchaseTransaction(
  state: AppDatabaseState,
  input: {
    supplierId: number;
    supplierInvoiceNumber: string;
    purchaseDate: string;
    paidAmountMinor: number;
    notes: string;
    lines: { productId: number; quantity: number; unitPurchasePriceMinor: number }[];
  }
): Purchase {
  if (!input.supplierId) {
    throw new Error('Please select a supplier for the purchase.');
  }
  if (!input.lines || input.lines.length === 0) {
    throw new Error('Cannot save an empty purchase. Add at least one item.');
  }

  const supplier = state.parties.find((p) => p.id === input.supplierId);
  if (!supplier) {
    throw new Error('Selected supplier not found.');
  }

  let totalAmountMinor = 0;
  for (const item of input.lines) {
    if (item.quantity <= 0) {
      throw new Error('Line quantity must be greater than zero.');
    }
    if (item.unitPurchasePriceMinor < 0) {
      throw new Error('Purchase price cannot be negative.');
    }
    totalAmountMinor += Math.round(item.quantity * item.unitPurchasePriceMinor);
  }

  if (input.paidAmountMinor < 0) {
    throw new Error('Paid amount cannot be negative.');
  }
  if (input.paidAmountMinor > totalAmountMinor) {
    throw new Error('Paid amount cannot exceed purchase total.');
  }

  const dueAmountMinor = totalAmountMinor - input.paidAmountMinor;
  const previousPayableMinor = getSupplierSummary(state, supplier.id).currentPayableMinor;
  const updatedPayableMinor = previousPayableMinor + dueAmountMinor;

  const purchaseNumber = nextSequenceNumber(state, 'PURCHASE', state.settings.purchasePrefix);
  const purchaseId = state.purchases.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const nowIso = new Date().toISOString();

  const purchaseLines: PurchaseLine[] = input.lines.map((item, idx) => {
    const product = state.products.find((p) => p.id === item.productId)!;
    const unit = state.units.find((u) => u.id === product.unitId);
    const lineTotalMinor = Math.round(item.quantity * item.unitPurchasePriceMinor);

    // Weighted average cost calculation
    const existingQty = Math.max(0, product.currentStock);
    const existingValue = existingQty * product.purchasePriceMinor;
    const newQty = existingQty + item.quantity;
    if (newQty > 0) {
      product.purchasePriceMinor = Math.round((existingValue + lineTotalMinor) / newQty);
    } else {
      product.purchasePriceMinor = item.unitPurchasePriceMinor;
    }

    product.currentStock = Number((product.currentStock + item.quantity).toFixed(4));
    product.updatedAt = nowIso;

    const movId = state.stockMovements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    state.stockMovements.push({
      id: movId,
      productId: product.id,
      movementDate: input.purchaseDate,
      movementType: 'Purchase',
      referenceType: 'Purchase',
      referenceId: purchaseId,
      referenceNumber: purchaseNumber,
      quantity: item.quantity,
      direction: 'In',
      unitCostMinor: item.unitPurchasePriceMinor,
      description: `Supplier purchase ${purchaseNumber} from ${supplier.name}`,
      notes: input.notes,
      createdAt: nowIso,
    });

    return {
      id: purchaseId * 100 + idx + 1,
      purchaseId,
      productId: product.id,
      productName: product.name,
      unitCode: unit?.code || 'pcs',
      quantity: item.quantity,
      unitPurchasePriceMinor: item.unitPurchasePriceMinor,
      lineTotalMinor,
    };
  });

  const purchase: Purchase = {
    id: purchaseId,
    purchaseNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierInvoiceNumber: input.supplierInvoiceNumber,
    purchaseDate: input.purchaseDate,
    status: 'Posted',
    totalAmountMinor,
    paidAmountMinor: input.paidAmountMinor,
    dueAmountMinor,
    previousPayableMinor,
    updatedPayableMinor,
    notes: input.notes,
    lines: purchaseLines,
    createdAt: nowIso,
  };

  state.purchases.unshift(purchase);

  if (input.paidAmountMinor > 0) {
    recordCashTransaction(state, {
      transactionDate: input.purchaseDate,
      transactionType: 'CashPurchase',
      referenceType: 'Purchase',
      referenceId: purchase.id,
      referenceNumber: purchaseNumber,
      cashInMinor: 0,
      cashOutMinor: input.paidAmountMinor,
      description: `Cash paid for purchase ${purchaseNumber} (${supplier.name})`,
      notes: input.notes,
    });
  }

  const journalLines: { accountCode: string; debitMinor: number; creditMinor: number; description: string }[] = [
    {
      accountCode: '1100',
      debitMinor: totalAmountMinor,
      creditMinor: 0,
      description: 'Inventory purchased',
    },
  ];
  if (input.paidAmountMinor > 0) {
    journalLines.push({
      accountCode: '1000',
      debitMinor: 0,
      creditMinor: input.paidAmountMinor,
      description: 'Cash paid to supplier',
    });
  }
  if (dueAmountMinor > 0) {
    journalLines.push({
      accountCode: '2000',
      debitMinor: 0,
      creditMinor: dueAmountMinor,
      description: 'Supplier payable created',
    });
  }

  postBalancedJournal(state, {
    entryDate: input.purchaseDate,
    referenceType: 'Purchase',
    referenceId: purchase.id,
    referenceNumber: purchaseNumber,
    description: `Supplier purchase ${purchaseNumber} from ${supplier.name}`,
    lines: journalLines,
  });

  return purchase;
}

export function collectCustomerDueTransaction(
  state: AppDatabaseState,
  input: {
    customerId: number;
    receiptDate: string;
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    notes: string;
  }
): CustomerReceipt {
  const customer = state.parties.find((p) => p.id === input.customerId);
  if (!customer) {
    throw new Error('Please select a valid customer.');
  }
  if (input.amountMinor <= 0) {
    throw new Error('Collection amount must be greater than zero.');
  }

  const summary = getCustomerSummary(state, customer.id);
  if (input.amountMinor > summary.currentDueMinor) {
    throw new Error(
      `Collection amount cannot exceed current customer due (${(summary.currentDueMinor / 100).toFixed(2)}).`
    );
  }

  const receiptNumber = nextSequenceNumber(state, 'CUSTOMER_RECEIPT');
  const nextId = state.customerReceipts.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const nowIso = new Date().toISOString();

  const receipt: CustomerReceipt = {
    id: nextId,
    receiptNumber,
    customerId: customer.id,
    customerName: customer.name,
    receiptDate: input.receiptDate,
    status: 'Posted',
    amountMinor: input.amountMinor,
    previousBalanceMinor: summary.currentDueMinor,
    updatedBalanceMinor: summary.currentDueMinor - input.amountMinor,
    paymentMethod: input.paymentMethod || 'Cash',
    reference: input.reference,
    notes: input.notes,
    createdAt: nowIso,
  };

  state.customerReceipts.unshift(receipt);

  recordCashTransaction(state, {
    transactionDate: input.receiptDate,
    transactionType: 'CustomerReceipt',
    referenceType: 'CustomerReceipt',
    referenceId: receipt.id,
    referenceNumber: receiptNumber,
    cashInMinor: input.amountMinor,
    cashOutMinor: 0,
    paymentMethod: receipt.paymentMethod,
    reference: input.reference || receiptNumber,
    description: `Customer due collection ${receiptNumber} from ${customer.name}`,
    notes: input.notes,
  });

  postBalancedJournal(state, {
    entryDate: input.receiptDate,
    referenceType: 'CustomerReceipt',
    referenceId: receipt.id,
    referenceNumber: receiptNumber,
    description: `Customer due collection ${receiptNumber} from ${customer.name}`,
    lines: [
      { accountCode: '1000', debitMinor: input.amountMinor, creditMinor: 0, description: 'Cash received' },
      { accountCode: '1200', debitMinor: 0, creditMinor: input.amountMinor, description: 'Accounts receivable reduced' },
    ],
  });

  return receipt;
}

export function paySupplierPayableTransaction(
  state: AppDatabaseState,
  input: {
    supplierId: number;
    paymentDate: string;
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    notes: string;
  }
): SupplierPayment {
  const supplier = state.parties.find((p) => p.id === input.supplierId);
  if (!supplier) {
    throw new Error('Please select a valid supplier.');
  }
  if (input.amountMinor <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const summary = getSupplierSummary(state, supplier.id);
  if (input.amountMinor > summary.currentPayableMinor) {
    throw new Error(
      `Payment amount cannot exceed current supplier payable (${(summary.currentPayableMinor / 100).toFixed(2)}).`
    );
  }

  const paymentNumber = nextSequenceNumber(state, 'SUPPLIER_PAYMENT');
  const nextId = state.supplierPayments.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const nowIso = new Date().toISOString();

  const payment: SupplierPayment = {
    id: nextId,
    paymentNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    paymentDate: input.paymentDate,
    status: 'Posted',
    amountMinor: input.amountMinor,
    previousBalanceMinor: summary.currentPayableMinor,
    updatedBalanceMinor: summary.currentPayableMinor - input.amountMinor,
    paymentMethod: input.paymentMethod || 'Cash',
    reference: input.reference,
    notes: input.notes,
    createdAt: nowIso,
  };

  state.supplierPayments.unshift(payment);

  recordCashTransaction(state, {
    transactionDate: input.paymentDate,
    transactionType: 'SupplierPayment',
    referenceType: 'SupplierPayment',
    referenceId: payment.id,
    referenceNumber: paymentNumber,
    cashInMinor: 0,
    cashOutMinor: input.amountMinor,
    paymentMethod: payment.paymentMethod,
    reference: input.reference || paymentNumber,
    description: `Supplier payable payment ${paymentNumber} to ${supplier.name}`,
    notes: input.notes,
  });

  postBalancedJournal(state, {
    entryDate: input.paymentDate,
    referenceType: 'SupplierPayment',
    referenceId: payment.id,
    referenceNumber: paymentNumber,
    description: `Supplier payment ${paymentNumber} to ${supplier.name}`,
    lines: [
      { accountCode: '2000', debitMinor: input.amountMinor, creditMinor: 0, description: 'Accounts payable reduced' },
      { accountCode: '1000', debitMinor: 0, creditMinor: input.amountMinor, description: 'Cash paid' },
    ],
  });

  return payment;
}

export function adjustStockTransaction(
  state: AppDatabaseState,
  input: {
    productId: number;
    adjustmentDate: string;
    direction: 'Increase' | 'Decrease';
    quantity: number;
    reason: string;
    notes: string;
  }
): StockMovement {
  const product = state.products.find((p) => p.id === input.productId);
  if (!product) {
    throw new Error('Please select a product to adjust.');
  }
  if (input.quantity <= 0) {
    throw new Error('Adjustment quantity must be greater than zero.');
  }
  if (!input.reason.trim()) {
    throw new Error('Adjustment reason is required for audit trail.');
  }

  const unit = state.units.find((u) => u.id === product.unitId);
  if (unit && !unit.allowsFractionalQuantity && !Number.isInteger(input.quantity)) {
    throw new Error(`${product.name} (${unit.code}) does not allow fractional quantities.`);
  }

  if (input.direction === 'Decrease' && !state.settings.allowNegativeStock && product.currentStock < input.quantity) {
    throw new Error(`Cannot decrease stock below zero. Current stock: ${product.currentStock}.`);
  }

  const adjNumber = nextSequenceNumber(state, 'STOCK_ADJUSTMENT');
  const nextId = state.stockMovements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
  const nowIso = new Date().toISOString();

  if (input.direction === 'Increase') {
    product.currentStock = Number((product.currentStock + input.quantity).toFixed(4));
  } else {
    product.currentStock = Number((product.currentStock - input.quantity).toFixed(4));
  }
  product.updatedAt = nowIso;

  const movement: StockMovement = {
    id: nextId,
    productId: product.id,
    movementDate: input.adjustmentDate,
    movementType: input.direction === 'Increase' ? 'AdjustmentIncrease' : 'AdjustmentDecrease',
    referenceType: 'StockAdjustment',
    referenceId: nextId,
    referenceNumber: adjNumber,
    quantity: input.quantity,
    direction: input.direction === 'Increase' ? 'In' : 'Out',
    unitCostMinor: product.purchasePriceMinor,
    description: `${input.reason.trim()}${input.notes ? ' (' + input.notes.trim() + ')' : ''}`,
    notes: input.notes,
    createdAt: nowIso,
  };

  state.stockMovements.push(movement);

  const costMinor = Math.round(input.quantity * product.purchasePriceMinor);
  if (costMinor > 0) {
    postBalancedJournal(state, {
      entryDate: input.adjustmentDate,
      referenceType: 'StockAdjustment',
      referenceId: movement.id,
      referenceNumber: adjNumber,
      description: `Stock ${input.direction.toLowerCase()} ${adjNumber} (${product.name}): ${input.reason}`,
      lines:
        input.direction === 'Increase'
          ? [
              { accountCode: '1100', debitMinor: costMinor, creditMinor: 0, description: 'Inventory adjustment increase' },
              { accountCode: '4100', debitMinor: 0, creditMinor: costMinor, description: 'Inventory gain' },
            ]
          : [
              { accountCode: '5100', debitMinor: costMinor, creditMinor: 0, description: 'Inventory shrinkage/loss' },
              { accountCode: '1100', debitMinor: 0, creditMinor: costMinor, description: 'Inventory adjustment decrease' },
            ],
    });
  }

  return movement;
}

export function createManualCashEntry(
  state: AppDatabaseState,
  input: {
    entryDate: string;
    entryType: 'GeneralExpense' | 'OtherIncome' | 'OwnerCapital' | 'OwnerWithdrawal' | 'CashAdjustment';
    direction?: 'In' | 'Out';
    amountMinor: number;
    paymentMethod: string;
    reference: string;
    description: string;
    notes: string;
  }
): CashTransaction {
  if (input.amountMinor <= 0) {
    throw new Error('Cash entry amount must be greater than zero.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required for manual cash entries.');
  }

  const isIn =
    input.entryType === 'OtherIncome' ||
    input.entryType === 'OwnerCapital' ||
    (input.entryType === 'CashAdjustment' && input.direction !== 'Out');

  const tx = recordCashTransaction(state, {
    transactionDate: input.entryDate,
    transactionType: input.entryType,
    referenceType: 'ManualCash',
    referenceId: null,
    cashInMinor: isIn ? input.amountMinor : 0,
    cashOutMinor: isIn ? 0 : input.amountMinor,
    paymentMethod: input.paymentMethod,
    reference: input.reference,
    description: input.description.trim(),
    notes: input.notes,
  });

  let counterAccount = '5100'; // General Expense
  if (input.entryType === 'OtherIncome') counterAccount = '4100';
  else if (input.entryType === 'OwnerCapital' || input.entryType === 'OwnerWithdrawal') counterAccount = '3000';
  else if (input.entryType === 'CashAdjustment') counterAccount = isIn ? '4100' : '5100';

  postBalancedJournal(state, {
    entryDate: input.entryDate,
    referenceType: 'ManualCash',
    referenceId: tx.id,
    referenceNumber: tx.transactionNumber,
    description: `${input.entryType}: ${input.description.trim()}`,
    lines: isIn
      ? [
          { accountCode: '1000', debitMinor: input.amountMinor, creditMinor: 0, description: 'Cash in' },
          { accountCode: counterAccount, debitMinor: 0, creditMinor: input.amountMinor, description: input.description },
        ]
      : [
          { accountCode: counterAccount, debitMinor: input.amountMinor, creditMinor: 0, description: input.description },
          { accountCode: '1000', debitMinor: 0, creditMinor: input.amountMinor, description: 'Cash out' },
        ],
  });

  return tx;
}

export function cancelTransaction(
  state: AppDatabaseState,
  params: {
    referenceType: 'Sale' | 'Purchase' | 'CustomerReceipt' | 'SupplierPayment';
    referenceId: number;
    reason: string;
  }
): void {
  const reason = params.reason.trim() || 'Operator reversal';
  const today = todayIsoDate();
  const nowIso = new Date().toISOString();

  if (params.referenceType === 'Sale') {
    const sale = state.sales.find((s) => s.id === params.referenceId);
    if (!sale) throw new Error('Sale invoice not found.');
    if (sale.status === 'Cancelled') throw new Error('Sale invoice is already cancelled.');

    sale.status = 'Cancelled';
    sale.cancelReason = reason;

    // Restore stock for each line
    for (const line of sale.lines) {
      const product = state.products.find((p) => p.id === line.productId);
      if (product) {
        product.currentStock = Number((product.currentStock + line.quantity).toFixed(4));
        product.updatedAt = nowIso;
      }
      const movId = state.stockMovements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      state.stockMovements.push({
        id: movId,
        productId: line.productId,
        movementDate: today,
        movementType: 'InvoiceReversal',
        referenceType: 'SaleReversal',
        referenceId: sale.id,
        referenceNumber: sale.invoiceNumber,
        quantity: line.quantity,
        direction: 'In',
        unitCostMinor: line.unitCostMinor,
        description: `Reversal of sale ${sale.invoiceNumber}: ${reason}`,
        notes: reason,
        createdAt: nowIso,
      });
    }

    if (sale.paidAmountMinor > 0) {
      recordCashTransaction(state, {
        transactionDate: today,
        transactionType: 'CashAdjustment',
        referenceType: 'SaleReversal',
        referenceId: sale.id,
        referenceNumber: `${sale.invoiceNumber}-REV`,
        cashInMinor: 0,
        cashOutMinor: sale.paidAmountMinor,
        description: `Cash refunded on cancelled sale ${sale.invoiceNumber}: ${reason}`,
      });
    }

    const origJournal = state.journalEntries.find(
      (j) => j.referenceType === 'Sale' && j.referenceId === sale.id
    );
    if (origJournal) {
      origJournal.status = 'Cancelled';
      postBalancedJournal(state, {
        entryDate: today,
        referenceType: 'SaleReversal',
        referenceId: sale.id,
        referenceNumber: `${sale.invoiceNumber}-REV`,
        description: `Reversal of ${sale.invoiceNumber}: ${reason}`,
        lines: origJournal.lines.map((l) => ({
          accountCode: l.accountCode,
          debitMinor: l.creditMinor,
          creditMinor: l.debitMinor,
          description: `Reversal: ${l.description}`,
        })),
      });
    }
    return;
  }

  if (params.referenceType === 'Purchase') {
    const purchase = state.purchases.find((p) => p.id === params.referenceId);
    if (!purchase) throw new Error('Purchase not found.');
    if (purchase.status === 'Cancelled') throw new Error('Purchase is already cancelled.');

    for (const line of purchase.lines) {
      const product = state.products.find((p) => p.id === line.productId);
      if (product && !state.settings.allowNegativeStock && product.currentStock < line.quantity) {
        throw new Error(
          `Cannot cancel purchase ${purchase.purchaseNumber}: reversing ${line.quantity} of "${product.name}" would make stock negative.`
        );
      }
    }

    purchase.status = 'Cancelled';
    purchase.cancelReason = reason;

    for (const line of purchase.lines) {
      const product = state.products.find((p) => p.id === line.productId);
      if (product) {
        product.currentStock = Number((product.currentStock - line.quantity).toFixed(4));
        product.updatedAt = nowIso;
      }
      const movId = state.stockMovements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      state.stockMovements.push({
        id: movId,
        productId: line.productId,
        movementDate: today,
        movementType: 'InvoiceReversal',
        referenceType: 'PurchaseReversal',
        referenceId: purchase.id,
        referenceNumber: purchase.purchaseNumber,
        quantity: line.quantity,
        direction: 'Out',
        unitCostMinor: line.unitPurchasePriceMinor,
        description: `Reversal of purchase ${purchase.purchaseNumber}: ${reason}`,
        notes: reason,
        createdAt: nowIso,
      });
    }

    if (purchase.paidAmountMinor > 0) {
      recordCashTransaction(state, {
        transactionDate: today,
        transactionType: 'CashAdjustment',
        referenceType: 'PurchaseReversal',
        referenceId: purchase.id,
        referenceNumber: `${purchase.purchaseNumber}-REV`,
        cashInMinor: purchase.paidAmountMinor,
        cashOutMinor: 0,
        description: `Cash recovered on cancelled purchase ${purchase.purchaseNumber}: ${reason}`,
      });
    }

    const origJournal = state.journalEntries.find(
      (j) => j.referenceType === 'Purchase' && j.referenceId === purchase.id
    );
    if (origJournal) {
      origJournal.status = 'Cancelled';
      postBalancedJournal(state, {
        entryDate: today,
        referenceType: 'PurchaseReversal',
        referenceId: purchase.id,
        referenceNumber: `${purchase.purchaseNumber}-REV`,
        description: `Reversal of ${purchase.purchaseNumber}: ${reason}`,
        lines: origJournal.lines.map((l) => ({
          accountCode: l.accountCode,
          debitMinor: l.creditMinor,
          creditMinor: l.debitMinor,
          description: `Reversal: ${l.description}`,
        })),
      });
    }
    return;
  }

  if (params.referenceType === 'CustomerReceipt') {
    const receipt = state.customerReceipts.find((r) => r.id === params.referenceId);
    if (!receipt) throw new Error('Customer receipt not found.');
    if (receipt.status === 'Cancelled') throw new Error('Receipt is already cancelled.');

    receipt.status = 'Cancelled';
    receipt.cancelReason = reason;

    recordCashTransaction(state, {
      transactionDate: today,
      transactionType: 'CashAdjustment',
      referenceType: 'CustomerReceiptReversal',
      referenceId: receipt.id,
      referenceNumber: `${receipt.receiptNumber}-REV`,
      cashInMinor: 0,
      cashOutMinor: receipt.amountMinor,
      description: `Reversal of customer receipt ${receipt.receiptNumber}: ${reason}`,
    });

    postBalancedJournal(state, {
      entryDate: today,
      referenceType: 'CustomerReceiptReversal',
      referenceId: receipt.id,
      referenceNumber: `${receipt.receiptNumber}-REV`,
      description: `Reversal of customer receipt ${receipt.receiptNumber}: ${reason}`,
      lines: [
        { accountCode: '1200', debitMinor: receipt.amountMinor, creditMinor: 0, description: 'Receivable restored' },
        { accountCode: '1000', debitMinor: 0, creditMinor: receipt.amountMinor, description: 'Cash reversed' },
      ],
    });
    return;
  }

  if (params.referenceType === 'SupplierPayment') {
    const payment = state.supplierPayments.find((p) => p.id === params.referenceId);
    if (!payment) throw new Error('Supplier payment not found.');
    if (payment.status === 'Cancelled') throw new Error('Supplier payment is already cancelled.');

    payment.status = 'Cancelled';
    payment.cancelReason = reason;

    recordCashTransaction(state, {
      transactionDate: today,
      transactionType: 'CashAdjustment',
      referenceType: 'SupplierPaymentReversal',
      referenceId: payment.id,
      referenceNumber: `${payment.paymentNumber}-REV`,
      cashInMinor: payment.amountMinor,
      cashOutMinor: 0,
      description: `Reversal of supplier payment ${payment.paymentNumber}: ${reason}`,
    });

    postBalancedJournal(state, {
      entryDate: today,
      referenceType: 'SupplierPaymentReversal',
      referenceId: payment.id,
      referenceNumber: `${payment.paymentNumber}-REV`,
      description: `Reversal of supplier payment ${payment.paymentNumber}: ${reason}`,
      lines: [
        { accountCode: '1000', debitMinor: payment.amountMinor, creditMinor: 0, description: 'Cash restored' },
        { accountCode: '2000', debitMinor: 0, creditMinor: payment.amountMinor, description: 'Payable restored' },
      ],
    });
  }
}
