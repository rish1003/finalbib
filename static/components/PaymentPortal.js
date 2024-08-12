const PaymentDialog = {
  props: {
    bookName: {
      type: String,
      default: 'Sample Book'
    },
    price: {
      type: Number,
      default: 19.99
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      paymentId: ''
    };
  },
  methods: {
    confirmPayment() {
      this.$emit('paymentConfirmed');
    },
    closeDialog() {
      this.$emit('close');
    }
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        // Code to show the modal
        $('#paymentModal').modal('show');
      } else {
        // Code to hide the modal
        $('#paymentModal').modal('hide');
      }
    }
  },
  template: `
    <div class="modal fade" id="paymentModal" tabindex="-1" role="dialog" aria-labelledby="paymentModalLabel" aria-hidden="true" v-if="visible">
      <div class="modal-dialog" role="document">
        <div class="modal-content card">
          <div class="modal-header">
            <h5 class="modal-title" id="paymentModalLabel">Complete Payment</h5>
            <button type="button" class="close" @click="closeDialog" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p><b>Book Name:</b> {{ bookName }}</p>
            <p><b>Price:</b> {{ price.toFixed(2) }}</p>
            <div class="form-group">
              <label for="paymentId">Payment ID</label>
              <input type="text" class="form-control" id="paymentId" v-model="paymentId" placeholder="Enter your payment ID" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" @click="confirmPayment">Confirm Payment</button>
            <button type="button" class="btn btn-secondary" @click="closeDialog"> Cancel </button>
 </div> 
        </div>
      </div>
    </div>
  `
};

export default PaymentDialog;