// src/app/components/dashboard/dashboard.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import axios from 'axios';

interface Timer {
  hours: string;
  minutes: string;
  seconds: string;
}

interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: string;
}

interface SavedState {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  /** milliseconds since epoch when the timer started */
  startTime: number;
  /** total elapsed milliseconds when we paused (only when checked-out) */
  pausedElapsed: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  // ----- Timer -----
  timer: Timer = { hours: '00', minutes: '00', seconds: '00' };
  private intervalId: any = null;

  // ----- Status -----
  isCheckedIn = false;
  currentStatus = 'Checked Out';
  checkInTime: string | null = null;
  checkOutTime: string | null = null;   // used for display only
  checkedOutAt: string | null = null;   // "Checked-out at: 02:30 PM"

  // ----- Runtime vars -----
  private startTime = 0;        // epoch ms when timer started
  private pausedElapsed = 0;    // elapsed ms when we last checked-out

  // ----- Past records -----
  pastRecords: AttendanceRecord[] = [
    { date: '2024-03-01', checkIn: '09:00 AM', checkOut: '05:00 PM', totalHours: '8 hours' },
    { date: '2024-02-29', checkIn: '09:15 AM', checkOut: '05:15 PM', totalHours: '8 hours' },
    { date: '2024-02-28', checkIn: '08:45 AM', checkOut: '04:45 PM', totalHours: '8 hours' },
    { date: '2024-02-27', checkIn: '09:00 AM', checkOut: '05:00 PM', totalHours: '8 hours' },
    { date: '2024-02-26', checkIn: '09:30 AM', checkOut: '05:30 PM', totalHours: '8 hours' },
  ];

  ngOnInit() {
    this.restoreState();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /* ------------------------------------------------------------------ */
  /*                     STATE PERSISTENCE (localStorage)               */
  /* ------------------------------------------------------------------ */
  private restoreState() {
    const raw = localStorage.getItem('attendanceState');
    if (!raw) return;

    const saved: SavedState = JSON.parse(raw);

    this.isCheckedIn = saved.isCheckedIn;
    this.checkInTime = saved.checkInTime ?? null;
    this.checkOutTime = saved.checkOutTime ?? null;
    this.checkedOutAt = saved.checkOutTime
      ? `Checked-out at: ${saved.checkOutTime}`
      : null;

    this.startTime = saved.startTime;
    this.pausedElapsed = saved.pausedElapsed ?? 0;

    this.currentStatus = this.isCheckedIn ? 'Checked In' : 'Checked Out';

    if (this.isCheckedIn) {
      this.startTimer();               // resume live timer
    } else {
      this.updateTimerDisplay(this.pausedElapsed);
    }
  }

  private saveState() {
    const state: SavedState = {
      isCheckedIn: this.isCheckedIn,
      checkInTime: this.checkInTime ?? undefined,
      checkOutTime: this.checkOutTime ?? undefined,
      startTime: this.startTime,
      pausedElapsed: this.pausedElapsed,
    };
    localStorage.setItem('attendanceState', JSON.stringify(state));
  }

  /* ------------------------------------------------------------------ */
  /*                     CHECK-IN / CHECK-OUT LOGIC                     */
  /* ------------------------------------------------------------------ */
  async toggleCheckInOut() {
    this.isCheckedIn ? await this.checkOut() : await this.checkIn();
  }

  private async checkIn() {
    const now = new Date();

    // If we were paused, keep the already-accumulated time
    this.startTime = Date.now() - this.pausedElapsed;
    this.checkInTime = this.formatTime(now);
    this.isCheckedIn = true;
    this.currentStatus = 'Checked In';
    this.checkedOutAt = null;               // clear "checked-out at" line

    this.startTimer();
    this.saveState();
  }

  private async checkOut() {
    const now = new Date();

    // Capture the final elapsed time
    this.pausedElapsed = Date.now() - this.startTime;
    this.checkOutTime = this.formatTime(now);
    this.checkedOutAt = `Checked-out at: ${this.checkOutTime}`;

    this.isCheckedIn = false;
    this.currentStatus = 'Checked Out';

    // Stop the live interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Show the paused value immediately
    this.updateTimerDisplay(this.pausedElapsed);

    // ---- Record in history ----
    const today = now.toISOString().split('T')[0];
    const hours = Math.floor(this.pausedElapsed / (1000 * 60 * 60));
    const minutes = Math.floor((this.pausedElapsed % (1000 * 60 * 60)) / (1000 * 60));
    const total = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();

    this.pastRecords.unshift({
      date: today,
      checkIn: this.checkInTime!,
      checkOut: this.checkOutTime!,
      totalHours: total || '0h',
    });

    this.saveState();
  }

  /* ------------------------------------------------------------------ */
  /*                         TIMER ENGINE                              */
  /* ------------------------------------------------------------------ */
  private startTimer() {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.updateTimerDisplay(elapsed);
    }, 1000);
  }

  private updateTimerDisplay(ms: number) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    this.timer = {
      hours: this.pad(hours),
      minutes: this.pad(minutes),
      seconds: this.pad(seconds),
    };
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /* ------------------------------------------------------------------ */
  /*                         UI HELPERS                                 */
  /* ------------------------------------------------------------------ */
  get buttonText(): string {
    return this.isCheckedIn ? 'Check-out' : 'Check-in';
  }

  get buttonClass(): string {
    return this.isCheckedIn
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-[#34b760] hover:bg-[#49796B] text-[#FAF9F6]';
  }
}