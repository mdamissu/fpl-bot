const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    id: Number,
    name: String,
    team: String,
    position: String,
    baseline: { 
        price: Number,
        pts: Number,
        ppm: Number,
        tsb: Number,
    },
    current: {
        price: Number,
        pts: Number,
        ppm: Number,
        tsb: Number,
    }
}, { _id: false });

const watchlistSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    players: { type: [playerSchema], default: [] }
});

module.exports = mongoose.model("Watchlist", watchlistSchema);