const mongoose = require("mongoose");

const MyTeamSchema = new mongoose.Schema({
    discordId: { type: String, unique: true, required: true },
    handle: { type: String, required: true },
    entryId: { type: Number, required: true },
    totalPoints: { type: Number, default: 0 },
    overallRank: { type: Number, default: 0 },
    eventPoints: { type: Number, default: 0 },
    eventRank: { type: Number, default: 0 },
    region: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('UserTeam', MyTeamSchema);
