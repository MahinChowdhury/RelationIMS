// src/app/orders/orders.component.ts
import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import axios from 'axios';

interface Customer {
  Id: number;
  Name: string;
  Phone: string;
  Email: string;
  Address: string;
  Orders: any[];
  CreatedDate: string;
}

interface Order {
  Id: number;
  CustomerId: number;
  Customer: Customer | null;
  OrderItems: any[];
  TotalAmount: number;
  Discount: number;
  NetAmount: number;
  PaymentStatus: PaymentStatus;
  UserId: number;
  User: any;
  Remarks?: string;
  CreatedAt: string;
}

enum PaymentStatus {
  Pending = 0,
  Partial = 1,
  Paid = 2,
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    CommonModule,
    RouterLink,
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersComponent implements OnInit, AfterViewInit {
  orders: Order[] = [];
  filtered: Order[] = [];
  loading = false;
  
  searchTerm = '';
  private searchTimeout: any;
  
  page = 1;
  pageSize = 20;
  
  sortBy: 'date' | 'amount' | '' = '';
  filterStatus: 'all' | 'paid' | 'pending' = 'all';

  @ViewChild('anchor', { static: false }) anchor!: ElementRef<HTMLElement>;
  observer!: IntersectionObserver;

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.loadOrders(true);
  }

  ngAfterViewInit(): void {
    const options = { 
      root: null, 
      rootMargin: '0px', 
      threshold: 1.0 
    };
    
    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && !this.loading) {
        this.page++;
        this.loadOrders();
      }
    }, options);

    if (this.anchor) {
      this.observer.observe(this.anchor.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  onFilterChange(): void {
    this.loadOrders(true);
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadOrders(true);
    }, 300);
  }

  private async loadOrders(reset: boolean = false): Promise<void> {
    if (reset) {
      this.page = 1;
      this.orders = [];
      this.filtered = [];
    }

    this.loading = true;
    try {
      const response = await axios.get<Order[]>(
        `https://localhost:7062/api/v1/Order?pageNumber=${this.page}&pageSize=${this.pageSize}`
      );

      const newOrders = response.data ?? [];
      
      // Prevent duplicates by checking existing IDs
      if (reset) {
        this.orders = newOrders;
      } else {
        const existingIds = new Set(this.orders.map(o => o.Id));
        const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.Id));
        this.orders = [...this.orders, ...uniqueNewOrders];
      }
      
      this.applyFilters();

      console.log('✅ Orders loaded:', newOrders.length, 'new orders, Total:', this.orders.length);
    } catch (err: any) {
      console.error('❌ Failed to load orders:', err);
    } finally {
      this.loading = false;
    }
  }

  private applyFilters(): void {
    let list = [...this.orders];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(
        (order) =>
          order.Id.toString().includes(term) ||
          order.CustomerId.toString().includes(term) ||
          order.Customer?.Name?.toLowerCase().includes(term) ||
          order.Customer?.Phone?.includes(term) ||
          order.Customer?.Email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.filterStatus === 'paid') {
      list = list.filter(o => o.PaymentStatus === PaymentStatus.Paid);
    } else if (this.filterStatus === 'pending') {
      list = list.filter(o => o.PaymentStatus === PaymentStatus.Pending);
    }

    // Sorting
    if (this.sortBy === 'date') {
      list.sort((a, b) => {
        const dateA = new Date(a.CreatedAt).getTime();
        const dateB = new Date(b.CreatedAt).getTime();
        return dateB - dateA; // Newest first
      });
    } else if (this.sortBy === 'amount') {
      list.sort((a, b) => b.NetAmount - a.NetAmount); // Highest first
    }

    this.filtered = list;
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString.startsWith('0001-01-01')) {
      return 'N/A';
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }
}