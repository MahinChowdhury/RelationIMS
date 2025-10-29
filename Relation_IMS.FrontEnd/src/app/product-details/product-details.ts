import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import axios from 'axios';
import { FormsModule } from '@angular/forms';

// ---------- Interfaces ----------
interface Color {
  Id: number;
  Name: string;
  HexCode: string;
}
interface Size {
  Id: number;
  Name: string;
  CategoryId: number;
}
interface Variant {
  Id: number;
  ProductId: number;
  ProductColorId: number;
  ProductSizeId: number;
  Quantity: number;
  VariantPrice: number;
  Color?: Color;
  Size?: Size;
}
interface Category {
  Id: number;
  Name: string;
  Description: string;
}
interface Product {
  Id: number;
  Name: string;
  Description: string;
  BasePrice: number;
  CategoryId: number;
  Category : Category;
  TotalQuantity:number;
  BrandName: string;
  ImageUrls: string[];
  Variants: Variant[];
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  productId!: number;
  productDetail: Product | null = null;
  editingStockIndex: number | null = null;
  editedStock = { quantity: 0 };
  categories:Category[] = [];

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    await Promise.all([this.loadProductDetail()]);
  }

  async loadProductDetail() {
    try {
      const res = await axios.get<Product>(`https://localhost:7062/api/v1/Product/${this.productId}`);
      this.productDetail = res.data;
      console.log('🟢 Loaded product detail:', this.productDetail);
    } catch (err) {
      console.error(`❌ Failed to load product details of id ${this.productId}:`, err);
    }
  }


  editStockRow(index: number, variant: Variant) {
    this.editingStockIndex = index;
    this.editedStock = { quantity: variant.Quantity };
  }

  async saveEditedStock(index: number) {
    if (!this.productDetail || this.editedStock.quantity < 0) return;

    const prevQuantity = this.productDetail.Variants[index].Quantity;
    this.productDetail.Variants[index].Quantity = this.editedStock.quantity;

    try {
      // Build variants payload (same convention as Products component)
      const variantsPayload = this.productDetail.Variants.map(v => ({
        Id: v.Id ?? 0,
        ProductId: this.productDetail!.Id,
        ProductColorId: v.ProductColorId,
        ProductSizeId: v.ProductSizeId,
        Quantity: v.Quantity,
        VariantPrice: this.productDetail!.BasePrice,
      }));

      const finalImageUrls = Array.isArray(this.productDetail.ImageUrls)
        ? [...this.productDetail.ImageUrls]
        : [];

      // Build request body (follows same conventions)
      const requestBody = {
        Name: this.productDetail.Name,
        Description: this.productDetail.Description,
        BasePrice: this.productDetail.BasePrice,
        CategoryId: this.productDetail.CategoryId,
        BrandName: this.productDetail.BrandName,
        ImageUrls: finalImageUrls,
        Variants: variantsPayload,
      };

      // PUT request to update the product
      await axios.put(
        `https://localhost:7062/api/v1/Product/${this.productDetail.Id}`,
        requestBody
      );

      console.log('✅ Stock updated successfully:', requestBody);
      this.editingStockIndex = null;
    } catch (err) {
      // rollback
      this.productDetail.Variants[index].Quantity = prevQuantity;
      console.error('❌ Failed to update stock:', err);
    }
  }

  cancelStockEdit() {
    this.editingStockIndex = null;
  }

  getStockStatus(){
    return this.productDetail!.TotalQuantity > 0;
  }
}
