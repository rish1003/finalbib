const EbookCard = {
  props: {
    name: String,
    imageUrl: String,
    author: String,
    section: String,
    id: String, // Add an ID prop for identifying which book is clicked
    summary: String
  },
  methods: {
    handleClick() {
      // Emit a custom event with the book ID
      this.$emit('click', this.id);
    }
  },
  template: `
    <div class="ebook-card" @click="handleClick">
      <img :src="imageUrl" alt="Book Cover" class="ebook-card-image" />
      <div class="content">
        <h3 class="ebook-card-title">{{ name }}</h3>
        <p class="ebook-card-author">{{ author }}</p>
        <p class="ebook-card-section">{{ section }}</p>
         <div class="summary">{{ summary }}</div>
      </div>
    </div>
  `
};

export default EbookCard;
