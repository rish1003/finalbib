
import Navbar from "../components/Navbar.js";

const Admin = {
  data() {
    return {
      chart: null,
      activeUsers: 0,
      grantRequests: 0,
      totalBooks: 0,
      totalSections: 0,
      selectedYear: new Date().getFullYear(),
      years: [2022, 2023, 2024, 2025],
      isLoading: true,
      error: null,
      userGrowth: 0,
      requestGrowth: 0,
      selectedPeriod: 'week', 
      periodData: {
        activeUsers: {
          current: 0,
          previous: 0,
        },
        grantRequests: {
          current: 0,
          previous: 0,
        },
      },
    };
  },
  components: {
    Navbar
  },
  methods: {
    fetchStatistics() {
      fetch(`/api/admin/stats?period=${this.selectedPeriod}&year=${this.selectedYear}`)
        .then(response => response.json())
        .then(data => {
          this.activeUsers = data.activeUsers;
          this.grantRequests = data.grantRequests;
          this.totalBooks = data.totalBooks;
          this.totalSections = data.totalSections;
          this.userGrowth = data.userGrowth; 
          this.requestGrowth = data.requestGrowth;
          this.periodData = data.periodData;
        })
        .catch(error => {
          console.error('Error fetching statistics:', error);
          this.error = 'Failed to load statistics. Please try again later.';
        });
    },
    handlePeriodChange(newPeriod) {
      this.selectedPeriod = newPeriod; 
      this.fetchStatistics();
    },
    fetchEbookIssues() {
      const year = this.selectedYear;
      fetch(`/api/admin/ebook-issues?year=${year}`)
        .then(response => response.json())
        .then(data => {

          this.renderEbookIssuesChart(data);
        })
        .catch(error => {
          console.error('Error fetching e-book issues data:', error);
          this.error = 'Failed to load e-book issues data. Please try again later.';
        });
    },
    fetchTotalBooksChart() {
      fetch('/api/admin/total-books')
        .then(response => response.json())
        .then(data => {
          this.renderTotalBooksChart(data);
        })
        .catch(error => {
          console.error('Error fetching total books data:', error);
          this.error = 'Failed to load total books data. Please try again later.';
        });
    },
    fetchPopularSectionsChart() {
      fetch('/api/admin/popular-sections')
        .then(response => response.json())
        .then(data => {
          this.renderPopularSectionsChart(data);
        })
        .catch(error => {
          console.error('Error fetching popular sections data:', error);
          this.error = 'Failed to load popular sections data. Please try again later.';
        });
    },
    renderEbookIssuesChart(data) {
      if (this.chart) this.chart.destroy();
      const ctx = document.getElementById('ebookIssuesChart').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : ''; 
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : ''; 
                }
              }}}
          
        }
      });
    },
    renderTotalBooksChart(data) {
      const ctx = document.getElementById('totalBooksChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : ''; 
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : '';  
                }
              }
            }}
        }
      });
    },
    renderPopularSectionsChart(data) {
      const ctx = document.getElementById('popularSectionsChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : ''; 
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return Number.isInteger(value) ? value : '';  
                }
              }
            }
          }
        }
      });
    },
    navigateTo(route) {
      this.$router.push({ path: `/${route}` });
    }
  },
  mounted() {
    this.fetchStatistics();
    this.fetchEbookIssues();
    this.fetchTotalBooksChart();
    this.fetchPopularSectionsChart();
    this.isLoading = false;
  },
  computed:{
    change() {
      return this.periodData.activeUsers.current - this.periodData.activeUsers.previous;
    }
  },
  template: `
    <div class="admin-dashboard">
      <Navbar />
      <div class="container">
        <div class="intro-section">
          <div class="intro-content" style="color:#3c2a1a;">
            <h1 class="dashboard-title" style="color:#3c2a1a;"><b>Welcome, Librarian!</b></h1>
            <p class="welcome-text" style="color:#3c2a1a;">Manage the library efficiently with the statistics and tools provided below.</p>
          </div>
        </div>
        <div class="comparison-header">
        
        <h3 class="intro-content" style="color:#3c2a1a;"> Choose time period for comparison of users and requests </h3></div>
        <center> <select v-model="selectedPeriod" @change="handlePeriodChange($event.target.value)">
                <option value="week">This Week vs Last Week</option>
                <option value="month">This Month vs Last Month</option>
                <option value="year">This Year vs Last Year</option>
              </select> 
              </center> 
        </div>
        <div class="stats-container">
         
          <div class="stat-card" @click="navigateTo('users')">
            <h3>Active Users</h3>
            <b> <p> {{ activeUsers }}</p> </b>
            
           <div class="comparison">
          <p>Current: {{ periodData.activeUsers.current }}</p>
          <p>Previous: {{ periodData.activeUsers.previous }}</p>
          <p :class="{'growth': change > 0, 'decline': change < 0,'neutral': change==0}">
            <template v-if="change === 0">
              No change
            </template>
            <template v-else>
              {{ change > 0 ? '↑' : '↓' }} 
              {{ Math.abs(change) }}
            </template>
          </p>
        </div>
          </div>
          <div class="stat-card" @click="navigateTo('requests')">
            <h3>Book Requests</h3>
            <p> <b> {{ grantRequests }} </b></p>
         
            <div class="comparison">
              <p>Current: {{ periodData.grantRequests.current }}</p>
              <p>Previous: {{ periodData.grantRequests.previous }}</p>
              <p :class="{'growth': periodData.grantRequests.current > periodData.grantRequests.previous, 'decline': periodData.grantRequests.current < periodData.grantRequests.previous}">
                
             <template v-if="periodData.grantRequests.current == periodData.grantRequests.previous ">
              No change
            </template>
            <template v-else>
              {{ periodData.grantRequests.current > periodData.grantRequests.previous ? '↑' : '↓' }} 
                {{ Math.abs(periodData.grantRequests.current - periodData.grantRequests.previous) }}
            </template>
                </p>
            </div>
          </div>
        </div>
        <div class="stats-container" @click="navigateTo('management')">
          <div class="stat-card elongated">
            <h2>E-books Issued</h2>
            <div>
              <label for="yearSelect">Select Year:</label>
              <select id="yearSelect" v-model="selectedYear" @change="fetchEbookIssues">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
            <canvas id="ebookIssuesChart"></canvas>
          </div>
        </div>
        <div class="stats-container">
          <div class="stat-card" @click="navigateTo('management')">
            <h2>Total Books</h2>
            <p>{{ totalBooks }}</p>
            <canvas id="totalBooksChart"></canvas>
          </div>
          <div class="stat-card" @click="navigateTo('management')">
            <h2>Total Sections</h2>
            <p>{{ totalSections }}</p>
            <canvas id="popularSectionsChart"></canvas>
          </div>
        </div>
        <center>
            <div v-if="isLoading" class="loading">
                <div class="spinner">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </center>
        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
  `
};

export default Admin;
