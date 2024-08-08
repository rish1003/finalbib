import Navbar from "../components/Navbar.js";
import EbookCard from "../components/EbookCard.js";

const Reader = {
  data() {
    return {
      booksByCategory: {},
      expandedCategories: {},
      isLoading: true,
      error: null,
      searchQuery: '',
      searchType: 'both'
    };
  },
  methods: {
    toggleCategory(category) {
      this.$set(this.expandedCategories, category, !this.expandedCategories[category]);
    },
    fetchBooks() {
      fetch('/fetch/books')
        .then(response => response.json())
        .then(data => {
          this.booksByCategory = data;
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching books:', error);
          this.error = 'Failed to load books. Please try again later.';
          this.isLoading = false;
        });
    },
    handleSearch() {
      this.$forceUpdate();
    },
    clearSearch() {
      this.searchQuery = "";
    },
    navigateToEbookDetail(ebookId) {
      let viewedBooks = JSON.parse(localStorage.getItem('viewedBooks')) || [];
      console.log(viewedBooks);
  
      // Add the new book ID to the list
      if (!viewedBooks.includes(ebookId)) {
        viewedBooks.unshift(ebookId); // Add to the beginning of the list
        // Ensure the list doesn't exceed 10 items
        if (viewedBooks.length > 10) {
          viewedBooks.pop(); // Remove the oldest item
        }
        localStorage.setItem('viewedBooks', JSON.stringify(viewedBooks));
      }
      this.$router.push({ name: 'EbookDetailPage', params: { id: ebookId } });
    }
  },
  created() {
    this.fetchBooks();
  },
  computed: {
    hasMoreThanFiveBooks() {
      return (category) => {
        return this.booksByCategory[category] && this.booksByCategory[category].length > 5;
      };
    },
    filteredCategories() {
      const query = this.searchQuery.toLowerCase();
      const searchType = this.searchType;

      if (!query) return this.booksByCategory;

      const filtered = {};
      for (const [category, books] of Object.entries(this.booksByCategory)) {
        const categoryMatch = searchType === 'category' || searchType === 'both' ? category.toLowerCase().includes(query) : false;
        const booksMatch = books.filter(book => 
          (searchType === 'book' || searchType === 'both') && book.name.toLowerCase().includes(query) ||
          (searchType === 'author' || searchType === 'both') && book.author.toLowerCase().includes(query)
        );
        
        if (categoryMatch || booksMatch.length > 0) {
          filtered[category] = categoryMatch ? books : booksMatch;
        }
      }
      return filtered;
    },
    noResults() {
      return Object.keys(this.filteredCategories).length === 0 && this.searchQuery;
    },
    resultsTitle() {
      if (this.noResults) {
        return 'No Results Found!';
      }
      if (this.searchQuery) {
        return `Showing results for "${this.searchQuery}"`;
      }
      return 'Explore the Newest Books';
    }
  },
  template: `
    <div class="reader-dashboard">
      <Navbar />
      <div class="container">
        <div class="intro-section">
          <div class="intro-content">
            <h1 class="dashboard-title"><b>Reader Dashboard</b></h1>
            <p class="welcome-text">Welcome to the Reader Dashboard! Discover your next great read from our curated selection.</p>
          </div>
        </div>
        <div class="search-bar">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by category, book name, or author..."
          />
          <select v-model="searchType" class="search-type-selector">
            <option value="both">Search in All</option>
            <option value="category">Search by Category</option>
            <option value="book">Search by Book Name</option>
            <option value="author">Search by Author Name</option>
          </select>
          <button @click="handleSearch" class="search-button">Search</button>
          <button @click="clearSearch" class="search-button">Clear</button>
        </div>
        <h2 class="explore-title">{{ resultsTitle }}</h2>
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
        <div v-if="noResults" class="no-results">
          <h3></h3>
          <p>Oops! Looks like we couldn't find anything matching your query. Maybe try searching for something else?</p>
        </div>
        <div v-else>
          <div v-for="(books, category) in filteredCategories" :key="category" class="category-section">
            <h3 class="category-title" >
              {{ category }}
              <button
                v-if="hasMoreThanFiveBooks(category)"
                class="toggle-button"
                @click="toggleCategory(category)"
              >
                {{ expandedCategories[category] ? 'Show Less' : 'Show More' }}
              </button>
            </h3>
            <div :class="['book-list', { 'expanded': expandedCategories[category] }]">
              <EbookCard
                v-for="(book, index) in expandedCategories[category] ? books : books.slice(0, 5)"
                :key="index"
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
        </div>
      </div>
    </div>
  `,
  components: {
    Navbar,
    EbookCard
  }
};

export default Reader;
