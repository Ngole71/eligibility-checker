import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface EligibilityRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface EligibilityResponse {
  id: number;
  age: number;
  eligible: boolean;
  message: string;
  timestamp: string;
}

export interface Statistics {
  totalUsers: number;
  eligibleUsers: number;
  ineligibleUsers: number;
  averageAge: number;
}

@Injectable({
  providedIn: 'root'
})
export class EligibilityService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  checkEligibility(data: EligibilityRequest): Observable<EligibilityResponse> {
    return this.http.post<EligibilityResponse>(`${this.apiUrl}/check-eligibility`, data)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // ADD THIS METHOD:
  getStatistics(): Observable<{ statistics: Statistics }> {
    return this.http.get<{ statistics: Statistics }>(`${this.apiUrl}/stats`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => ({ error: { error: errorMessage } }));
  }
}