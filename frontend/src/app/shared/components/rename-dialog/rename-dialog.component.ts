import { ChangeDetectionStrategy, Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface RenameDialogData { ip: string; currentName: string; }

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-header">
      <ion-icon name="create-outline" class="header-icon"></ion-icon>
      <h2 mat-dialog-title>ตั้งชื่ออุปกรณ์</h2>
    </div>
    <mat-dialog-content>
      <p class="device-ip">IP: {{ data.ip }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>ชื่ออุปกรณ์</mat-label>
        <input matInput [formControl]="nameControl" placeholder="เช่น ห้องนอนใหญ่"
               (keydown.enter)="submit()" maxlength="40">
        <mat-hint align="end">{{ nameControl.value?.length ?? 0 }}/40</mat-hint>
        @if (nameControl.hasError('maxlength')) {
          <mat-error>ชื่อยาวเกินไป (สูงสุด 40 ตัวอักษร)</mat-error>
        }
      </mat-form-field>
      <p class="hint-text">
        <ion-icon name="information-circle-outline" class="hint-icon"></ion-icon>
        หากเว้นว่างไว้ ระบบจะแสดง IP แทน
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">ยกเลิก</button>
      <button mat-raised-button color="primary" (click)="submit()"
              [disabled]="nameControl.invalid">
        <ion-icon name="save-outline"></ion-icon> บันทึก
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 24px 0;
    }
    .header-icon { font-size: 26px; color: #00D4B4; }
    h2[mat-dialog-title] { margin: 0; color: #ECF4FF; font-size: 1.3rem; font-family: 'Nunito', sans-serif; }
    mat-dialog-content { padding: 16px 24px !important; }
    .device-ip { color: rgba(176,200,236,0.55); font-size: 0.85rem; margin: 0 0 16px; font-family: monospace; }
    .full-width { width: 100%; }
    .hint-text {
      display: flex; align-items: center; gap: 6px;
      color: rgba(176,200,236,0.45); font-size: 0.82rem; margin: 8px 0 0;
    }
    .hint-icon { font-size: 15px; color: rgba(176,200,236,0.40); }
    mat-dialog-actions { padding: 8px 24px 20px !important; gap: 8px; }
  `],
})
export class RenameDialogComponent {
  dialogRef = inject(MatDialogRef<RenameDialogComponent>);
  data: RenameDialogData = inject(MAT_DIALOG_DATA);

  nameControl = new FormControl(this.data.currentName, [Validators.maxLength(40)]);

  submit(): void {
    if (this.nameControl.invalid) return;
    this.dialogRef.close(this.nameControl.value ?? '');
  }

  cancel(): void { this.dialogRef.close(null); }
}
