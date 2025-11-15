import { Component, OnInit , ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import axios from 'axios';
import { NgFor, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner';

@Component({
  selector: 'app-products',
  imports: [NgFor, NgIf, FormsModule,BarcodeScannerComponent],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {

  products: any[] = [];
  colors: any[] = [];
  categories: any[] = [];
  brands: any[] = [];

  placeholderImage: string =
    'https://via.placeholder.com/80x80.png?text=No+Image';

  searchTerm: string = '';
  private searchTimeout: any;
  constructor(private router: Router) {}

  page = 1;
  loading = false;
  @ViewChild('anchor', { static: false }) anchor!: ElementRef<HTMLElement>;
  observer!: IntersectionObserver;
  showDeleteModal = false;
  productToDelete: number | null = null;

  // Edit modal
  showEditModal = false;
  showCreateModal = false;

  // Barcode scanner modal
  showBarcodeScanner = false;
  scannerEnabled = false;

  addableProduct: any = {
    Id: null,
    Name: '',
    Description: '',
    BasePrice: 0,
    CategoryId: 0,
    BrandId: 0,
  };

  editProduct: any = {
    Id: null,
    Name: '',
    Description: '',
    BasePrice: 0,
    CategoryId: 0,
    BrandId: 0,
  };

  sortBy: string = '';
  selectedCategory: string = '';
  selectedBrand: string = '';
  stockOrder: string = '';

  // --- image handling (edit modal) ---
  editSelectedImages: string[] = [];
  editImageFiles: File[] = [];
  @ViewChild('editImageInput') editImageInput!: ElementRef<HTMLInputElement>;

  async ngOnInit() {
    await Promise.all([this.loadProducts(), this.loadCategories(), this.loadColors(), this.loadBrands()]);
  }

  ngAfterViewInit() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    };

    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && !this.loading) {
        this.page++;
        this.loadProducts();
      }
    }, options);

    if (this.anchor) {
      this.observer.observe(this.anchor.nativeElement);
    }
  }

  onFilterChange() {
    this.loadProducts(true);
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts(true);
    }, 300);
  }

  async loadProducts(reset: boolean = false) {
    if (reset) {
      this.page = 1;
      this.products = [];
    }

    this.loading = true;
    try {
      const params = new URLSearchParams({
        search: this.searchTerm || '',
        sortBy: this.sortBy || '',
        stockOrder: this.stockOrder || '',
        categoryId: this.selectedCategory ? this.selectedCategory.toString() : '-1',
        BrandId: this.selectedBrand ? this.selectedBrand.toString() : '-1',
        pageNumber: this.page.toString(),
        pageSize: '20',
      });

      const res = await axios.get(`https://localhost:7062/api/v1/Product?${params.toString()}`);
      
      this.products.push(...res.data);
      console.log(this.products);
    } catch (error) {
      console.error('❌ Failed to load products:', error);
    }
    this.loading = false;
  }

  async loadCategories() {
    try {
      const res = await axios.get('https://localhost:7062/api/v1/Category');
      this.categories = res.data.map((cat: any) => ({
        id: cat.Id,
        name: cat.Name,
        description: cat.Description
      }));
    } catch (err) {
      console.error('❌ Failed to load categories:', err);
    }
  }

  async loadBrands() {
    try {
      const res = await axios.get('https://localhost:7062/api/v1/Brand');
      this.brands = res.data.map((b: any) => ({
        Id: b.Id,
        Name: b.Name,
      }));
      console.log('Brands', this.brands);
    } catch (err) {
      console.error('❌ Failed to load brands:', err);
    }
  }

  async loadColors() {
    try {
      const res = await axios.get('https://localhost:7062/api/v1/ProductVariantColors');
      this.colors = res.data.map((c: any) => ({
        id: c.Id,
        name: c.Name,
        hex: c.HexCode
      }));
    } catch (err) {
      console.error('❌ Failed to load colors:', err);
    }
  }

  getCategoryNameById(id: number): string {
    const category = this.categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  }

  // ============ BARCODE SCANNER ============
  openBarcodeScanner() {
    this.showBarcodeScanner = true;
    this.scannerEnabled = true;
  }

  closeBarcodeScanner() {
    this.scannerEnabled = false;
    this.showBarcodeScanner = false;
  }

  onBarcodeScanned(barcode: string) {
    console.log('✅ Barcode scanned:', barcode);
    this.closeBarcodeScanner();
    this.router.navigate(['/products', barcode]);
  }

  onScanError(error: any) {
    console.error('❌ Scan error:', error);
  }

  // ---- EDIT MODAL ----
  async openEditModal(product: any) {
    this.editProduct = {
      Id: product.Id,
      Name: product.Name,
      Description: product.Description,
      BasePrice: product.BasePrice,
      CategoryId: product.CategoryId ?? product.Category?.Id ?? 0,
      BrandId: product.BrandId
    };
    this.editSelectedImages = product.ImageUrls ? [...product.ImageUrls] : [];
    this.editImageFiles = [];

    await this.onCategoryChange(this.editProduct.CategoryId);

    try {
      const res = await axios.get(`https://localhost:7062/api/v1/ProductVariants/product/${this.editProduct.Id}`);
      
      this.stockItems = res.data.map((variant: any) => {
        const color = this.colors.find(c => c.id === variant.ProductColorId);
        const size = this.availableSizes.find(s => s.id === variant.ProductSizeId);

        return {
          id: variant.Id,
          color: color ? color.name : `Color #${variant.ProductColorId}`,
          size: size ? size.name : `Size #${variant.ProductSizeId}`,
          quantity: variant.Quantity,
        };
      });

      console.log('🟩 Loaded stockItems:', this.stockItems);

    } catch (err) {
      console.error("Failed to load variants on Edit Modal");
      this.stockItems = [];
    }

    this.showEditModal = true;
  }

  onEditImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files) as File[];

    files.forEach(file => {
      this.editImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.editSelectedImages.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeEditImage(img: string) {
    const idx = this.editSelectedImages.indexOf(img);
    if (idx === -1) return;

    if (!img.startsWith('http')) {
      this.editImageFiles.splice(idx, 1);
    }

    this.editSelectedImages.splice(idx, 1);
    if (this.editImageInput) this.editImageInput.nativeElement.value = '';
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editProduct = {
      Id: null,
      Name: '',
      Description: '',
      BasePrice: 0,
      CategoryId: 0,
      BrandId: 0,
    };
    this.editSelectedImages = [];
    this.editImageFiles = [];
    if (this.editImageInput) this.editImageInput.nativeElement.value = '';
    this.stockItems = [];
  }

  cancelCreate() {
    this.showCreateModal = false;
    this.addableProduct = {
      Id: null,
      Name: '',
      Description: '',
      BasePrice: 0,
      CategoryId: 0,
      BrandId: 0
    };

    this.selectedImages = [];
    this.imageFiles = [];

    if (this.imageInput) this.imageInput.nativeElement.value = '';
    this.stockItems = [];
  }

  async saveEdit() {
    if (!this.editProduct.Id) return;

    try {
      const newImageUrls: string[] = [];
      if (this.editImageFiles.length > 0) {
        for (const file of this.editImageFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const res = await axios.post(
            'https://localhost:7062/api/v1/Blob/upload',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          newImageUrls.push(res.data);
        }
      }

      const existingUrls = this.editSelectedImages.filter(img => img.startsWith('http'));
      const finalImageUrls = [...existingUrls, ...newImageUrls];

      for (const variantId of this.deletedVariantIds) {
        try {
          await axios.delete(`https://localhost:7062/api/v1/ProductVariants/${variantId}`);
          console.log(`Deleted variant ${variantId}`);
        } catch (err) {
          console.error(`Failed to delete variant ${variantId}`, err);
        }
      }
      this.deletedVariantIds = [];

      for (const item of this.stockItems) {
        if (item.id && item.id !== 0) {
          const color = this.colors.find(c => c.name === item.color);
          const size = this.availableSizes.find(s => s.name === item.size);

          if (!color || !size) continue;

          const payload = {
            Id: item.id,
            ProductId: this.editProduct.Id,
            ProductColorId: color.id,
            ProductSizeId: size.id,
            VariantPrice: this.editProduct.BasePrice,
            Quantity: item.quantity
          };

          try {
            await axios.put(`https://localhost:7062/api/v1/ProductVariants/${item.id}`, payload);
            console.log(`Updated variant ${item.id}`);
          } catch (err) {
            console.error(`Failed to update variant ${item.id}`, err);
          }
        }
      }

      const productUpdatePayload = {
        Name: this.editProduct.Name,
        Description: this.editProduct.Description,
        BasePrice: this.editProduct.BasePrice,
        CategoryId: this.editProduct.CategoryId,
        BrandId: this.editProduct.BrandId,
        ImageUrls: finalImageUrls
      };

      await axios.put(
        `https://localhost:7062/api/v1/Product/${this.editProduct.Id}`,
        productUpdatePayload
      );

      console.log('✅ Product updated successfully');

      await this.loadProducts(true);

      this.stockItems = [];
      this.editSelectedImages = [];
      this.editImageFiles = [];
      this.editingStockIndex = null;
      this.showEditModal = false;

    } catch (err: any) {
      console.error('Failed to update product:', err);
      alert('Failed to update product: ' + (err.response?.data?.message || err.message));
    }
  }

  async addProductConfirm() {
    try {
      const imageUrls: string[] = [];

      if (this.imageFiles.length > 0) {
        for (const file of this.imageFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadRes = await axios.post(
            `https://localhost:7062/api/v1/Blob/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );

          imageUrls.push(uploadRes.data);
        }
      }

      const payload = {
        Name: this.addableProduct.Name?.trim(),
        Description: this.addableProduct.Description?.trim(),
        BasePrice: this.addableProduct.BasePrice ?? 0,
        CategoryId: this.addableProduct.CategoryId,
        BrandId: this.addableProduct.BrandId,
        ImageUrls: imageUrls,
      };

      const res = await axios.post(`https://localhost:7062/api/v1/Product`, payload);
      const productId = res.data.id || res.data.Id;

      console.log('✅ Product created with ID:', productId);

      if (productId && this.stockItems.length > 0) {
        for (const stock of this.stockItems) {
          const color = this.colors.find(c => c.name === stock.color);
          const size = this.availableSizes.find(s => s.name === stock.size);

          if (!color || !size) {
            console.warn(`⚠️ Skipped variant - missing color or size`, stock);
            continue;
          }

          const variantPayload = {
            ProductId: productId,
            ProductColorId: color.id,
            ProductSizeId: size.id,
            VariantPrice: this.addableProduct.BasePrice ?? 0,
            Quantity: stock.quantity
          };

          await axios.post(`https://localhost:7062/api/v1/ProductVariants`, variantPayload);
        }

        console.log('✅ All product variants added successfully.');
      }

      await this.loadProducts(true);

      this.showCreateModal = false;
      this.addableProduct = {
        Name: '',
        Description: '',
        BasePrice: 0,
        CategoryId: '',
        BrandId: 0,
      };
      this.selectedImages = [];
      this.imageFiles = [];
      this.stockItems = [];
      this.newStock = { color: '', size: '', quantity: 0 };
      if (this.imageInput) this.imageInput.nativeElement.value = '';

    } catch (err) {
      console.error('❌ Failed to add product or variants:', err);
      alert('❌ Failed to add product or variants.');
    }
  }

  // Delete Section
  confirmDelete(id: number) {
    this.productToDelete = id;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  async deleteProduct() {
    if (!this.productToDelete) return;

    this.loading = true;
    try {
      await axios.delete(`https://localhost:7062/api/v1/Product/${this.productToDelete}`);
      this.products = this.products.filter(p => p.Id !== this.productToDelete);
      this.showDeleteModal = false;
      this.productToDelete = null;
    } catch (err) {
      console.error('Delete failed:', err);
      alert('❌ Failed to delete product.');
    } finally {
      this.loading = false;
    }
  }

  // Images section
  selectedImages: string[] = [];
  imageFiles: File[] = [];
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files) as File[];

    files.forEach(file => {
      this.imageFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.selectedImages.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(img: string) {
    const index = this.selectedImages.indexOf(img);
    if (index > -1) {
      this.selectedImages.splice(index, 1);
      this.imageFiles.splice(index, 1);

      if (this.imageInput) this.imageInput.nativeElement.value = '';
    }
  }

  // Stock Management
  stockItems: { 
    id?: number;
    color: string; 
    size: string; 
    quantity: number 
  }[] = [];
  newStock = { color: '', size: '', quantity: 0 };
  availableSizes: any[] = [];
  deletedVariantIds: number[] = [];

  async onCategoryChange(newCategoryId: number) {
    const categoryId = Number(newCategoryId);

    try {
      const res = await axios.get(
        `https://localhost:7062/api/v1/ProductVariantSizes/category/${categoryId}`
      );
      this.availableSizes = res.data.map((s: any) => ({
        id: s.Id,
        name: s.Name,
      }));

      console.log('sizes', res.data);
    } catch (err) {
      console.error('❌ Failed to load sizes:', err);
      this.availableSizes = [];
    }
  }

  addStock() {
    if (!this.newStock.color || !this.newStock.size || this.newStock.quantity <= 0) return;

    const exists = this.stockItems.find(
      s => s.color === this.newStock.color && s.size === this.newStock.size
    );
    if (exists) {
      exists.quantity = this.newStock.quantity;
    } else {
      this.stockItems.push({ ...this.newStock });
    }

    this.newStock = { color: '', size: '', quantity: 0 };
  }

  async addEditStock() {
    if (!this.newStock.color || !this.newStock.size || this.newStock.quantity <= 0) {
      alert('Please select color, size, and enter a valid quantity.');
      return;
    }

    try {
      const exists = this.stockItems.find(
        s => s.color === this.newStock.color && s.size === this.newStock.size
      );
      if (exists) {
        exists.quantity = this.newStock.quantity;
        return;
      }

      const color = this.colors.find(c => c.name === this.newStock.color);
      const size = this.availableSizes.find(s => s.name === this.newStock.size);

      if (!color || !size) {
        alert('Invalid color or size selected.');
        return;
      }

      const payload = {
        ProductId: this.editProduct.Id,
        ProductColorId: color.id,
        ProductSizeId: size.id,
        VariantPrice: this.editProduct.BasePrice,
        Quantity: this.newStock.quantity
      };

      const res = await axios.post('https://localhost:7062/api/v1/ProductVariants', payload);
      const createdVariant = res.data;

      this.stockItems.push({
        id: createdVariant.Id,
        color: this.newStock.color,
        size: this.newStock.size,
        quantity: this.newStock.quantity
      });

      console.log('Variant created successfully:', createdVariant);

      this.newStock = { color: '', size: '', quantity: 0 };

    } catch (err: any) {
      console.error('Failed to create variant:', err);
      alert('Failed to add variant: ' + (err.response?.data?.message || err.message));
    }
  }

  removeStock(index: number) {
    const item = this.stockItems[index];

    if (item && 'id' in item && typeof (item as any).id === 'number') {
      this.deletedVariantIds.push((item as any).id);
    }

    this.stockItems.splice(index, 1);
  }

  editStock(index: number) {
    const stock = this.stockItems[index];
    this.newStock = { ...stock };
    this.stockItems.splice(index, 1);
  }

  onStockInlineChange(index: number) {
    const stock = this.stockItems[index];
    if (!stock.color || !stock.size || stock.quantity < 0) return;

    console.log(`🟢 Updated stock row ${index}:`, stock);
  }

  getColorHex(colorName: string): string | null {
    const color = this.colors.find(c => c.name === colorName);
    return color ? color.hex : null;
  }

  NavigateToProductDetail(id: number) {
    this.router.navigate(['/products', id]);
  }

  getStockStatus(productId: number) {
    const product = this.products.find(p => p.Id === productId);
    return product.TotalQuantity > 0;
  }

  getBrandName(brandId: number) {
    const brand = this.brands.find(b => b.Id == brandId);
    return brand.Name;
  }

  editingStockIndex: number | null = null;
  editedStock = { color: '', size: '', quantity: 0 };

  startStockEdit(index: number, stock: any) {
    this.editingStockIndex = index;
    this.editedStock = {
      color: stock.color,
      size: stock.size,
      quantity: stock.quantity,
    };
  }

  saveStockEdit(index: number) {
    if (this.editedStock.quantity < 0) return;

    this.stockItems[index] = { ...this.editedStock };
    this.editingStockIndex = null;
  }

  cancelStockEdit() {
    this.editingStockIndex = null;
  }
}