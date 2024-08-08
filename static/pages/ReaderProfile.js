import Navbar from "../components/Navbar.js";

const ReaderProfile = {
  data() {
    return {
      user: {
        id: '',
        user: '',
        fname: '',
        email: '',
        active: true,
        roles: [],
        password: ''
      },
      borrowedBooks: [],
      stats: {
        bought: 0,
        borrowed: 0,
        monthlyData: []
      },
      isLoading: true,
      error: null,
      editMode: false,
    };
  },
  components: {
    Navbar
  },
  methods: {
    fetchUserProfile() {
      const userId = localStorage.getItem('id');
      fetch(`/profile/${userId}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            this.error = data.error;
          } else {
            this.user = data.user;
            this.borrowedBooks = data.borrowed_books;
            this.stats = data.stats;
            this.renderCharts();
          }
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching profile:', error);
          this.error = 'Failed to load profile. Please try again later.';
          this.isLoading = false;
        });
    },
    saveProfile() {
      const updateData = {
        id: this.user.id,
        user: this.user.user,
        fname: this.user.fname,
        email: this.user.email
      };
      if (this.user.password) {
        updateData.password = this.user.password;
      }
      fetch(`/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
          } else {
            alert(data.success);
            this.editMode = false;
            this.fetchUserProfile();
          }
        })
        .catch(error => {
          console.error('Error updating profile:', error);
        });
    },
    toggleEditMode() {
      this.editMode = !this.editMode;
    },
    renderCharts() {
      const ctxPie = document.getElementById('pieChart').getContext('2d');
      new Chart(ctxPie, {
        type: 'pie',
        data: {
          labels: ['Bought', 'Borrowed'],
          datasets: [{
            data: [this.stats.bought, this.stats.borrowed],
            backgroundColor: ['#e0c7a0', '#3c2a1a'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true
        }
      });

      const ctxBar = document.getElementById('barChart').getContext('2d');
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: this.stats.monthlyData.map(item => item.month),
          datasets: [{
            label: 'Number of Books',
            data: this.stats.monthlyData.map(item => item.count),
            backgroundColor: '#704632',
            borderColor: '#1e88e5',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              beginAtZero: true
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  },
  created() {
    this.fetchUserProfile();
  },
  template: `
    <div class="profile-page">
      <Navbar />
      <div class="profile-container">
        <div class="profile-card">
          <h2>Your Profile</h2>
          <div v-if="isLoading" class="loading">
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
          </div>
          <div v-else>
            <div v-if="error" class="error">{{ error }}</div>
            <div v-else>
              <div v-if="editMode">
                <input v-model="user.fname" class="profile-input" placeholder="First Name" />
                <input v-model="user.email" class="profile-input" placeholder="Email" />
                <input v-model="user.user" class="profile-input" placeholder="Username" />
                <input v-model="user.password" class="profile-input" type="password" placeholder="Password" />
                <button class="profile-button" @click="saveProfile">Save</button>
                <button class="profile-button" @click="toggleEditMode">Cancel</button>
              </div>
              <div v-else>
                <p><b>Name:</b> {{ user.fname }}</p>
                <p><b>Email:</b> {{ user.email }}</p>
                <p><b>Username:</b> {{ user.user }}</p>
              
                <button class="profile-button" @click="toggleEditMode">Edit Profile</button>
              </div>
            </div>
          </div>
        </div>

        
        
        <div class="history-card">
          <h3>Borrowed/Bought Books</h3>
          <table class="books-table">
            <thead>
              <tr>
                <th>Book Name</th>
                <th>Date Issued</th>
             
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in borrowedBooks" :key="book.ebook_id">
                <td><a :href="'/#/ebook/' + book.ebook_id" class="book-link">{{ book.ebook_name }}</a></td>
                <td>{{ book.date_issued }}</td>
            
                <td>{{ book.bought ? 'Bought' : 'Borrowed' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="stats-container">
          <div class="stats-card">
            <h3>Statistics</h3>
            <div class="chart-container">
              <div class="chart">
                <canvas id="pieChart"></canvas>
              </div>
              <div class="chart">
                <canvas id="barChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

export default ReaderProfile;
