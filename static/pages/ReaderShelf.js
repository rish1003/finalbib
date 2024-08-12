import Navbar from "../components/Navbar.js";
import EbookCard from "../components/EbookCard.js";

const ReaderShelf = {
  data() {
    return {
      borrowedBooks: [],
      boughtBooks: [],
      isLoading: true,
      error: null,
      token: localStorage.getItem('token')
    };
  },
  methods: {
    fetchUserBooks() {
      const userId = localStorage.getItem('id');
      Promise.all([
        fetch(`/fetch/borrowed_books/${userId}`, {
          headers: {
            'Authentication-Token': this.token
          }
        }).then(response => response.json()),
        fetch(`/fetch/bought_books/${userId}`, {
          headers: {
            'Authentication-Token': this.token
          }
        }).then(response => response.json())
      ])
      .then(([borrowedData, boughtData]) => {
        this.borrowedBooks = borrowedData.books;
        this.boughtBooks = boughtData.books;
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error fetching books:', error);
        this.error = 'Failed to load books. Please try again later.';
        this.isLoading = false;
      });
    },
    navigateToEbookDetail(ebookId) {
      this.$router.push({ name: 'EbookDetailPage', params: { id: ebookId } });
    }
  },
  created() {
    this.fetchUserBooks();
  },
  template: `
    <div class="user-shelf">
      <Navbar />
      <div class="container">
        <div class="intro-section">
          <div class="intro-content">
            <h1 class="dashboard-title"><b>Reader Shelf</b></h1>
            <p class="welcome-text">All your borrowed/bought books in one place!</p>
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

        <div v-if="!isLoading && borrowedBooks.length">
          <h2 class="section-title">Borrowed Books</h2>
          <div class="book-list">
            <EbookCard
              v-for="book in borrowedBooks"
              :key="book.id"
              :name="book.name"
              :imageUrl="book.imageUrl"
              :author="book.author"
              :section="book.section"
              :summary="book.summary"
              :id="book.id"
              @click="navigateToEbookDetail(book.id)"
            />
          </div>
        </div>

        <div v-if="!isLoading && boughtBooks.length">
          <h2 class="section-title">Bought Books</h2>
          <div class="book-list">
            <EbookCard
              v-for="book in boughtBooks"
              :key="book.id"
              :name="book.name"
              :imageUrl="book.imageUrl"
              :author="book.author"
              :section="book.section"
              :summary="book.summary"
              :id="book.id"
              @click="navigateToEbookDetail(book.id)"
            />
          </div>
        </div>

        <div v-if="!isLoading && !borrowedBooks.length && !boughtBooks.length">
          <center><p class="shelf-text">No books found in your shelf! Browse our collection to find your fit!</p></center>
        </div>
      </div>
    </div>
  `,
  components: {
    Navbar,
    EbookCard
  }
};

export default ReaderShelf;
