const express = require('express');
const controller = require('../controllers/journal.controller');
const verifyJWT = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(verifyJWT);

router.post('/', controller.createJournal);
router.get('/my', controller.getMyJournals);
router.get('/:id', controller.getJournalById);
router.patch('/:id', controller.updateJournal);
router.delete('/:id', controller.deleteJournal);

module.exports = router;
