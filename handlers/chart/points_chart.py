import matplotlib.pyplot as plt
import io
import base64
import json
import sys
from matplotlib.ticker import MaxNLocator

player_name = sys.argv[1]
data = json.loads(sys.argv[2])

if not data:
    print("")
    sys.exit(0)

max_gw = max(d["gw"] for d in data)
all_gws = list(range(1, max_gw + 1))

points_dict = {d["gw"]: d["points"] for d in data}
points = [points_dict.get(gw, 0) for gw in all_gws]

plt.figure(figsize=(10,5))
plt.plot(all_gws, points, marker="o", linestyle="-", color="tab:blue", label="Points")

plt.xlabel("Gameweek")
plt.ylabel("Total Points")
plt.title(f"Points for {player_name}")
plt.grid(True)
plt.legend()

plt.gca().xaxis.set_major_locator(MaxNLocator(integer=True))
plt.gca().yaxis.set_major_locator(MaxNLocator(integer=True))
plt.xticks(all_gws)
plt.tight_layout()

buf = io.BytesIO()
plt.savefig(buf, format="png")
plt.close()
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode("utf-8")
print(img_base64)
