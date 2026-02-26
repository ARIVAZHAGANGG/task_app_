const router = require('express').Router();
const gamificationController = require('../controllers/gamification.controller');
const auth = require('../middleware/auth.middleware');

router.get('/stats', auth, gamificationController.getStats);
router.post('/arcade/reward', auth, gamificationController.rewardGamePoints);
router.get('/report/download', auth, gamificationController.downloadReport);

module.exports = router;
