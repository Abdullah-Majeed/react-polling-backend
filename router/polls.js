const express = require('express');
const requireAuth = require('../middleware/requireAuth')
const { getAllPolls, getUserPolls, getPoll, createPoll, deletePoll, updatePoll, updatePollVote } = require('../controller/pollController')

const router = express.Router();

// Vote api
router.patch('/vote/:id', updatePollVote);
router.get('/all', getAllPolls)

// GET all polls


// authorization check
router.use(requireAuth);

router.get('/', getUserPolls);

// GET a single poll
router.get('/:id', getPoll);

// POST a new poll
router.post('/', createPoll);

// DELETE a poll
router.delete('/:id', deletePoll);

// UPDATE a poll
router.patch('/:id', updatePoll);

module.exports = router;