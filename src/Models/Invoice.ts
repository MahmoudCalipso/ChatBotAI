export interface InvoiceItem {
  category?: string;
  confidence?: number;
  name: string;
  ref: string;
  qty: number;
  price: number;
}

export interface InvoiceData {
  buyerName: string;
  invoiceRef: string;
  invoiceDate: Date;
  subTotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
}
