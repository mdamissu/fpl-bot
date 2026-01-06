const { fetchFPLData } = require("./fplService");
const { fetchPlayerSummary } = require("./summaryService");

// Formatting player transfers' raw data
async function fetchPlayerTransfers(playerId) {
    const summary = await fetchPlayerSummary(playerId);
    if (!summary?.history) return null;

    return summary.history.map(gw => ({
        gw: gw.round,
        transfers_in: gw.transfers_in,
        transfers_out: gw.transfers_out
    }));
}
// Formatting player points' raw data
async function fetchPlayerPoints(playerId) {
    const summary = await fetchPlayerSummary(playerId);
    if (!summary?.history) return null;

    let sum = 0;
    return summary.history.map(gw => {
        sum += gw.total_points;
        return { gw: gw.round, points: sum };
    });
}
// Formatting player form's raw data
async function fetchPlayerForm(playerId) {
    const summary = await fetchPlayerSummary(playerId);
    if (!summary?.history) return null;

    return summary.history.map((gw, i, arr) => {
        const recent = arr.slice(Math.max(0, i - 4), i + 1);
        const avg =
            recent.reduce((s, x) => s + x.total_points, 0) / recent.length;

        return { gw: gw.round, form: Number(avg.toFixed(2)) };
    });
}

// Build Cache
let transferRankCache = {};
let pointsRankCache = {};
let formRankCache = {};


async function buildAllRankCache() {
    console.log("Building rank cache...");

    const data = await fetchFPLData();
    if (!data?.elements) return;

    const histories = {}; // id -> history[]
    await Promise.all(
        data.elements.map(async p => {
            const s = await fetchPlayerSummary(p.id);
            if (s?.history) histories[p.id] = s.history;
        })
    );

    const ids = Object.keys(histories).map(Number);
    if (!ids.length) return;

    transferRankCache = {};
    pointsRankCache = {};
    formRankCache = {};

    ids.forEach(id => {
        transferRankCache[id] = [];
        pointsRankCache[id] = [];
        formRankCache[id] = [];
    });

    const maxGW = Math.max(...ids.map(id => histories[id].length));

    const prefixPoints = {};
    ids.forEach(id => (prefixPoints[id] = 0));

    for (let i = 0; i < maxGW; i++) {
        const gw = i + 1;

        // Transfer rank
        const transferArr = [];
        for (const id of ids) {
            const h = histories[id][i];
            if (h) transferArr.push({ id, v: h.transfers_in });
        }
        transferArr.sort((a, b) => b.v - a.v);
        transferArr.forEach((x, idx) => {
            transferRankCache[x.id].push({ gw, rank: idx + 1 });
        });

        // Points rank
        const pointsArr = [];
        for (const id of ids) {
            const h = histories[id][i];
            if (!h) continue;
            prefixPoints[id] += h.total_points;
            pointsArr.push({ id, v: prefixPoints[id] });
        }
        pointsArr.sort((a, b) => b.v - a.v);
        pointsArr.forEach((x, idx) => {
            pointsRankCache[x.id].push({ gw, rank: idx + 1 });
        });

        // Form rank
        const formArr = [];
        for (const id of ids) {
            const hist = histories[id].slice(Math.max(0, i - 4), i + 1);
            if (!hist.length) continue;

            const avg =
                hist.reduce((s, x) => s + x.total_points, 0) / hist.length;

            formArr.push({ id, v: avg });
        }
        formArr.sort((a, b) => b.v - a.v);
        formArr.forEach((x, idx) => {
            formRankCache[x.id].push({ gw, rank: idx + 1 });
        });
    }

    console.log("[Rank] Rank cache DONE");
}

// Getters
const getPlayerTransferRank = id => transferRankCache[id] || null;
const getPlayerPointsRank = id => pointsRankCache[id] || null;
const getPlayerFormRank = id => formRankCache[id] || null;


module.exports = {
    fetchPlayerTransfers,
    fetchPlayerPoints,
    fetchPlayerForm,

    buildAllRankCache,
    getPlayerTransferRank,
    getPlayerPointsRank,
    getPlayerFormRank
};
