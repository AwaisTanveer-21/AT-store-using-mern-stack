
const express = require("express");

const {
    registerUser,
    loginUser,
    logoutUser,
    getUsers
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddelware");
const { admin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/users", protect, admin, getUsers);

module.exports = router;
