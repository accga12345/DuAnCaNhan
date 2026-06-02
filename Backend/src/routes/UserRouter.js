const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController')
const { authMiddleware, authUserMiddleware, authAdminMiddleware } = require('../middleware/authMiddleware');


router.post('/signup', userController.createUser)
router.post('/send-otp', userController.sendOtp)
router.post('/signin', userController.loginUser)
router.put('/update/:id', authUserMiddleware, userController.updateUser)
router.delete('/delete/:id', authAdminMiddleware, userController.deleteUser)
router.get('/get_all', authAdminMiddleware, userController.getAllUsers)
router.get('/get_by_id/:id', authUserMiddleware, userController.getUserById)
router.post('/refresh_token', userController.refreshTokenService)
router.post('/logout', userController.logoutUser)
router.delete('/delete_many_user', authAdminMiddleware, userController.deleteManyUser)
router.post('/forgot-password', userController.forgotPassword)
router.post('/reset-password', userController.resetPassword)

module.exports = router 
