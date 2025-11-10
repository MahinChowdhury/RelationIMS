import { NgFor, NgIf, KeyValuePipe } from '@angular/common';
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
interface Brand {
  Id : number;
  Name : string;
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
  BrandId : number;
  Brand : Brand; 
  ImageUrls: string[];
  Variants: Variant[];
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, FormsModule, KeyValuePipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  productId!: number;
  productDetail: Product | null = null;
  editingStockIndex: number | null = null;
  editedStock = { quantity: 0 };
  categories:Category[] = [];
  selectedImage: string = ''; 
  TotalQuantity : number = 0;

  constructor(private route: ActivatedRoute) {}

  async ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    await Promise.all([this.loadProductDetail()]);
  }

  async loadProductDetail() {
    try {
      const res = await axios.get<Product>(`https://localhost:7062/api/v1/Product/${this.productId}`);
      this.productDetail = res.data;
      
      // NEW: Set first image as default selected image
      if (this.productDetail.ImageUrls && this.productDetail.ImageUrls.length > 0) {
        this.selectedImage = this.productDetail.ImageUrls[0];
      }
      
      console.log('🟢 Loaded product detail:', this.productDetail);
    } catch (err) {
      console.error(`❌ Failed to load product details of id ${this.productId}:`, err);
    }
  }

  // NEW: Method to select image
  selectImage(image: string) {
    this.selectedImage = image;
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
        BrandId: this.productDetail.BrandId,
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
      this._lastVariantsHash = '';
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

  groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
    const map = new Map<K, T[]>();
    for (const item of array) {
      const key = keyFn(item);
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    }
    return map;
  }
  
  private _groupedVariantsCache = new Map<number | undefined, Variant[]>();
  private _lastVariantsHash = '';

  // ---------- inside the component ----------
  groupedVariants(): Map<number | undefined, Variant[]> {
    if (!this.productDetail?.Variants) {
      this._groupedVariantsCache.clear();
      return this._groupedVariantsCache;
    }

    // Create a simple hash of the variants array (based on Id + Quantity)
    const currentHash = this.productDetail.Variants
      .map(v => `${v.Id}-${v.Quantity}`)
      .sort()
      .join('|');

    // Only recompute if variants changed
    if (currentHash !== this._lastVariantsHash) {
      this._lastVariantsHash = currentHash;
      this._groupedVariantsCache = this.groupBy(this.productDetail.Variants, v => v.Color?.Id);
    }

    return this._groupedVariantsCache;
  }
  variantIdx(variant: Variant): number {
    return this.productDetail?.Variants.findIndex(v => v.Id === variant.Id) ?? -1;
  }
  
}