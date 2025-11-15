// barcode-scanner.component.ts
import { Component, EventEmitter, Input, Output, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-2 border-[#d0e7d7] overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] p-6 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-2xl font-black">Scan Barcode</h2>
                <p class="text-sm text-white/80">Use camera or upload image</p>
              </div>
            </div>
            <button
              (click)="close()"
              class="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-xl transition-all text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="flex border-b-2 border-[#e7f3eb] bg-[#f8fcf9]">
          <button
            (click)="setMode('camera')"
            [class.bg-white]="mode === 'camera'"
            [class.text-[#4e9767]]="mode === 'camera'"
            [class.font-bold]="mode === 'camera'"
            [class.border-b-2]="mode === 'camera'"
            [class.border-[#4e9767]]="mode === 'camera'"
            [class.text-gray-600]="mode !== 'camera'"
            class="flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-all hover:bg-white/50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Camera Scan
          </button>
          <button
            (click)="setMode('upload')"
            [class.bg-white]="mode === 'upload'"
            [class.text-[#4e9767]]="mode === 'upload'"
            [class.font-bold]="mode === 'upload'"
            [class.border-b-2]="mode === 'upload'"
            [class.border-[#4e9767]]="mode === 'upload'"
            [class.text-gray-600]="mode !== 'upload'"
            class="flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-all hover:bg-white/50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Upload Image
          </button>
        </div>

        <!-- Camera Mode -->
        <div *ngIf="mode === 'camera'" class="relative bg-black">
          <video
            #videoElement
            class="w-full h-[400px] object-cover"
            [class.hidden]="!enabled"
          ></video>

          <!-- Loading State -->
          <div *ngIf="!enabled" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-white text-lg font-semibold">Initializing camera...</p>
            </div>
          </div>

          <!-- Scanning Overlay -->
          <div *ngIf="enabled" class="absolute inset-0 pointer-events-none">
            <!-- Corner brackets -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <!-- Top-left -->
              <div class="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#4e9767] rounded-tl-2xl"></div>
              <!-- Top-right -->
              <div class="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#4e9767] rounded-tr-2xl"></div>
              <!-- Bottom-left -->
              <div class="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#4e9767] rounded-bl-2xl"></div>
              <!-- Bottom-right -->
              <div class="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#4e9767] rounded-br-2xl"></div>
              
              <!-- Scanning line animation -->
              <div class="absolute inset-0 overflow-hidden">
                <div class="w-full h-0.5 bg-[#4e9767] shadow-lg shadow-[#4e9767]/50 animate-scan"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Mode -->
        <div *ngIf="mode === 'upload'" class="relative bg-gradient-to-br from-[#f8fcf9] to-white">
          <div class="h-[400px] flex items-center justify-center p-8">
            <div class="text-center w-full max-w-md">
              <!-- Upload Preview -->
              <div *ngIf="uploadedImage" class="mb-6">
                <img [src]="uploadedImage" class="max-h-64 mx-auto rounded-xl shadow-lg border-2 border-[#d0e7d7]" alt="Uploaded barcode">
                <div *ngIf="isProcessing" class="mt-4">
                  <div class="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin mx-auto"></div>
                  <p class="text-[#4e9767] font-semibold mt-3">Processing image...</p>
                </div>
              </div>

              <!-- Upload Area -->
              <div *ngIf="!uploadedImage" class="border-3 border-dashed border-[#d0e7d7] rounded-2xl p-12 bg-white hover:bg-[#f8fcf9] transition-colors cursor-pointer"
                   (click)="fileInput.click()"
                   (dragover)="onDragOver($event)"
                   (drop)="onDrop($event)">
                <div class="w-20 h-20 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p class="text-xl font-bold text-[#0e1b12] mb-2">Drop image here or click to upload</p>
                <p class="text-sm text-gray-600 mb-4">Supports JPG, PNG, or any image format</p>
                <button class="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow">
                  Choose File
                </button>
              </div>

              <!-- Reset Button -->
              <button *ngIf="uploadedImage && !isProcessing" 
                      (click)="resetUpload()"
                      class="mt-4 text-[#4e9767] font-semibold hover:underline">
                Upload Different Image
              </button>
            </div>
          </div>
          
          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            class="hidden"
          />
        </div>

        <!-- Footer -->
        <div class="p-6 bg-gradient-to-br from-[#f8fcf9] to-white border-t-2 border-[#e7f3eb]">
          <div class="flex items-center gap-3 text-[#0e1b12]">
            <svg class="w-5 h-5 text-[#4e9767] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <p class="text-sm font-medium" *ngIf="mode === 'camera'">
              Hold your camera steady and position the barcode within the frame. The scanner will automatically detect and read it.
            </p>
            <p class="text-sm font-medium" *ngIf="mode === 'upload'">
              Upload a clear image of your barcode. Ensure the barcode is visible and not blurry for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes scan {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(256px);
      }
    }
    .animate-scan {
      animation: scan 2s ease-in-out infinite;
    }
  `]
})
export class BarcodeScannerComponent implements OnDestroy {
  @Input() enabled: boolean = false;
  @Output() scanned = new EventEmitter<string>();
  @Output() error = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('videoElement') videoElementRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  mode: 'camera' | 'upload' = 'camera';
  uploadedImage: string | null = null;
  isProcessing: boolean = false;

  private codeReader: BrowserMultiFormatReader;
  private videoElement?: HTMLVideoElement;

  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }

  ngAfterViewInit() {
    this.videoElement = document.querySelector('video') as HTMLVideoElement;
    if (this.enabled && this.videoElement && this.mode === 'camera') {
      this.startScanning();
    }
  }

  ngOnChanges() {
    if (this.enabled && this.videoElement && this.mode === 'camera') {
      this.startScanning();
    }
  }

  setMode(mode: 'camera' | 'upload') {
    if (this.mode === mode) return;
    
    this.mode = mode;
    
    if (mode === 'camera') {
      this.resetUpload();
      setTimeout(() => {
        this.videoElement = document.querySelector('video') as HTMLVideoElement;
        if (this.enabled && this.videoElement) {
          this.startScanning();
        }
      }, 100);
    } else {
      this.stopScanning();
    }
  }

  private async startScanning() {
    if (!this.videoElement) return;

    try {
      await this.codeReader.decodeFromVideoDevice(
        null,
        this.videoElement,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log('✅ Barcode detected:', barcode);
            this.scanned.emit(barcode);
            this.stopScanning();
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Scan error:', error);
            this.error.emit(error);
          }
        }
      );
    } catch (err) {
      console.error('Failed to start camera:', err);
      this.error.emit(err);
    }
  }

  private stopScanning() {
    this.codeReader.reset();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private async processFile(file: File) {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImage = e.target?.result as string;
      this.decodeFromImage(this.uploadedImage);
    };
    reader.readAsDataURL(file);
  }

  private async decodeFromImage(imageSrc: string) {
    this.isProcessing = true;
    
    try {
      const img = new Image();
      img.src = imageSrc;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const result = await this.codeReader.decodeFromImageElement(img);
      const barcode = result.getText();
      console.log('✅ Barcode detected from image:', barcode);
      this.scanned.emit(barcode);
      this.isProcessing = false;
    } catch (err) {
      console.error('Failed to decode barcode from image:', err);
      this.isProcessing = false;
      this.error.emit({ message: 'No barcode found in image. Please try a different image.' });
    }
  }

  resetUpload() {
    this.uploadedImage = null;
    this.isProcessing = false;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  close() {
    this.stopScanning();
    this.resetUpload();
    this.closed.emit();
  }

  ngOnDestroy() {
    this.stopScanning();
  }
}