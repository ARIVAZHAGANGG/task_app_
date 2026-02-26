const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const billing = require('../controllers/billing.controller');

// Time Summary
router.get('/time-summary', auth, billing.getTimeSummary);

// Invoices
router.get('/invoices', auth, billing.getInvoices);
router.post('/invoices', auth, billing.createInvoice);
router.get('/invoices/:id', auth, billing.getInvoice);
router.put('/invoices/:id', auth, billing.updateInvoice);
router.delete('/invoices/:id', auth, billing.deleteInvoice);

module.exports = router;
