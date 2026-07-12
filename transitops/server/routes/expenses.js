const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const validateExpense = [
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('toll').optional().isFloat({ min: 0 }).withMessage('Toll cannot be negative'),
  body('other').optional().isFloat({ min: 0 }).withMessage('Other cannot be negative'),
  body('maintenanceLinked').optional().isFloat({ min: 0 }).withMessage('maintenanceLinked cannot be negative')
];

router.use(auth);
router.use(authorize('canManageFuelExpenses'));

router.get('/', expenseController.getExpenses);
router.post('/', validateExpense, expenseController.createExpense);
router.put('/:id', validateExpense, expenseController.updateExpense);

module.exports = router;
