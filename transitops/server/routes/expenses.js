const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const validateExpense = [
  body('vehicle').isMongoId().withMessage('Invalid Vehicle ID'),
  body('trip').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid Trip ID'),
  body('toll').optional().isFloat({ min: 0 }).withMessage('Toll cannot be negative'),
  body('other').optional().isFloat({ min: 0 }).withMessage('Other cannot be negative')
  // maintenanceLinked is NOT accepted from client — server computes it
  // total is NOT accepted from client — server computes it
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

router.use(auth);

router.get('/', authorize('fuelExpenses', 'view'), expenseController.getExpenses);
router.post('/', authorize('fuelExpenses', 'edit'), validateExpense, handleValidationErrors, expenseController.createExpense);
router.put('/:id', authorize('fuelExpenses', 'edit'), validateExpense, handleValidationErrors, expenseController.updateExpense);

module.exports = router;
