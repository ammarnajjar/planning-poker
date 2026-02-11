import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface AdminPinDialogData {
  title: string;
  message: string;
  mode: 'create' | 'verify' | 'confirm' | 'join';
  pinRequired?: boolean;
}

@Component({
  selector: 'app-admin-pin-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p style="margin-bottom: 16px; line-height: 1.5;">{{ data.message }}</p>

      @if (data.mode !== 'confirm') {
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Admin PIN</mat-label>
          <input
            matInput
            type="password"
            [(ngModel)]="pin"
            [required]="data.pinRequired !== false"
            placeholder="Enter PIN"
            (keyup.enter)="onSubmit()"
           
          >
          @if (data.mode === 'create') {
            <mat-hint>Leave empty to skip (not recommended)</mat-hint>
          }
          @if (data.mode === 'join') {
            <mat-hint>Leave empty to join as participant</mat-hint>
          }
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.mode === 'confirm' ? 'No' : 'Cancel' }}
      </button>
      <button mat-raised-button color="primary" (click)="onSubmit()">
        {{ data.mode === 'confirm' ? 'Yes' : 'OK' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 300px;
      max-width: 400px;
    }
  `]
})
export class AdminPinDialogComponent {
  pin = '';

  constructor(
    public dialogRef: MatDialogRef<AdminPinDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminPinDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.data.mode === 'confirm') {
      this.dialogRef.close(true);
    } else if (this.data.pinRequired === false || this.pin) {
      this.dialogRef.close(this.pin || undefined);
    }
  }
}
