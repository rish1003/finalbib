import Navbar from "../components/Navbar.js";

const AdminRequests = {
  data() {
    return {
      requestedBooks: [],
      borrowedBooks: [],
      error: null,
      requestedBooksPage: 1,
      borrowedBooksPage: 1,
      itemsPerPage: 5,
      token: localStorage.getItem("token")
    };
  },
  components: {
    Navbar
  },
  methods: {
    async fetchRequestedBooks() {
      try {
        const response = await fetch('/api/ebooks/requests', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });
        this.requestedBooks = await response.json();
      } catch (error) {
        console.error('Error fetching requested books:', error);
        this.error = 'Failed to load requested books. Please try again later.';
      }
    },
    async fetchBorrowedBooks() {
      try {
        const response = await fetch('/api/ebooks/borrowed', {
          method: 'GET',
          headers: {
            'Authentication-Token': this.token,
            'Content-Type': 'application/json'
          }
        });
        this.borrowedBooks = await response.json();
      } catch (error) {
        console.error('Error fetching borrowed books:', error);
        this.error = 'Failed to load borrowed books. Please try again later.';
      }
    },
    async approveRequest(bookId) {
      try {
        await fetch(`/api/ebooks/requests/${bookId}`, { method: 'PUT', headers: {
          
          'Authentication-Token': this.token,
        },body: JSON.stringify({ status: true }) });
        this.fetchRequestedBooks();  
        window.location.reload();
      } catch (error) {
        console.error('Error approving request:', error);
        this.error = 'Failed to approve request. Please try again later.';
      }
    },
    async denyRequest(bookId) {
      try {
        await fetch(`/api/ebooks/requests/${bookId}`, { method: 'DELETE', headers: {
          
          'Authentication-Token': this.token,
        },});
        
        this.fetchRequestedBooks(); 
        window.location.reload();
      } catch (error) {
        console.error('Error denying request:', error);
        this.error = 'Failed to deny request. Please try again later.';
      }
    },
    async revokeBorrow(bookId) {
      try {
        await fetch(`/api/ebooks/borrowed/${bookId}`, { method: 'PUT', headers: {
          
          'Authentication-Token': this.token,
        },body: JSON.stringify({ status: false, returned: true }) });
        this.fetchBorrowedBooks(); 
        window.location.reload();
      } catch (error) {
        console.error('Error revoking borrow:', error);
        this.error = 'Failed to revoke borrow. Please try again later.';
      }
    },
    getPaginatedItems(items, page) {
      const start = (page - 1) * this.itemsPerPage;
      const end = page * this.itemsPerPage;
      return items.slice(start, end);
    },
    changePage(section, newPage) {
      if (section === 'requestedBooks') {
        this.requestedBooksPage = newPage;
      } else if (section === 'borrowedBooks') {
        this.borrowedBooksPage = newPage;
      }
    },
    getPageNumbers(totalItems) {
      const pageCount = Math.ceil(totalItems / this.itemsPerPage);
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
  },
  created() {
    this.fetchRequestedBooks();
    this.fetchBorrowedBooks();
  },
  template: `
  <body>
    <div >
      <Navbar/>
      <div class="bookscontainer">
        <center>
          <p class="section-title" style="margin:10px; color: #3c2a1a;">Manage book requests and currently borrowed books.</p>
        </center>

       
        <p v-if="error" class="error">{{ error }}</p>

        <!-- Requested Books Section -->
        <div class="requests-section">
          <h3>Requested Books</h3>
          <table v-if="requestedBooks.length > 0" class="books-table">
            <thead style="color: white;">
              <tr>
                <th>Book Title</th>
                <th>Requester</th>
                <th>Requested Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in getPaginatedItems(requestedBooks, requestedBooksPage)" :key="book.id">
                <td>{{ book.title }}</td>
                <td>{{ book.requester }}</td>
                <td>{{ new Date(book.requested_date).toLocaleDateString() }}</td>
                <td>
                  <button @click="approveRequest(book.id)">Approve</button>
                  <button @click="denyRequest(book.id)">Deny</button>
                </td>
              </tr>
            </tbody>
          </table>
          <center>
            <h4 class="section-content" v-if="requestedBooks.length === 0">No Requests</h4>
            <div v-if="requestedBooks.length > 0">
              <button @click="changePage('requestedBooks', Math.max(requestedBooksPage - 1, 1))"  :disabled="requestedBooksPage === 1">Previous</button>
              <span v-for="page in getPageNumbers(requestedBooks.length)" :key="page">
                <button @click="changePage('requestedBooks', page)" :class="{ active: page === requestedBooksPage }">{{ page }}</button>
              </span>
              <button @click="changePage('requestedBooks', Math.min(requestedBooksPage + 1, getPageNumbers(requestedBooks.length).length))"  :disabled="requestedBooksPage >= getPageNumbers(requestedBooks.length).length">Next</button>
            </div>
          </center>
        </div>

        <!-- Borrowed Books Section -->
        <div class="requests-section">
          <h3>Currently Borrowed Books</h3>
          <table v-if="borrowedBooks.length > 0" class="books-table">
            <thead style="color: white;">
              <tr>
                <th>Book Title</th>
                <th>Borrower</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in getPaginatedItems(borrowedBooks, borrowedBooksPage)" :key="book.id">
                <td>{{ book.title }}</td>
                <td>{{ book.borrower }}</td>
                <td>{{ new Date(book.issue_date).toLocaleDateString() }}</td>
                <td>
                  <button @click="revokeBorrow(book.id)">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
          <center>
            <h4 class="section-content" v-if="borrowedBooks.length === 0">No Borrowed Books</h4>
            <div v-if="borrowedBooks.length > 0">
              <button @click="changePage('borrowedBooks', Math.max(borrowedBooksPage - 1, 1))" :disabled="borrowedBooksPage === 1">Previous</button>
              <span v-for="page in getPageNumbers(borrowedBooks.length)" :key="page">
                <button @click="changePage('borrowedBooks', page)" :class="{ active: page === borrowedBooksPage }">{{ page }}</button>
              </span>
              <button @click="changePage('borrowedBooks', Math.min(borrowedBooksPage + 1, getPageNumbers(borrowedBooks.length).length))"  :disabled="borrowedBooksPage >= getPageNumbers(borrowedBooks.length).length">Next</button>
            </div>
          </center>
        </div>
      </div>
    </div>
    </body>
  `,
};

export default AdminRequests;
