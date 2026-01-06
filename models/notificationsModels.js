const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    goals_scored: {
        type: Boolean,
        default: false
    },
    assists: {
        type: Boolean,
        default: false
    },
    penalties_missed: {
        type: Boolean,
        default: false
    },
    penalties_saved: {
        type: Boolean,
        default: false
    },
    yellow_cards: {
        type: Boolean,
        default: false
    },
    red_cards: {
        type: Boolean,
        default: false
    },
    deadline_time: {
        type: Boolean,
        default: false
    },
    fixture_removed: {
        type: Boolean,
        default: false
    },
    news: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
