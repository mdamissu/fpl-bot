const Notification = require('../models/notificationsModels');
const MyTeam = require('../models/userModels');
const { fetchSquad } = require('./myteamService');
const { fetchFPLData } = require('./fplService');

const FPL_BASE = 'https://fantasy.premierleague.com/api';

let lastStats = {};
let lastNews = {};
let lastNewsTime = {};
let lastDeadlineNotify = {};
let lastFixtures = [];

const NEWS_COOLDOWN = 30 * 60 * 1000;

// Message sending config
async function sendDM(client, discordId, message) {
    try {
        const user = await client.users.fetch(discordId);
        if (user) await user.send(message);
    } catch (err) {
        console.error('Error in DM', err.message);
    }
}


async function fetchLive(gw) {
    if (!gw) return {};

    const url = `${FPL_BASE}/event/${gw}/live/`;

    try {
        const res = await fetch(url);

        if (!res.ok) {
            const text = await res.text();
            console.error('fetchLive HTTP error:', res.status, text.slice(0, 100));
            return {};
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('fetchLive not JSON:', text.slice(0, 100));
            return {};
        }

        const data = await res.json();
        if (!data.elements) return {};

        const obj = {};
        for (const p of data.elements) {
            obj[p.id] = {
                name: p.web_name,
                stats: p.stats
            };
        }
        return obj;

    } catch (err) {
        console.error('Error in fetchLive:', err.message);
        return {};
    }
}

async function fetchFixtures() {
    try {
        const res = await fetch(`${FPL_BASE}/fixtures/`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Error in fetchFixtures:', err.message);
        return [];
    }
}

// Difference between newFixtures and cached fixture
function diffFixtures(oldFixtures, newFixtures) {
    const newIds = {};
    for (const f of newFixtures) newIds[f.id] = true;

    const removed = oldFixtures.filter(f => !newIds[f.id]);
    const postponed = newFixtures.filter(
        f => !f.kickoff_time || f.provisional_start_time
    );

    return { removed, postponed };
}

// Notify fixture changes
async function notifyFixtureChanges(client, discordId, removed, postponed, teamsObj) {
    const msgs = [];

    for (const f of removed) {
        const h = teamsObj[f.team_h] || f.team_h;
        const a = teamsObj[f.team_a] || f.team_a;
        msgs.push(`❌ Fixture removed: ${h} vs ${a}`);
    }

    for (const f of postponed) {
        const h = teamsObj[f.team_h] || f.team_h;
        const a = teamsObj[f.team_a] || f.team_a;
        const time = f.kickoff_time
            ? new Date(f.kickoff_time).toUTCString()
            : 'TBD';
        msgs.push(`⏸️ Fixture postponed: ${h} vs ${a}, kickoff: ${time}`);
    }

    if (msgs.length) await sendDM(client, discordId, msgs.join('\n'));
}

async function checkPlayerEvents(client, setting, team, liveObj, newsObj, squadIds) {
    for (const pid of squadIds) {
        const live = liveObj[pid];
        if (!live) continue;

        const { name, stats } = live;
        const prev = lastStats[pid] || {};

        if (setting.goals_scored && stats.goals_scored > (prev.goals_scored || 0))
            await sendDM(client, team.discordId, `⚽ GOAL: **${name}**`);

        if (setting.assists && stats.assists > (prev.assists || 0))
            await sendDM(client, team.discordId, `🎯 ASSIST: **${name}**`);

        if (setting.yellow_cards && stats.yellow_cards > (prev.yellow_cards || 0))
            await sendDM(client, team.discordId, `🟨 YELLOW CARD: **${name}**`);

        if (setting.red_cards && stats.red_cards > (prev.red_cards || 0))
            await sendDM(client, team.discordId, `🔴 RED CARD: **${name}**`);

        if (setting.penalties_missed && stats.penalties_missed > (prev.penalties_missed || 0))
            await sendDM(client, team.discordId, `❌ PENALTY MISSED: **${name}**`);

        if (setting.penalties_saved && stats.penalties_saved > (prev.penalties_saved || 0))
            await sendDM(client, team.discordId, `🧤 PENALTY SAVED: **${name}**`);

        if (setting.news && newsObj[pid]) {
            const n = newsObj[pid];
            const prevNews = lastNews[pid] || '';
            const now = Date.now();

            if (
                n.news &&
                n.news !== prevNews &&
                (!lastNewsTime[pid] || now - lastNewsTime[pid] > NEWS_COOLDOWN)
            ) {
                await sendDM(
                    client,
                    team.discordId,
                    `📰 **${n.name} UPDATE**:\n${n.news}`
                );
                lastNews[pid] = n.news;
                lastNewsTime[pid] = now;
            }
        }

        lastStats[pid] = stats;
    }
}

async function checkDeadline(client, setting, team, gw, deadline) {
    if (!setting.deadline_time || !deadline) return;

    if (!lastDeadlineNotify[team.discordId])
        lastDeadlineNotify[team.discordId] = {};

    const now = new Date();
    const notify24h = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
    const notify1h = new Date(deadline.getTime() - 60 * 60 * 1000);

    if (now >= notify24h && !lastDeadlineNotify[team.discordId]['24h']) {
        await sendDM(
            client,
            team.discordId,
            `⏰ GW${gw} deadline in 24h!\n${deadline.toUTCString()}`
        );
        lastDeadlineNotify[team.discordId]['24h'] = true;
    }

    if (now >= notify1h && !lastDeadlineNotify[team.discordId]['1h']) {
        await sendDM(
            client,
            team.discordId,
            `⏰ GW${gw} deadline in 1h!\n${deadline.toUTCString()}`
        );
        lastDeadlineNotify[team.discordId]['1h'] = true;
    }
}

async function notifyService(client) {
    try {
        const notifyList = await Notification.find();
        if (!notifyList.length) return;

        const data = await fetchFPLData();
        const currentEvent = data.current_event;

        const eventObj = data.events.find(e => e.id === currentEvent);
        const deadlineStr = eventObj?.deadline_time;
        const deadline = deadlineStr ? new Date(deadlineStr) : null;

        // teams map 
        const teamsObj = {};
        for (const t of data.teams) teamsObj[t.id] = t.name;

        /* live GW only if live */
        let liveObj = {};
        if (eventObj && eventObj.is_current) {
            liveObj = await fetchLive(currentEvent);
        }

        // news 
        const newsObj = {};
        for (const p of data.elements) {
            newsObj[p.id] = {
                name: p.web_name,
                news: p.news || ''
            };
        }

        // fixtures 
        const currentFixtures = await fetchFixtures();
        let removed = [];
        let postponed = [];

        if (lastFixtures.length) {
            ({ removed, postponed } = diffFixtures(lastFixtures, currentFixtures));
        }
        lastFixtures = currentFixtures;

        // per user
        for (const setting of notifyList) {
            const team = await MyTeam.findOne({ discordId: setting.discordId });
            if (!team) continue;

            const history = await fetchSquad(team.entryId);
            const squad = history.at(-1);
            if (!squad) continue;

            const squadIds = squad.picks.map(p => p.element);

            await checkPlayerEvents(client, setting, team, liveObj, newsObj, squadIds);
            await checkDeadline(client, setting, team, currentEvent, deadline);

            if (setting.fixture_removed) {
                await notifyFixtureChanges(
                    client,
                    team.discordId,
                    removed,
                    postponed,
                    teamsObj
                );
            }
        }

    } catch (err) {
        console.error('Error in notifyService', err);
    }
}

module.exports = notifyService;
