const BASE_URL = "https://fantasy.premierleague.com/api/entry/";
const PendingVerify = require("../models/pendingVerifyModels");

async function verifyEntry(entryId) {
    const url = `${BASE_URL}${entryId}/`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://fantasy.premierleague.com/"
        }
    });
    if (!res.ok) throw new Error("Invalid entry ID");
    return res.json();
}

async function fetchSquad(entryId) {
    try {
        const data = await verifyEntry(entryId);
        const currentEvent = data.current_event;

        // Fetch squad for all GW
        const promises = [];
        for (let i = 1; i <= currentEvent; i++) {
            const url = `${BASE_URL}${entryId}/event/${i}/picks/`;
            promises.push(
                fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Referer": "https://fantasy.premierleague.com/"
                    }
                }).then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch picks for event ${i}`);
                    return res.json();
                })
            );
        }

        const results = await Promise.all(promises);
        return results;
    } catch (err) {
        console.error("Error in fetchSquad:", err);
        throw new Error("Failed to fetch squad");
    }
}

async function fetchHistory(entryId) {
    try {
        const url = `${BASE_URL}${entryId}/history/`;
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://fantasy.premierleague.com/"
            }
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
    } catch (err) {
        console.error("Error in fetchHistory:", err);
        throw new Error("Failed to fetch history");
    }
}

function generateVerifyCode(){
    return "FPL-" + Math.random().toString(36).substring(2,8).toUpperCase();
}

async function savePendingVerify(discordId, username, entryId, code){
    await PendingVerify.findOneAndUpdate(
        { discordId },
        {
            discordId,
            username,
            entryId,
            code,
            createdAt: new Date()
        },
        { upsert:true }
    );
}

async function hasActivePending(discordId){
    const doc = await PendingVerify.findOne({ discordId });
    return !!doc;
}

async function getPendingVerify(discordId){
    return PendingVerify.findOne({ discordId });
}

async function confirmLink(discordId){
    await PendingVerify.deleteOne({ discordId });
}

module.exports = {
    verifyEntry,
    fetchSquad,
    fetchHistory,

    generateVerifyCode,
    savePendingVerify,
    hasActivePending,
    getPendingVerify,
    confirmLink
};
