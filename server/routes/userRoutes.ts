const userController = require("../controllers/userController");

router.post("/", userController.search);

module.exports = router;
