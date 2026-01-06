import matplotlib.pyplot as plt
import io
import base64
import json
import sys
from matplotlib.ticker import MaxNLocator

player_name = sys.argv[1]
rank_data = json.loads(sys.argv[2])

if not rank_data:
    print("")
    sys.exit(0)

# All gameweeks from 1 to max GW 
max_gw = max(d["gw"] for d in rank_data)
all_gws = list(range(1, max_gw + 1))

#  Map ranks, fill missing GW with None
rank_dict = {d["gw"]: d["rank"] for d in rank_data}
ranks = [rank_dict.get(gw, None) for gw in all_gws]

#  Plot 
plt.figure(figsize=(10,5))
plt.plot(all_gws, ranks, marker="o", linestyle="-", color="tab:blue")
plt.gca().invert_yaxis()

plt.gca().xaxis.set_major_locator(MaxNLocator(integer=True))
plt.gca().yaxis.set_major_locator(MaxNLocator(integer=True))
plt.xticks(all_gws)

plt.xlabel("Gameweek")
plt.ylabel("Rank (1 = best)")
plt.title(f"Points Rank for {player_name}")
plt.grid(True)
plt.tight_layout()

# Encode base64 
buf = io.BytesIO()
plt.savefig(buf, format="png")
plt.close()
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode("utf-8")
print(img_base64)
