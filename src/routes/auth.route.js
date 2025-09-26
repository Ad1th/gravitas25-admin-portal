const express = require("express");
const router = express.Router();
const {
  loginUser,
  viewUsers,
  createInitialAdmin,
} = require("../controllers/authController");

// View all users
router.get("/users", viewUsers);

// Create initial admin (for testing)
router.post("/setup", createInitialAdmin);

// const validateToken = require("../../middleware/validateTokenHandler");
// const validateAdmin = require("../../middleware/validateAdminHandler");

// router.post("/signup", signupUser); // Disabled - no new admin creation allowed
router.post("/login", loginUser);
// router.post("/refresh", );
// router.post("/logout", validateToken, logoutUser);

// router.get("/profile",  (req, res) => {
//   res.json({ message: "Welcome!", user: req.user });
// });



module.exports = router;
