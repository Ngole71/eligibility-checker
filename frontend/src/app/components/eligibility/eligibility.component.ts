import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EligibilityService } from '../../services/eligibility.service';

interface EligibilityResult {
  id: number;
  age: number;
  eligible: boolean;
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-eligibility',
  templateUrl: './eligibility.component.html',
  styleUrl: './eligibility.component.scss'
})
export class EligibilityComponent implements OnInit {
  eligibilityForm: FormGroup;
  result: EligibilityResult | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private eligibilityService: EligibilityService,
    private snackBar: MatSnackBar
  ) {
    this.eligibilityForm = this.fb.group({
      firstName: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      lastName: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      dateOfBirth: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.eligibilityForm.valid) {
      this.loading = true;
      this.result = null;
      
      const formData = {
        ...this.eligibilityForm.value,
        dateOfBirth: new Date(this.eligibilityForm.value.dateOfBirth).toISOString().split('T')[0]
      };

      this.eligibilityService.checkEligibility(formData).subscribe({
        next: (response) => {
          this.result = response;
          this.loading = false;
          this.snackBar.open('Eligibility check completed!', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(
            error.error?.error || 'An error occurred while checking eligibility',
            'Close',
            { duration: 5000 }
          );
        }
      });
    }
  }

  resetForm(): void {
    this.eligibilityForm.reset();
    this.result = null;
  }
}
