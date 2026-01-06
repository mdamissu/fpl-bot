const Watchlist = require('../models/watchModels');
const { fetchFPLData } = require('./fplService');

async function addToWatchlist(userId, playerName) {
    const data = await fetchFPLData();

    // find player by name
    const player = data.elements.find(
        p => (p.first_name + " " + p.second_name) === playerName
    );
    if (!player) throw new Error("Player not found");

    const team = data.teams[player.team - 1];

    // formatting playerObj
    const playerObj = {
        id: player.id,
        name: player.first_name + " " + player.second_name,
        team: team.name,
        position: ["GK","DEF","MID","FWD"][player.element_type - 1],
        baseline: {
            price: player.now_cost / 10,
            pts: player.total_points,
            ppm: parseFloat(player.points_per_game),
            tsb: player.selected_by_percent
        },
        current: {
            price: player.now_cost / 10,
            pts: player.total_points,
            ppm: parseFloat(player.points_per_game),
            tsb: player.selected_by_percent
        }
    };

    // add to watchlist
    const doc = await Watchlist.findOne({ userId });
    if (doc && doc.players.some(p => p.id === player.id)) {
        return false;
    }
    if (doc) {
        doc.players.push(playerObj);
        await doc.save();
    } else {
        await Watchlist.create({ userId, players: [playerObj] });
    }

    return true; 
}

async function removeFromWatchlist(userId, playerName) {
    // find userid
    const doc = await Watchlist.findOne({ userId });
    if (!doc) return false;

    // find in watchlist by name
    const index = doc.players.findIndex(p => p.name === playerName);
    if (index === -1) return false;

    // removal
    doc.players.splice(index, 1);
    await doc.save();

    return true; 
}

async function getWatchlist(userId) {
    // find userid
    const doc = await Watchlist.findOne({ userId });
    if (!doc) return null;

    const data = await fetchFPLData();

    // updated players
    const updatedPlayers = doc.players.map(p => {
        const live = data.elements.find(x => x.id === p.id);
        if (!live) return p;

        const team = data.teams[live.team - 1];

        p.current = {
            price: live.now_cost / 10,
            pts: live.total_points,
            ppm: parseFloat(live.points_per_game),
            tsb: live.selected_by_percent
        };

        return p;
    });
    // update data
    doc.players = updatedPlayers;
    await doc.save();

    return updatedPlayers.map(p => {
        return {
            name: p.name,
            team: p.team,
            position: p.position,
            delta: {
                price: (p.current.price - p.baseline.price).toFixed(1),
                pts: p.current.pts - p.baseline.pts,
                ppm: (p.current.ppm - p.baseline.ppm).toFixed(1),
                tsb: (p.current.tsb - p.baseline.tsb).toFixed(1)
            },
            current: p.current
        };
    });
}

module.exports = {
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist
};
