// src/app/customers/customers.ts
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Customer {
  Id: number;
  Name: string;
  Phone: string;
  Email: string;
  Address: string;
  Orders: any[];
  CreatedDate: string;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css'
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filtered: Customer[] = [];

  placeholderImage = 'https://via.placeholder.com/80x80.png?text=No+Image';

  searchTerm = '';
  private searchTimeout: any;

  page = 1;
  loading = false;
  @ViewChild('anchor', { static: false }) anchor!: ElementRef<HTMLElement>;
  observer!: IntersectionObserver;

  // Modals
  showDeleteModal = false;
  customerToDelete: number | null = null;

  showEditModal = false;
  showCreateModal = false;

  // Add/Edit Forms
  addableCustomer: any = {
    Id: null,
    Name: '',
    Phone: '',
    Email: '',
    Address: ''
  };

  editCustomer: any = {
    Id: null,
    Name: '',
    Phone: '',
    Email: '',
    Address: ''
  };

  // Sorting & Filtering
  sortBy: 'orderFrequency' | 'lastOrderDate' | '' = '';
  selectedOrderFilter: 'all' | 'frequent' | 'recent' = 'all';

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadCustomers(true);
  }

  ngAfterViewInit() {
    const options = { root: null, rootMargin: '0px', threshold: 1.0 };
    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && !this.loading) {
        this.page++;
        this.loadCustomers();
      }
    }, options);

    if (this.anchor) this.observer.observe(this.anchor.nativeElement);
  }

  onFilterChange() {
    this.loadCustomers(true);
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadCustomers(true);
    }, 300);
  }

  async loadCustomers(reset: boolean = false) {
    if (reset) {
      this.page = 1;
      this.customers = [];
      this.filtered = [];
    }

    this.loading = true;
    try {
      const params = new URLSearchParams({
        search: this.searchTerm || '',
        sortBy: this.sortBy || '',
        pageNumber: this.page.toString(),
        pageSize: '20'
      });

      const res = await axios.get(`https://localhost:7062/api/v1/Customer?${params.toString()}`);
      const newCustomers = res.data;

      this.customers = reset ? newCustomers : [...this.customers, ...newCustomers];
      this.applyFilters();
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let list = [...this.customers];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.Name.toLowerCase().includes(term) ||
        c.Email.toLowerCase().includes(term) ||
        c.Phone.includes(term)
      );
    }

    if (this.sortBy === 'orderFrequency') {
      list.sort((a, b) => b.Orders.length - a.Orders.length);
    } else if (this.sortBy === 'lastOrderDate') {
      list.sort((a, b) => {
        const getLast = (cust: Customer) => {
          if (!cust.Orders.length) return new Date(cust.CreatedDate).getTime();
          const last = cust.Orders[cust.Orders.length - 1];
          return new Date(last.date || cust.CreatedDate).getTime();
        };
        return getLast(b) - getLast(a);
      });
    }

    this.filtered = list;
  }

  // --- MODAL: CREATE ---
  openCreateModal() {
    this.addableCustomer = { Name: '', Phone: '', Email: '', Address: '' };
    this.showCreateModal = true;
  }

  cancelCreate() {
    this.showCreateModal = false;
  }

  async addCustomerConfirm() {
    try {
      const payload = { ...this.addableCustomer };
      const res = await axios.post('https://localhost:7062/api/v1/Customer', payload);
      console.log('Customer created:', res.data);

      await this.loadCustomers(true);
      this.showCreateModal = false;
    } catch (err: any) {
      console.error('Failed to add customer:', err);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  }

  // --- MODAL: EDIT ---
  async openEditModal(customer: Customer) {
    this.editCustomer = { ...customer };
    this.showEditModal = true;
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editCustomer = { Id: null, Name: '', Phone: '', Email: '', Address: '' };
  }

  async saveEdit() {
    if (!this.editCustomer.Id) return;

    try {
      const payload = {
        Name: this.editCustomer.Name,
        Phone: this.editCustomer.Phone,
        Email: this.editCustomer.Email,
        Address: this.editCustomer.Address
      };

      await axios.put(`https://localhost:7062/api/v1/Customer/${this.editCustomer.Id}`, payload);
      console.log('Customer updated');

      await this.loadCustomers(true);
      this.showEditModal = false;
    } catch (err: any) {
      console.error('Failed to update:', err);
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    }
  }

  // --- MODAL: DELETE ---
  confirmDelete(id: number) {
    this.customerToDelete = id;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.customerToDelete = null;
  }

  async deleteCustomer() {
    if (!this.customerToDelete) return;

    this.loading = true;
    try {
      await axios.delete(`https://localhost:7062/api/v1/Customer/${this.customerToDelete}`);
      this.customers = this.customers.filter(c => c.Id !== this.customerToDelete);
      this.applyFilters();
      this.showDeleteModal = false;
      this.customerToDelete = null;
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete customer.');
    } finally {
      this.loading = false;
    }
  }

  // --- NAVIGATION ---
  navigateToDetail(id: number) {
    this.router.navigate(['/customers', id]);
  }

  // --- UTILS ---
  getOrderCount(customer: Customer): number {
    return customer.Orders?.length || 0;
  }

  getLastOrderDate(customer: Customer): string {
    if (!customer.Orders?.length) return '—';
    const last = customer.Orders[customer.Orders.length - 1];
    return new Date(last.date || customer.CreatedDate).toLocaleDateString();
  }

}