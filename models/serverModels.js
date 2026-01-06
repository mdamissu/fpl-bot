const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema({
    serverId: { type: String, unique: true, required: true },
    serverName: { type: String, required: true },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserTeam" 
    }]
}, { timestamps: true });

module.exports = mongoose.model("Server", ServerSchema);
