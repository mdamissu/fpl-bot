const { EmbedBuilder } = require('discord.js');
const { fetchFPLData } = require('../../services/fplService');
// Get current GW
const getCurrentId = async () => {
  const data = await fetchFPLData();

  const events = data.events;
  const cur = events.find(e => e.is_current) || events.find(e => !e.finished);

  if (!cur) {
    throw new Error("Cannot find current GW");
  }

  return cur.id;
};
// Get dreamteam of GW
const getDreamTeam = async (eventId) => {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/dream-team/${eventId}/`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch dream-team");
  }

  return res.json();
};

module.exports = async function dreamHandler(interaction) {
  try {

    const data = await fetchFPLData();

    const currentGW = await getCurrentId();

    const result = await getDreamTeam(currentGW);
    const dreamTeam = result.team; 

    // Get dreamteam with pts and position
    const playersMap = new Map();
    data.elements.forEach(p => {
      playersMap.set(p.id, p);
    });

    dreamTeam.sort((a, b) => a.position - b.position);

    let totalPoints = 0;
    let description = "";

    for (const p of dreamTeam) {
      const info = playersMap.get(p.element);
      if (!info) continue;

      totalPoints += p.points;

      description +=
        `**${info.first_name} ${info.second_name}** ` +
        `(${info.web_name}) — **${p.points} pts**\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🌟 FPL Dream Team – GW ${currentGW}`)
      .setColor(0x1F8B4C)
      .setDescription(description)
      .addFields({
        name: "Total Points",
        value: String(totalPoints),
        inline: true,
      })
      .setFooter({
        text: "FPL Bot",
        iconURL: "https://i.imgur.com/AfFp7pu.png",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  }
  catch (err) {
    console.error("Error in dreamHandler:", err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "Error fetching FPL dream team",
      });
    }
  }
};
