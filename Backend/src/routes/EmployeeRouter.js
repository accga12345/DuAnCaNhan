const express = require('express');
const router = express.Router();
const employeeController = require('../controller/EmployeeController')
const { authMiddleware, authAdminMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');

router.post('/create', authAdminMiddleware, employeeController.createEmployee)
router.post('/signin', employeeController.loginEmployee)
router.put('/update/:id', authMiddleware, employeeController.updateEmployee)
router.delete('/delete/:id', authAdminMiddleware, employeeController.deleteEmployee)
router.get('/get_all', authAdminMiddleware, employeeController.getAllEmployees)
router.get('/get_by_id/:id', authMiddleware, employeeController.getEmployeeById)
router.post('/refresh_token', employeeController.refreshTokenService)
router.post('/logout', employeeController.logoutEmployee)
router.delete('/delete_many_employee', authAdminMiddleware, employeeController.deleteManyEmployee)

module.exports = router 
