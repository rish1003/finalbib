import Navbar from "../components/Navbar.js";

const AdminManagement = {
  data() {
    return {
      sections: [],
      ebooks: [],
      newSection: { name: "", description: "" },
      newEbook: {
        id: "",
        name: "",
        subname: "",
        summary: "",
        content: "",
        author: "",
        num_pages: 0,
        sections: [],
        cover_image: null,
        file: null,
      },
      editSection: null,
      editEbook: null,
      error: null,
      searchQuerySections: "", // Search query for sections
      searchQueryEbooks: "", // Search query for eBooks
      filterSection: "", // Filter for eBooks by section
      filterBy: "all", // Filter for eBooks
      sortBySections: "name", // Sort by sections
      sortByEbooks: "name", // Sort by eBooks
      currentPageSections: 1,
      currentPageEbooks: 1,
      itemsPerPage: 5,
      dialogSection: false,
      dialogEbook: false,
      editModeSection: false,
      editModeEbook: false,
    };
  },
  components: {
    Navbar,
  },
  methods: {
    async fetchSections() {
      try {
        const response = await fetch("/api/sections");
        this.sections = await response.json();
      } catch (error) {
        console.error("Error fetching sections:", error);
        this.error = "Failed to load sections. Please try again later.";
      }
    },
    async fetchEbooks() {
      try {
        const response = await fetch("/api/ebooks");
        this.ebooks = await response.json();
      } catch (error) {
        console.error("Error fetching eBooks:", error);
        this.error = "Failed to load eBooks. Please try again later.";
      }
    },
    async createSection() {
      try {
        const response = await fetch("/api/sections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.newSection),
        });
        const newSectionId = await response.json();
        this.sections.push({ ...this.newSection, id: newSectionId });
        this.newSection = { name: "", description: "" };
        this.dialogSection = false;
        window.location.reload();
      } catch (error) {
        console.error("Error creating section:", error);
        this.error = "Failed to create section. Please try again later.";
      }
    },
    async updateSection() {
      try {
        await fetch(`/api/sections/${this.editSection.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.editSection),
        });
        this.editSection = null;
        this.dialogSection = false;
        window.location.reload();
      } catch (error) {
        console.error("Error updating section:", error);
        this.error = "Failed to update section. Please try again later.";
      }
    },
    async deleteSection(sectionId) {
      try {
        await fetch(`/api/sections/${sectionId}`, {
          method: "DELETE",
        });
        this.sections = this.sections.filter(section => section.id !== sectionId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting section:", error);
        this.error = "Failed to delete section. Please try again later.";
      }
    },
    async createEbook() {
      try {
        const formData = new FormData();
        Object.keys(this.newEbook).forEach(key => {
          if (key === "sections") {
            this.newEbook.sections.forEach(sectionId => {
              formData.append("sections", sectionId);
            });
          } else {
            formData.append(key, this.editEbook[key]);
          }
        });
        const response = await fetch("/api/ebooks", {
          method: "POST",
          body: formData,
        });
        const newEbookId = await response.json();
        this.ebooks.push({ ...this.newEbook, id: newEbookId });
        this.newEbook = {
          id: "",
          name: "",
          subname: "",
          summary: "",
          content: "",
          author: "",
          num_pages: 0,
          sections: [],
          file: null,
          cover_image: null,
        };
        this.dialogEbook = false;
        window.location.reload();
      } catch (error) {
        console.error("Error creating eBook:", error);
        this.error = "Failed to create eBook. Please try again later.";
      }
    },
    async updateEbook() {
      try {
        const formData = new FormData();
        Object.keys(this.editEbook).forEach(key => {
          if (key === "sections") {
            this.editEbook.sections.forEach(sectionId => {
              formData.append("sections", sectionId);
            });
          } else {
            formData.append(key, this.editEbook[key]);
          }
        });
        await fetch(`/api/ebooks/${this.editEbook.id}`, {
          method: "PUT",
          body: formData,
        });
        
        this.editEbook = null;
        this.dialogEbook = false;
        window.location.reload();
      } catch (error) {
        console.error("Error updating eBook:", error);
        this.error = "Failed to update eBook. Please try again later.";
      }
    },
    async deleteEbook(ebookId) {
      try {
        await fetch(`/api/ebooks/${ebookId}`, {
          method: "DELETE",
        });
        this.ebooks = this.ebooks.filter(ebook => ebook.id !== ebookId);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting eBook:", error);
        this.error = "Failed to delete eBook. Please try again later.";
      }
    },
    async fetchAndUpdateData() {
      await this.fetchSections();
      await this.fetchEbooks();
    },
    openDialogSection(editMode, section ) {
      this.editModeSection = editMode;
   
      this.editSection = section ? { ...section } : { name: "", description: "" };
      this.dialogSection = true;
    },
    openDialogEbook(editMode, ebook) {
      this.editModeEbook = editMode;
      this.editEbook = ebook ? { ...ebook } : {
        id: "",
        name: "",
        subname: "",
        summary: "",
        content: "",
        author: "",
        num_pages: 0,
        sections: [],
        cover_image: null,
        file: null,
      };
      this.dialogEbook = true;
    },
    handleFileChange(field, event) {
      this.editEbook[field] = event.target.files[0];
    },
    sortSections() {
      this.sections.sort((a, b) => {
        const comparison = a[this.sortBySections].localeCompare(b[this.sortBySections]);
        return this.sortBySections === "name" ? comparison : -comparison;
      });
    },
    sortEbooks() {
      this.ebooks.sort((a, b) => {
        const comparison = a[this.sortByEbooks].localeCompare(b[this.sortByEbooks]);
        return this.sortByEbooks === "name" ? comparison : -comparison;
      });
    },
  },
  computed: {
    filteredSections() {
      return this.sections.filter(section =>
        section.name.toLowerCase().includes(this.searchQuerySections.toLowerCase())
      );
    },
    filteredEbooks() {
      return this.ebooks
        .filter(ebook => 
          ebook.name.toLowerCase().includes(this.searchQueryEbooks.toLowerCase())
        )
        .filter(ebook => 
          this.filterSection === "" || ebook.sections.includes(this.filterSection)
        );
    },
    paginatedSections() {
      const start = (this.currentPageSections - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredSections.slice(start, end);
    },
    paginatedEbooks() {
      const start = (this.currentPageEbooks - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredEbooks.slice(start, end);
    },
    totalPagesSections() {
      return Math.ceil(this.filteredSections.length / this.itemsPerPage);
    },
    totalPagesEbooks() {
      return Math.ceil(this.filteredEbooks.length / this.itemsPerPage);
    },
  },
  watch: {
    searchQuerySections() {
      this.currentPageSections = 1;
    },
    searchQueryEbooks() {
      this.currentPageEbooks = 1;
    },
    filterSection() {
      this.currentPageEbooks = 1;
    },
    sortBySections() {
      this.sortSections();
      this.currentPageSections = 1;
    },
    sortByEbooks() {
      this.sortEbooks();
      this.currentPageEbooks = 1;
    },
  },
  mounted() {
    this.fetchAndUpdateData();
  },
  template: `
    <div>
      <Navbar />
      <div class="container mt-5">
        <h2>Section Management</h2>
         <button @click="openDialogSection(false)">Create Section</button>
        <div class="search-bar">
        <input v-model="searchQuerySections" placeholder="Search Sections..." />
         <select v-model="sortBySections" @change="sortSections">
          <option value="name">Sort by Name</option>
         
        </select> </div>
       
       
        <table class="books-table">
          <thead>
            <tr>
              <th>Name</th>
             
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSections.length === 0">
              <td colspan="3">No results found.</td>
            </tr>
            <tr v-for="section in paginatedSections" :key="section.id">
              <td>{{ section.name }}</td>
              
              <td>
                <button @click="openDialogSection(true, section)">Edit</button>
                <button @click="deleteSection(section.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <button @click="currentPageSections--" :disabled="currentPageSections === 1">Previous</button>
          <span>Page {{ currentPageSections }} of {{ totalPagesSections }}</span>
          <button @click="currentPageSections++" :disabled="currentPageSections === totalPagesSections">Next</button>
        </div>

        <h2>eBook Management</h2>
        
        <button @click="openDialogEbook(false)">Create eBook</button>
        <div class="search-bar" >
        <input v-model="searchQueryEbooks" placeholder="Search eBooks..." />  
        <select style="background-color:white;" v-model="filterSection">
          <option value="">All Sections</option>
          <option v-for="section in sections" :value="section.id" :key="section.id">{{ section.name }}</option>
        </select> 
        <select style="background-color:white;" v-model="sortByEbooks" @change="sortEbooks">
          <option value="name">Sort by Name</option>
          <option value="author">Sort by Author</option>
        </select></div>
       
        
        <table class="books-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Author</th>
              <th>Number of Pages</th>
              <th>Cover</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredEbooks.length === 0">
              <td colspan="5">No results found.</td>
            </tr>
            <tr v-for="ebook in paginatedEbooks" :key="ebook.id">
              <td>{{ ebook.name }}</td>
              <td>{{ ebook.author }}</td>
              <td>{{ ebook.num_pages }}</td>
              <td><img :src="ebook.url" alt="Cover" width="50" /></td>
              <td>
                <button @click="openDialogEbook(true, ebook)">Edit</button>
                <button @click="deleteEbook(ebook.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <button @click="currentPageEbooks--" :disabled="currentPageEbooks === 1">Previous</button>
          <span>Page {{ currentPageEbooks }} of {{ totalPagesEbooks }}</span>
          <button @click="currentPageEbooks++" :disabled="currentPageEbooks === totalPagesEbooks">Next</button>
        </div>
      </div>

      <!-- Section Dialog -->
      <div v-if="dialogSection" class="dialog">
        <h2>{{ editModeSection ? "Edit Section" : "Create Section" }}</h2>
        <label>Name:
          <input v-model="editSection.name" />
        </label>
        
        <button @click="editModeSection ? updateSection() : createSection()">
          {{ editModeSection ? "Update" : "Create" }}
        </button>
        <button @click="dialogSection = false">Cancel</button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <!-- eBook Dialog -->
      <div v-if="dialogEbook" class="dialog">
        <h2>{{ editModeEbook ? "Edit eBook" : "Create eBook" }}</h2>
        <label>Name:
          <input v-model="editEbook.name" />
        </label>
        <label>Subname:
          <input v-model="editEbook.subname" />
        </label>
        <label>Summary:
          <textarea v-model="editEbook.summary"></textarea>
        </label>
        <label>Content:
          <textarea v-model="editEbook.content"></textarea>
        </label>
        <label>Author:
          <input v-model="editEbook.author" />
        </label>
        <label>Number of Pages:
          <input type="number" v-model="editEbook.num_pages" />
        </label>
        <label>Sections:
          <select v-model="editEbook.sections" multiple>
            <option v-for="section in sections" :value="section.id" :key="section.id">{{ section.name }}</option>
          </select>
        </label>
        <label>Cover Image:
          <input type="file" @change="handleFileChange('cover_image', $event)" />
        </label>
        <label>File:
          <input type="file" @change="handleFileChange('file', $event)" />
        </label>
        <button @click="editModeEbook ? updateEbook() : createEbook()">
          {{ editModeEbook ? "Update" : "Create" }}
        </button>
        <button @click="dialogEbook = false">Cancel</button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  `,
};

export default AdminManagement;
