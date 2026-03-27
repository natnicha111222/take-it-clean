import { ChangeDetectionStrategy, Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CreateServiceRequestDto } from '../../models/device.model';

export interface ServiceRequestDialogData {
  deviceIp: string;
  deviceName: string;
}

@Component({
  selector: 'app-service-request-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSelectModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-header">
      <div class="header-icon-wrap">🔧</div>
      <div>
        <h2 mat-dialog-title>เรียกช่างซ่อม</h2>
        <p class="device-label">{{ data.deviceName }}</p>
      </div>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ปัญหาที่พบ</mat-label>
          <mat-select formControlName="problem">
            <mat-option value="PM2.5 สูงมาก">PM2.5 สูงมาก ฝุ่นละอองเยอะ</mat-option>
            <mat-option value="อุณหภูมิผิดปกติ">อุณหภูมิผิดปกติ ร้อนเกินไป</mat-option>
            <mat-option value="ความชื้นสูง">ความชื้นสูง มีกลิ่นอับ</mat-option>
            <mat-option value="แอร์ไม่ทำงาน">แอร์ไม่ทำงาน / ปิดเอง</mat-option>
            <mat-option value="เสียงดัง">เสียงดัง ผิดปกติ</mat-option>
            <mat-option value="อื่นๆ">อื่นๆ</mat-option>
          </mat-select>
          @if (form.get('problem')?.hasError('required') && form.get('problem')?.touched) {
            <mat-error>กรุณาระบุปัญหา</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>เบอร์โทรศัพท์</mat-label>
          <ion-icon matPrefix name="call-outline"></ion-icon>
          <input matInput formControlName="contactPhone" placeholder="081-234-5678"
                 inputmode="tel" maxlength="15">
          @if (form.get('contactPhone')?.hasError('required') && form.get('contactPhone')?.touched) {
            <mat-error>กรุณากรอกเบอร์โทร</mat-error>
          }
          @if (form.get('contactPhone')?.hasError('pattern')) {
            <mat-error>รูปแบบเบอร์โทรไม่ถูกต้อง</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>วันและเวลาที่สะดวก</mat-label>
          <ion-icon matPrefix name="calendar-outline"></ion-icon>
          <input matInput formControlName="preferredDateTime"
                 type="datetime-local"
                 [min]="minDateTime">
          @if (form.get('preferredDateTime')?.hasError('required') && form.get('preferredDateTime')?.touched) {
            <mat-error>กรุณาระบุวันเวลา</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">ยกเลิก</button>
      <button mat-raised-button color="warn" (click)="submit()" [disabled]="form.invalid">
        <ion-icon name="paper-plane-outline"></ion-icon> ส่งคำขอ
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 24px 24px 0;
      background: rgba(255,68,102,0.06);
      border-radius: 20px 20px 0 0;
      border-bottom: 1px solid rgba(255,68,102,0.12);
      padding-bottom: 16px;
    }
    .header-icon-wrap { font-size: 2rem; line-height: 1; }
    h2[mat-dialog-title] { margin: 0; color: #FF4466; font-size: 1.25rem; font-family: 'Nunito', sans-serif; font-weight: 800; }
    .device-label { margin: 4px 0 0; color: rgba(176,200,236,0.55); font-size: 0.85rem; }
    mat-dialog-content { padding: 20px 24px !important; }
    .form-grid { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    mat-dialog-actions { padding: 8px 24px 20px !important; gap: 8px; }
  `],
})
export class ServiceRequestDialogComponent {
  dialogRef = inject(MatDialogRef<ServiceRequestDialogComponent>);
  data: ServiceRequestDialogData = inject(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);

  minDateTime = new Date().toISOString().slice(0, 16);

  form = this.fb.nonNullable.group({
    problem:           ['', Validators.required],
    contactPhone:      ['', [Validators.required, Validators.pattern(/^[0-9\-+() ]{8,15}$/)]],
    preferredDateTime: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const dto: CreateServiceRequestDto = {
      deviceIp:          this.data.deviceIp,
      problem:           this.form.value.problem!,
      contactPhone:      this.form.value.contactPhone!,
      preferredDateTime: this.form.value.preferredDateTime!,
    };
    this.dialogRef.close(dto);
  }

  cancel(): void { this.dialogRef.close(null); }
}
