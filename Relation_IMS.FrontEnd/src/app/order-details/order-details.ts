// src/app/order-details/order-details.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, CommonModule, DecimalPipe } from '@angular/common';
import axios from 'axios';

interface Product {
  Id: number;
  Name: string;
  ImageUrls: string[];
  Description: string;
  BasePrice: number;
  TotalQuantity: number;
  CategoryId: number;
  Category: {
    Id: number;
    Name: string;
    Description: string | null;
  };
  BrandId: number;
  Brand: {
    Id: number;
    Name: string;
  };
}

interface OrderItem {
  Id: number;
  OrderId: number;
  Order: any;
  ProductId: number;
  Product: Product | null;
  Quantity: number;
  UnitPrice: number;
  Subtotal: number;
}

interface Order {
  Id: number;
  CustomerId: number;
  Customer: any;
  OrderItems: OrderItem[];
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
  selector: 'app-order-details',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    CommonModule,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails implements OnInit {
  orderId!: number;
  order: Order | null = null;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.orderId = idParam ? Number(idParam) : 0;

    if (!this.orderId || isNaN(this.orderId)) {
      this.error = 'Invalid order ID.';
      this.loading = false;
      return;
    }

    await this.loadOrderDetails();
  }

  private async loadOrderDetails(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      const response = await axios.get<Order>(
        `https://localhost:7062/api/v1/Order/${this.orderId}`
      );
      
      this.order = response.data;

      // Fetch product details for each order item
      if (this.order.OrderItems && this.order.OrderItems.length > 0) {
        await this.loadProductDetails();
      }

      console.log('✅ Order loaded:', this.order);
    } catch (err: any) {
      console.error('❌ Failed to load order:', err);
      
      if (err.response?.status === 404) {
        this.error = 'Order not found.';
      } else {
        this.error =
          err.response?.data?.message ||
          err.response?.statusText ||
          'Failed to load order details. Please try again later.';
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadProductDetails(): Promise<void> {
    if (!this.order?.OrderItems) return;

    const productPromises = this.order.OrderItems.map(async (item) => {
      try {
        const response = await axios.get<Product>(
          `https://localhost:7062/api/v1/Product/${item.ProductId}`
        );
        item.Product = response.data;
      } catch (err) {
        console.error(`❌ Failed to load product ${item.ProductId}:`, err);
        item.Product = null;
      }
    });

    await Promise.all(productPromises);
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString.startsWith('0001-01-01')) {
      return 'N/A';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
}