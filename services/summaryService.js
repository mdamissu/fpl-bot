const BASE_URL = "https://fantasy.premierleague.com/api/element-summary/";

async function fetchPlayerSummary(playerId) {
    try {
        const res = await fetch(`${BASE_URL}${playerId}/`);

        if (!res.ok) {
            throw new Error(`Summary API failed for player ${playerId}`);
        }

        return await res.json();
    } catch (err) {
        console.error(`Error in fetchPlayerSummary`, err);
        return null;
    }
}

module.exports = {
    fetchPlayerSummary
};
