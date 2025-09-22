const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  viewUsers,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/authController");

// View all users
router.get("/users", viewUsers);

// const validateToken = require("../../middleware/validateTokenHandler");
// const validateAdmin = require("../../middleware/validateAdminHandler");

router.post("/signup", signupUser);
router.post("/login", loginUser);
// router.post("/refresh", );
// router.post("/logout", validateToken, logoutUser);

// router.get("/profile",  (req, res) => {
//   res.json({ message: "Welcome!", user: req.user });
// });



module.exports = router;
