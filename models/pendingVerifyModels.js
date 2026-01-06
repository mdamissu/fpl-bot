const mongoose = require("mongoose");

const pendingVerifySchema = new mongoose.Schema({
    discordId: { type:String, required:true, unique:true },
    username: String,
    entryId: Number,
    code: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
});

module.exports = mongoose.model("PendingVerify", pendingVerifySchema);
