import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute,Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, CommonModule, DecimalPipe } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import axios from 'axios';

interface Customer {
  Id: number;
  Name: string;
  Phone: string;
  Email?: string;
  Address: string;
  Orders?: Order[];
  CreatedDate?: string;
}

interface Order {
  Id: number;
  CustomerId: number;
  TotalAmount: number;
  Discount: number;
  NetAmount: number;
  PaymentStatus: PaymentStatus;
  UserId: number;
  Remarks?: string;
  CreatedAt: string;
}

enum PaymentStatus {
  Pending = 0,
  Partial = 1,
  Paid = 2,
}

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    CommonModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.css',
})
export class CustomerDetails {
  customerId!: number;
  customer: Customer | null = null;
  orders: Order[] = [];
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.customerId = idParam ? Number(idParam) : 0;

    if (!this.customerId || isNaN(this.customerId)) {
      this.error = 'Invalid customer ID.';
      this.loading = false;
      return;
    }

    await this.loadCustomerData();
  }

  private async loadCustomerData(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      const custRes = await axios.get<Customer>(
        `https://localhost:7062/api/v1/Customer/${this.customerId}`
      );
      this.customer = custRes.data;

      const ordRes = await axios.get<Order[]>(
        `https://localhost:7062/api/v1/Order/customer/${this.customerId}`
      );
      this.orders = ordRes.data ?? [];

      console.log('Customer loaded:', this.customer);
      console.log('Orders loaded:', this.orders.length, 'orders');
    } catch (err: any) {
      console.error('Failed to load data:', err);
      this.error =
        err.response?.data?.message ||
        'Failed to load customer data. Please try again later.';
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getPaymentStatusText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Pending:
        return 'Pending';
      case PaymentStatus.Partial:
        return 'Partial';
      case PaymentStatus.Paid:
        return 'Paid';
      default:
        return 'Unknown';
    }
  }

  getTotalSpent(): number {
    return this.orders.reduce((sum, o) => sum + o.NetAmount, 0);
  }

  getAverageOrder(): number {
    return this.orders.length ? this.getTotalSpent() / this.orders.length : 0;
  }

  /** Copy text to clipboard – works in browser only */
  async copyToClipboard(text: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      await navigator.clipboard.writeText(text);
      // optional toast: this.toastr.success('Copied!');
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }
}