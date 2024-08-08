// PdfReader.js
const PdfReader = {
    template: `
      <div class="pdf-reader">
        <div class="controls">
          <button @click="prevPage">Previous</button>
          <input type="range" v-model="currentPage" :min="1" :max="numPages" @input="goToPage" />
          <button @click="nextPage">Next</button>
        </div>
        <div>
          Page {{ currentPage }} of {{ numPages }}
        </div>
        <canvas ref="pdfCanvas"></canvas>
      </div>
    `,
    props: {
      pdfUrl: String
    },
    data() {
      return {
        pdf: null,
        currentPage: 1,
        numPages: 0
      };
    },
    methods: {
      loadPdf() {
        const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
        loadingTask.promise.then(pdf => {
          this.pdf = pdf;
          this.numPages = pdf.numPages;
          this.renderPage(this.currentPage);
        });
      },
      renderPage(pageNum) {
        this.pdf.getPage(pageNum).then(page => {
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = this.$refs.pdfCanvas;
          const context = canvas.getContext('2d');
  
          canvas.height = viewport.height;
          canvas.width = viewport.width;
  
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      },
      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderPage(this.currentPage);
        }
      },
      nextPage() {
        if (this.currentPage < this.numPages) {
          this.currentPage++;
          this.renderPage(this.currentPage);
        }
      },
      goToPage() {
        this.renderPage(this.currentPage);
      }
    },
    mounted() {
      this.loadPdf();
    }
  };
  
  export default PdfReader;
  