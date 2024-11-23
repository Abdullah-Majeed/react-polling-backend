const path = require('path');
const fs = require('fs');
const Poll = require('../models/pollModel');
const mongoose = require('mongoose');
const tinify = require("tinify");
tinify.key = process.env.TINIFY_KEY;

// get all polls
const getAllPolls = async (req, res) => {
    const polls = await Poll.find({}).sort({ createdAt: -1 });
    res.status(200).json(polls);
}
// get user polls
const getUserPolls = async (req, res) => {
    const user_id = req.user._id;
    const polls = await Poll.find({ user_id }).sort({ createdAt: -1 });
    res.status(200).json(polls);
}

const getPoll = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "No such poll" })
    }
    const poll = await Poll.findById(id);

    if (!poll) {
        return res.status(404).json({ error: "No such poll" })
    }
    res.status(200).json(poll);
}

const createPoll = async (req, res) => {
    const { question, options, image } = req.body;
    let emptyFields = [];
    if (!question) {
        emptyFields.push('question')
    }
    if (!options || options.length < 2 || options.length > 5) {
        emptyFields.push('options')
    }
    if (!image) {
        emptyFields.push('image')
    }
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all the fields', emptyFields })
    }
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid poll image.' });
    }
    try {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const fileExtension = mimeType.split('/')[1];

        // Save Base64 data to a temporary file
        const tempFilePath = path.join(__dirname, `temp_image.${fileExtension}`);
        fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
        const originalFileSize = fs.statSync(tempFilePath).size;

        // Optimize image using TinyPNG
        const source = tinify.fromFile(tempFilePath);
        const compressedFilePath = path.join(__dirname, `compressed_image.${fileExtension}`);
        await source.toFile(compressedFilePath);

        // Convert compressed image to Base64
        const compressedImageData = fs.readFileSync(compressedFilePath);
        const compressedBase64 = `data:${mimeType};base64,${compressedImageData.toString('base64')}`;
        const compressedFileSize = fs.statSync(compressedFilePath).size;

        // Clean up temporary files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(compressedFilePath);

        const user_id = req.user._id
        const poll = await Poll.create({ question, options, image: compressedBase64, user_id });
        res.status(200).json({
            message: {
                originalSize: `${(originalFileSize / 1024).toFixed(2)} KB`,
                compressedSize: `${(compressedFileSize / 1024).toFixed(2)} KB`,
                poll
            }
        });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
}

const deletePoll = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such poll' });
    }
    const poll = await Poll.findOneAndDelete({ _id: id });
    if (!poll) {
        return res.status(404).json({ error: 'No such poll' });
    }
    res.status(200).json(poll);
}

const updatePoll = async (req, res) => {
    const { id } = req.params;
    const { question, options, image } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such poll' });
    }
    const oldImage = await Poll.findOne({ _id: id }).select('image');

    if (image !== oldImage) {
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid poll image.' });
        }
        const mimeType = matches[1];
        const base64Data = matches[2];
        const fileExtension = mimeType.split('/')[1];

        // Save Base64 data to a temporary file
        const tempFilePath = path.join(__dirname, `temp_image.${fileExtension}`);
        fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));

        // Optimize image using TinyPNG
        const source = tinify.fromFile(tempFilePath);
        const compressedFilePath = path.join(__dirname, `compressed_image.${fileExtension}`);
        await source.toFile(compressedFilePath);

        // Convert compressed image to Base64
        const compressedImageData = fs.readFileSync(compressedFilePath);
        const compressedBase64 = `data:${mimeType};base64,${compressedImageData.toString('base64')}`;

        // Clean up temporary files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(compressedFilePath);
        const poll = await Poll.findOneAndUpdate({ _id: id }, {
            question, options, image: compressedBase64
        })
        if (!poll) {
            return res.status(404).json({ error: 'No such poll' });
        }
        return res.status(200).json(poll);
    }
    else {
        const poll = await Poll.findOneAndUpdate({ _id: id }, {
            ...req.body
        })
        if (!poll) {
            return res.status(404).json({ error: 'No such poll' });
        }
        return res.status(200).json(poll);
    }

}
const updatePollVote = async (req, res) => {
    const { id } = req.params;
    const { optionText } = req.body;
    if (!optionText) {
        return res.status(404).json({ error: 'option text not found!' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such poll' });
    }
    try {
        const poll = await Poll.findOneAndUpdate({ _id: id, 'options.text': optionText }, { $inc: { 'options.$.vote': 1 } },         // Increment votes for the matched option
            { new: true })
        if (!poll) {
            return res.status(404).json({ error: 'No such poll' });
        }
        return res.status(200).json(poll);
    }
    catch (error) {
        return res.status(404).json({ error: error.message });
    }
}

module.exports = { getAllPolls, getUserPolls, getPoll, createPoll, deletePoll, updatePoll, updatePollVote }