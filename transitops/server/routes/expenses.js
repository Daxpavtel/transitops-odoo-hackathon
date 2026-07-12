const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { body } = require('express-validator');

const validateExpense = [
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('toll').optional().isFloat({ min: 0 }).withMessage('Toll cannot be negative'),
  body('other').optional().isFloat({ min: 0 }).withMessage('Other cannot be negative'),
  body('maintenanceLinked').optional().isFloat({ min: 0 }).withMessage('maintenanceLinked cannot be negative')
];

router.get('/', expenseController.getExpenses);
router.post('/', validateExpense, expenseController.createExpense);
router.put('/:id', validateExpense, expenseController.updateExpense);

module.exports = router;
