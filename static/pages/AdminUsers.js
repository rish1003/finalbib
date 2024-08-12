import Navbar from "../components/Navbar.js";

const AdminUsers = {
  data() {
    return {
      users: [],
      searchQuery: '',
      sortBy: 'name',
      currentPage: 1,
      itemsPerPage: 5,
      error: null,
      token: localStorage.getItem("token")
    };
  },
  components:{
    Navbar
  },
  computed: {
    filteredUsers() {
      console.log(this.users);
      const searchQueryLower = (this.searchQuery !== "" ? this.searchQuery.toLowerCase() : "");
      console.log(searchQueryLower);
      
      return this.users.filter(user => {
        const nameMatch = user.name ? user.name.toLowerCase().includes(searchQueryLower) : false;
        const usernameMatch = user.username ? user.username.toLowerCase().includes(searchQueryLower) : false;
        
        return nameMatch || usernameMatch;
      });
    }
,    
    sortedUsers() {
      console.log(this.filteredUsers);
      return this.filteredUsers.sort((a, b) => {
        if (this.sortBy === 'created') {
          return new Date(b.created) - new Date(a.created);
        } else if (this.sortBy === 'username') {
          return a.username.localeCompare(b.username);
        } else {
          const aname = a.name ? a.name : "";
          const bname = b.name ? b.name : "";
          return aname.localeCompare(bname);
        }
      });
    },
    paginatedUsers() {

      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.sortedUsers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await fetch('/api/users', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });
        this.users = await response.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = 'Failed to load users. Please try again later.';
      }
    },
    async deleteUser(userId) {
      try {
        await fetch(`/api/users/${userId}`, { method: 'DELETE' ,headers: {
          
          'Authentication-Token': this.token,
        },});
        this.users = this.users.filter(user => user.id !== userId);
      } catch (error) {
        console.error('Error deleting user:', error);
        this.error = 'Failed to delete user. Please try again later.';
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
      }
    },
    changePage(page){
      this.currentPage = page;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage += 1;
      }
    },
    handleSearch() {
      this.$forceUpdate();
    },
    clearSearch() {
      this.searchQuery = "";
    },
    getPageNumbers(totalItems) {
      const pageCount = Math.ceil(totalItems / this.itemsPerPage);
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    },
  },
  created() {
    this.fetchUsers();
  },

  template: `
  <div>
  <Navbar/>
    <div class="container">
      <center>
      <p class="section-title" style="margin:10px; color: #3c2a1a;">View users and delete user profiles.</p> </center>

      <div class="search-bar">
        <input v-model="searchQuery" placeholder="Search by name or username" />
        <button @click="handleSearch" class="search-button">Search</button>
          <button @click="clearSearch" class="search-button">Clear</button>
      </div>
      <div v-if="this.filteredUsers.length === 0" class="no-results">
          <h3></h3>
          <p>No Such Users</p>
        </div>

      <div class="filter-bar">
        <label for="sort">Sort by:</label>
        <select v-model="sortBy" id="sort">
          <option value="name">Name</option>
          <option value="created">Created Date</option>
          <option value="username">Username</option>
        </select>
      </div>

    
      <table class="books-table">
        <thead style = "color: white;">
          <tr >
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ new Date(user.created).toLocaleDateString() }}</td>
            <td>
              <button @click="deleteUser(user.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

    
      <div class="pagination-controls">
      <center>
        <button @click="previousPage" :disabled="currentPage === 1">Previous</button>
        <span v-for="page in getPageNumbers(filteredUsers.length)" :key="page">
                  <button  @click="changePage(page)" :class="{ active: page === currentPage }">{{ page }}</button>
        </span>
        <button @click="nextPage" :disabled="currentPage >= totalPages">Next</button>
      </center>
      </div>

    
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    </div>
  `,
 
};

export default AdminUsers;
