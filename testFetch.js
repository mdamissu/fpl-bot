const { fetchFPLData } = require("./services/fplService");

(async () => {
    try {
        const data = await fetchFPLData();

        console.log("Players:", data.elements.length);
        console.log("Teams:", data.teams.length);
        console.log("Positions:", data.element_types.length);
    }
    catch (e) {
        console.error("ERROR:", e.message);
    }
})();
