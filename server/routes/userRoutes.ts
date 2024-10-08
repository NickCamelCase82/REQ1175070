const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");

router.post("/", userController.search);
router.get("/proxy/bclaws", userController.fetchXml);
router.post("/summary", userController.fetchSummary);

module.exports = router;
