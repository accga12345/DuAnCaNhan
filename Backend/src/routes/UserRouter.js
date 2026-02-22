const express = require('express');
const router = express.Router();
const userController = require('../controller/UserController')
const { authMiddleware, authUserMiddleware } = require('../middleware/authMiddleware');


router.post('/signup', userController.createUser)
router.post('/signin', userController.loginUser)
router.put('/update/:id', authUserMiddleware, userController.updateUser)
router.delete('/delete/:id', authMiddleware, userController.deleteUser)
router.get('/get_all', authMiddleware, userController.getAllUsers)
router.get('/get_by_id/:id', authUserMiddleware, userController.getUserById)
router.post('/refresh_token', userController.refreshTokenService)
router.post('/logout', userController.logoutUser)
router.delete('/delete_many_user', authMiddleware, userController.deleteManyUser)

module.exports = router 
