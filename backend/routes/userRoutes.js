const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signin', userController.signIn);
router.get("/user/:username", userController.getUserDetails);
router.post('/forgot-password', userController.forgotPassword);
// Add to userRoutes.js
router.post('/user/family', userController.addFamilyMember);
router.get('/user/:username/family', userController.getFamilyMembers);
router.delete('/user/family/:familyUsername', userController.deleteFamilyMember);

module.exports = router;