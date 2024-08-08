// Modal.js
const Modal = {
    template: `
      <div class="modal-overlay" v-if="visible">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button @click="closeModal">X</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    `,
    props: {
      title: String,
      visible: Boolean
    },
    methods: {
      closeModal() {
        this.$emit('close');
      }
    }
  };
  
  export default Modal;
  