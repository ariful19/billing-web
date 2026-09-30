export type PartyType = 'Customer' | 'Supplier' | 'Both';
export type TransactionStatus = 'Draft' | 'Posted' | 'Cancelled';
export type PrintProfile = 'A4' | 'A5' | 'Thermal80' | 'Thermal58';
export type ThemeMode = 'System' | 'Light' | 'Dark';

export type StockMovementType =
  | 'OpeningStock'
  | 'Purchase'
  | 'Sale'
  | 'AdjustmentIncrease'
  | 'AdjustmentDecrease'
  | 'InvoiceReversal';

export type CashTransactionType =
  | 'CashSale'
  | 'CustomerReceipt'
  | 'CashPurchase'
  | 'SupplierPayment'
  | 'GeneralExpense'
  | 'OtherIncome'
  | 'OwnerCapital'
  | 'OwnerWithdrawal'
  | 'CashAdjustment';

export interface Unit {
  id: number;
  code: string;
  name: string;
  allowsFractionalQuantity: boolean;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  categoryId: number | null;
  unitId: number;
  purchasePriceMinor: number;
  sellingPriceMinor: number;
  currentStock: number;
  reorderLevel: number;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: number;
  partyType: PartyType;
  name: string;
  phone: string;
  address: string;
  openingBalanceMinor: number; // Positive for customer receivable or supplier payable
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleLine {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  unitCode: string;
  quantity: number;
  unitPriceMinor: number;
  unitCostMinor: number;
  lineTotalMinor: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  customerName: string;
  saleDate: string;
  status: TransactionStatus;
  totalAmountMinor: number;
  paidAmountMinor: number;
  dueAmountMinor: number;
  previousReceivableMinor: number;
  updatedReceivableMinor: number;
  notes: string;
  cancelReason?: string;
  lines: SaleLine[];
  createdAt: string;
}

export interface HeldSaleLineDraft {
  productId: number;
  quantityText: string;
  unitPriceText: string;
}

export interface HeldSale {
  id: string;
  displayName: string;
  customerId: number | null;
  saleDate: string;
  paidAmountText: string;
  notes: string;
  lines: HeldSaleLineDraft[];
  createdAt: string;
}

export interface PurchaseLine {
  id: number;
  purchaseId: number;
  productId: number;
  productName: string;
  unitCode: string;
  quantity: number;
  unitPurchasePriceMinor: number;
  lineTotalMinor: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  supplierInvoiceNumber: string;
  purchaseDate: string;
  status: TransactionStatus;
  totalAmountMinor: number;
  paidAmountMinor: number;
  dueAmountMinor: number;
  previousPayableMinor: number;
  updatedPayableMinor: number;
  notes: string;
  cancelReason?: string;
  lines: PurchaseLine[];
  createdAt: string;
}

export interface CustomerReceipt {
  id: number;
  receiptNumber: string;
  customerId: number;
  customerName: string;
  receiptDate: string;
  status: TransactionStatus;
  amountMinor: number;
  previousBalanceMinor: number;
  updatedBalanceMinor: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  cancelReason?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: number;
  paymentNumber: string;
  supplierId: number;
  supplierName: string;
  paymentDate: string;
  status: TransactionStatus;
  amountMinor: number;
  previousBalanceMinor: number;
  updatedBalanceMinor: number;
  paymentMethod: string;
  reference: string;
  notes: string;
  cancelReason?: string;
  createdAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  movementDate: string;
  movementType: StockMovementType;
  referenceType: string;
  referenceId: number | null;
  referenceNumber: string;
  quantity: number;
  direction: 'In' | 'Out';
  unitCostMinor: number;
  description: string;
  notes: string;
  createdAt: string;
}

export interface CashTransaction {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  transactionType: CashTransactionType;
  referenceType: string;
  referenceId: number | null;
  referenceNumber: string;
  cashInMinor: number;
  cashOutMinor: number;
  paymentMethod: string;
  reference: string;
  description: string;
  notes: string;
  createdAt: string;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  normalBalance: 'Debit' | 'Credit';
  isSystem: boolean;
}

export interface JournalLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debitMinor: number;
  creditMinor: number;
  description: string;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  referenceType: string;
  referenceId: number | null;
  referenceNumber: string;
  description: string;
  status: TransactionStatus;
  lines: JournalLine[];
  createdAt: string;
}

export interface NumberSequence {
  key: string;
  prefix: string;
  nextValue: number;
  paddingWidth: number;
}

export interface CompanySettings {
  companyName: string;
  storeTagline?: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  currencyCode: string;
  invoicePrefix: string;
  purchasePrefix: string;
  allowNegativeStock: boolean;
  allowSalePriceEditing: boolean;
  requireCustomerForCreditSale: boolean;
  defaultPaymentMethod: 'Cash' | 'Card' | 'Mobile';
  costingMethod: 'WeightedAverage';
  defaultPrintProfile: PrintProfile;
  logoPath: string;
  footerNote: string;
  showPreviousDueOnSalesInvoice: boolean;
  theme: ThemeMode;
  adminUsername?: string;
  adminPassword?: string;
  requireLoginOnStart?: boolean;
}

export interface AppDatabaseState {
  units: Unit[];
  categories: Category[];
  products: Product[];
  parties: Party[];
  sales: Sale[];
  heldSales: HeldSale[];
  purchases: Purchase[];
  customerReceipts: CustomerReceipt[];
  supplierPayments: SupplierPayment[];
  stockMovements: StockMovement[];
  cashTransactions: CashTransaction[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  sequences: Record<string, NumberSequence>;
  settings: CompanySettings;
}

export type NavTab =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'products'
  | 'parties'
  | 'stock'
  | 'cashbook'
  | 'reports'
  | 'settings';
