const BASE_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

let cachedData = null;
let lastFetchTime = 0;

const CACHE_TIME = 5 * 60 * 1000;

async function fetchFPLData() {
    const now = Date.now();

    if (cachedData && now - lastFetchTime < CACHE_TIME) {
        console.log("⚡ Using cached data");
        return cachedData;
    }

    console.log("🌐 Fetching FPL API...");

    const res = await fetch(BASE_URL);

    if (!res.ok) {
        throw new Error("FPL API request failed");
    }

    const data = await res.json();

    cachedData = data;
    lastFetchTime = now;

    console.log("✅ FPL data refreshed");

    return data;
}

module.exports = {
    fetchFPLData,
};
