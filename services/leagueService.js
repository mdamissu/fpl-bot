
async function fetchFPLLeague(league_id = 314, page = 1) {
    console.log("🌐 Fetching FPL API...");
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${league_id}/standings/?page_standings=${page}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();

        console.log("✅ FPL data fetched");
        return data.standings.results;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

module.exports = { fetchFPLLeague };
