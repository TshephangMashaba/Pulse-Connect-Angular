import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  providers: [AnalyticsService],
  standalone: false
})
export class AnalyticsComponent implements OnInit {
   public userEngagementChart: any;
  public courseCompletionChart: any;
  public geographicDistributionChart: any;
  public healthTopicEngagementChart: any;
  public deviceUsageChart: any;
  public languagePreferenceChart: any;
  public provinceStatsChart: any;
  
  public loading = true;
  public errorMessage: string = '';
  public stats = {
    totalUsers: 0,
    activeUsers: 0,
    coursesCompleted: 0,
    certificatesIssued: 0,
    forumPosts: 0,
    avgCompletionRate: 0
  };

  public communityStats = {
    totalMembers: 0,
    activeDiscussions: 0,
    totalPosts: 0,
    answeredQuestions: 0
  };

  public recentActivity: any[] = [];
  public popularCourses: any[] = [];
  public provinceStats: any[] = [];

  constructor(private analyticsService: AnalyticsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    
    // Load all data in parallel
    this.analyticsService.getAnalyticsData().subscribe({
      next: (data) => {
        this.stats = data.summary;
        this.createCharts(data);
        this.recentActivity = data.recentActivity || [];
        this.popularCourses = data.popularCourses || [];
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        this.checkLoadingComplete();
      }
    });

    this.analyticsService.getCommunityStats().subscribe({
      next: (data) => {
        this.communityStats = data;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading community stats:', error);
        this.checkLoadingComplete();
      }
    });

    this.analyticsService.getProvinceStats().subscribe({
      next: (data) => {
        this.provinceStats = data;
        this.createProvinceStatsChart(data);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading province stats:', error);
        this.checkLoadingComplete();
      }
    });

    this.analyticsService.getRecentActivity().subscribe({
      next: (data) => {
        this.recentActivity = data;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        this.checkLoadingComplete();
      }
    });

    this.analyticsService.getPopularCourses().subscribe({
      next: (data) => {
        this.popularCourses = data;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading popular courses:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete() {
    // This is a simple way to track loading completion
    // In a real app, you might want to use a more sophisticated approach
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  createProvinceStatsChart(data: any[]): void {
    const ctx = document.getElementById('provinceStatsChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.provinceStatsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(p => p.province),
        datasets: [
          {
            label: 'Members',
            data: data.map(p => p.memberCount),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Posts',
            data: data.map(p => p.postCount),
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Province Statistics'
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  createCharts(data: any): void {
    this.createUserEngagementChart(data.userEngagement);
    this.createCourseCompletionChart(data.courseCompletion);
    this.createGeographicDistributionChart(data.geographicDistribution);
    this.createHealthTopicEngagementChart(data.healthTopicEngagement);
    this.createDeviceUsageChart(data.deviceUsage);
    this.createLanguagePreferenceChart(data.languagePreference);
  }

  createUserEngagementChart(data: any): void {
    this.userEngagementChart = new Chart('userEngagementChart', {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Active Users',
          data: data.values,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'User Engagement Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createCourseCompletionChart(data: any): void {
    this.courseCompletionChart = new Chart('courseCompletionChart', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Completion Rate (%)',
          data: data.values,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Course Completion Rates'
          }
        }
      }
    });
  }

  createGeographicDistributionChart(data: any): void {
    this.geographicDistributionChart = new Chart('geographicDistributionChart', {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            '#10B981',
            '#3B82F6',
            '#8B5CF6',
            '#F59E0B',
            '#EF4444',
            '#EC4899',
            '#06B6D4',
            '#84CC16',
            '#6366F1'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'User Distribution by Province'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  createHealthTopicEngagementChart(data: any): void {
    this.healthTopicEngagementChart = new Chart('healthTopicEngagementChart', {
      type: 'polarArea',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Engagement by Health Topic'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  createDeviceUsageChart(data: any): void {
    this.deviceUsageChart = new Chart('deviceUsageChart', {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            '#10B981',
            '#3B82F6',
            '#8B5CF6'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Device Usage Distribution'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  createLanguagePreferenceChart(data: any): void {
    this.languagePreferenceChart = new Chart('languagePreferenceChart', {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Users',
          data: data.values,
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Language Preferences'
          }
        }
      }
    });
  }
}