// frontend/src/app/components/stats/stats.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EligibilityService } from '../../services/eligibility.service';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface Statistics {
  totalUsers: number;
  eligibleUsers: number;
  ineligibleUsers: number;
  averageAge: number;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  stats: Statistics | null = null;
  loading = true;
  error: string | null = null;
  
  private pieChart: Chart | null = null;
  private barChart: Chart | null = null;

  constructor(private eligibilityService: EligibilityService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    // Charts will be created after stats are loaded
  }

  ngOnDestroy(): void {
    // Clean up charts to prevent memory leaks
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.barChart) {
      this.barChart.destroy();
    }
  }

  loadStatistics(): void {
    this.loading = true;
    this.error = null;
    
    this.eligibilityService.getStatistics().subscribe({
      next: (response) => {
        this.stats = response.statistics;
        this.loading = false;
        // Create charts after data is loaded
        setTimeout(() => this.createCharts(), 100);
      },
      error: (error) => {
        this.error = 'Failed to load statistics';
        this.loading = false;
        console.error('Error loading statistics:', error);
      }
    });
  }

  refresh(): void {
    this.loadStatistics();
  }

  getEligibilityPercentage(): number {
    if (!this.stats || this.stats.totalUsers === 0) return 0;
    return Math.round((this.stats.eligibleUsers / this.stats.totalUsers) * 100);
  }

  private createCharts(): void {
    if (!this.stats) return;
    
    this.createPieChart();
    this.createBarChart();
  }

  private createPieChart(): void {
    if (!this.pieChartCanvas || !this.stats) return;

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Eligible', 'Not Eligible'],
        datasets: [{
          data: [this.stats.eligibleUsers, this.stats.ineligibleUsers],
          backgroundColor: [
            '#4caf50', // Green for eligible
            '#f44336'  // Red for not eligible
          ],
          borderColor: [
            '#388e3c',
            '#d32f2f'
          ],
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = this.stats!.totalUsers;
                const value = context.parsed;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private createBarChart(): void {
    if (!this.barChartCanvas || !this.stats) return;

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.barChart) {
      this.barChart.destroy();
    }

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Users', 'Eligible', 'Not Eligible'],
        datasets: [{
          label: 'Number of Users',
          data: [
            this.stats.totalUsers,
            this.stats.eligibleUsers,
            this.stats.ineligibleUsers
          ],
          backgroundColor: [
            '#2196f3', // Blue for total
            '#4caf50', // Green for eligible
            '#f44336'  // Red for not eligible
          ],
          borderColor: [
            '#1976d2',
            '#388e3c',
            '#d32f2f'
          ],
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.parsed.y} users`;
              }
            }
          }
        }
      }
    });
  }
}
