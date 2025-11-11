
export interface VendorInfo {
  name: string;
  address: string;
  city: string;
  siret: string;
  tva: string;
  phone: string;
  email: string;
  website: string;
}

export interface ClientInfo {
  address: string;
  city: string;
}

export interface BankInfo {
  bank: string;
  iban: string;
  bic: string;
}

export interface InvoiceItem {
  name: string;
  ref?: string;
  qty: number;
  unit?: string;
  price: number;
  category?: string;
  confidence?: number;
  taxRate?: number;
}

export interface InvoiceData {
  buyerName: string;
  invoiceRef: string;
  invoiceDate: Date;
  subTotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
  vendorInfo: VendorInfo;
  clientInfo: ClientInfo;
  bankInfo: BankInfo;
  dueDate?: Date;
  paymentTerms?: string;
  reference?: string;
  additionalInfo?: string;
}
