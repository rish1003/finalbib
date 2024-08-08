import Navbar from "../components/Navbar.js";
const AdminHistory = {
    data() {
      return {
        historyRecords: [],
        filteredRecords: [],
        historyPage: 1,
        itemsPerPage: 10,
        error: null,
        searchQuery: '',
        filterBy: 'all',  // Can be 'user' or 'ebook'
        sortBy: 'name',  // Can be 'name', 'ebook_title', or 'date_borrowed'
        sortOrder: 'asc' // Can be 'asc' or 'desc'
      };
    },
    components: {
      Navbar
    },
    methods: {
      async fetchHistoryRecords() {
        try {
          const response = await fetch(`/api/ebooks/history?page=${this.historyPage}&per_page=${this.itemsPerPage}`);
          this.historyRecords = await response.json();
          this.applyFiltersSearchSort();
        } catch (error) {
          console.error('Error fetching history records:', error);
          this.error = 'Failed to load history records. Please try again later.';
        }
      },
      getPaginatedItems(items, page) {
        const start = (page - 1) * this.itemsPerPage;
        const end = page * this.itemsPerPage;
        return items.slice(start, end);
      },
      changePage(newPage) {
        console.log(this.historyPage);
        this.historyPage = newPage;
        this.fetchHistoryRecords();
      },
      getPageNumbers(totalItems) {
        const pageCount = Math.ceil(totalItems / this.itemsPerPage);
        return Array.from({ length: pageCount }, (_, i) => i + 1);
      },
      applyFiltersSearchSort() {
        let filtered = this.historyRecords;
  
        if (this.filterBy === 'user') {
          filtered = filtered.filter(record => record.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
        } else if (this.filterBy === 'ebook') {
          filtered = filtered.filter(record => record.ebook_title.toLowerCase().includes(this.searchQuery.toLowerCase()));
        }
  
        filtered = this.sortRecords(filtered);
  
        this.filteredRecords = filtered;
      },
      handleSearch() {
        this.applyFiltersSearchSort();
      },
      handleFilterChange(event) {
        this.filterBy = event.target.value;
        this.applyFiltersSearchSort();
      },
      handleSortChange(event) {
        const [field, order] = event.target.value.split('|');
        this.sortBy = field;
        this.sortOrder = order;
        this.applyFiltersSearchSort();
      },
      sortRecords(records) {
        return records.slice().sort((a, b) => {
          const valueA = this.sortBy === 'date_borrowed' ? new Date(a[this.sortBy]) : a[this.sortBy].toLowerCase();
          const valueB = this.sortBy === 'date_borrowed' ? new Date(b[this.sortBy]) : b[this.sortBy].toLowerCase();
          
          if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
          if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }
    },
    watch: {
      searchQuery() {
        this.handleSearch();
      },
      filterBy() {
        this.handleSearch();
      },
      sortBy() {
        this.handleSearch();
      },
      sortOrder() {
        this.handleSearch();
      }
    },
    created() {
      this.fetchHistoryRecords();
    },
    template: `
      <div>
        <Navbar/>
        <div class="bookscontainer">
          <center>
            <p class="section-title" style="margin:10px; color: #3c2a1a;">View History of eBooks</p>
          </center>
  
          <!-- Error Handling -->
          <p v-if="error" class="error">{{ error }}</p>
  
          <!-- Search, Filter, and Sort Controls -->
          <div class="search-bar" style="padding:20px;">
            <input v-model="searchQuery" placeholder="Search by name or eBook title" @input="handleSearch" />
            <select v-model="filterBy" @change="handleFilterChange">
              <option value="all">All</option>
              <option value="user">By User</option>
              <option value="ebook">By eBook</option>
            </select>
            <select v-model="filterBy" @change="handleSortChange">
              <option value="all" hidden>Sort</option>
               <option value="name|asc" selected >Sort by Name (A-Z)</option>
              <option value="name|desc">Sort by Name (Z-A)</option>
              <option value="ebook_title|asc">Sort by eBook Title (A-Z)</option>
          <option value="date_borrowed|desc">Sort by Date Borrowed (Newest First)</option>
    
              <option value="ebook_title|desc">Sort by eBook Title (Z-A)</option>
              <option value="date_borrowed|asc">Sort by Date Borrowed (Oldest First)</option>
           </select>
          <!-- History Records Section -->
          <div class="history-section" style="margin:20px;">
            <table v-if="filteredRecords.length > 0" class="books-table">
              <thead style="color: white;">
                <tr>
                  <th>Name</th>
                  <th>eBook Title</th>
                  <th>Date Borrowed</th>
                  <th>Status</th>
                  <th>Return Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in getPaginatedItems(filteredRecords, historyPage)" :key="record.id">
                  <td>{{ record.name }}</td>
                  <td>{{ record.ebook_title }}</td>
                  <td>{{ new Date(record.date_borrowed).toLocaleDateString() }}</td>
                  <td>
                    <span v-if="record.status === 'bought'">Bought</span>
                    <span v-if="record.status === 'currently borrowed'">Currently Borrowed</span>
                    <span v-if="record.status === 'requested'">Requested</span>
                    <span v-if="record.status === 'previously borrowed'">Previously Borrowed</span>
                  </td>
                  <td>
                    <span v-if="record.status === 'currently borrowed' || record.status === 'previously borrowed'">
                      {{ new Date(record.return_date).toLocaleDateString() }}
                    </span>
                    <span v-else> N/A </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <center>
              <h4 class="section-content" v-if="filteredRecords.length === 0">No History Records</h4>
              <div v-if="filteredRecords.length > 0">
                <button @click="changePage(Math.max(historyPage - 1, 1))" :disabled="historyPage === 1">Previous</button>
                <span v-for="page in getPageNumbers(filteredRecords.length)" :key="page">
                  <button @click="changePage(page)" :class="{ active: page === historyPage }">{{ page }}</button>
                </span>
                <button @click="changePage(Math.min(historyPage + 1, getPageNumbers(filteredRecords.length).length)  )" :disabled="historyPage >= getPageNumbers(filteredRecords.length).length">Next</button>
              </div>
            </center>
          </div>
        </div>
      </div></div>
    `,
  };
  
  export default AdminHistory;
  