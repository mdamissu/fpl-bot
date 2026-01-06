const { fetchFPLData } = require('./fplService');

async function fetchPOTW(){

    const data = await fetchFPLData();

    const currentGW = data.events.find(e=>e.is_current)?.id;

    const results = [];

    for(let gw=1; gw<=currentGW; gw++){

        const res = await fetch(
            `https://fantasy.premierleague.com/api/event/${gw}/live/`
        );

        if(!res.ok) continue;

        const live = await res.json();

        let potw = null;

        for(const p of live.elements){
            if(!potw || p.stats.total_points > potw.stats.total_points){
                potw = p;
            }
        }

        // formatting exports
        const info = data.elements.find(x=>x.id===potw.id);
        const team = data.teams.find(t=>t.id===info.team);

        results.push({
            gw,
            id: info.id,
            name: info.web_name,
            points: potw.stats.total_points,
            team: team.name,
            teamCode: team.code,
            playerCode: info.code
        });
    }

    return results.reverse();
}

module.exports = { fetchPOTW };
