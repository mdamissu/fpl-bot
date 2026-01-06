import matplotlib.pyplot as plt
import io
import base64
import json
import sys
from matplotlib.ticker import MaxNLocator

player_name = sys.argv[1]
form_data = json.loads(sys.argv[2])

if not form_data:
    print("")
    sys.exit(0)

# All gameweeks 1 → max
max_gw = max(d["gw"] for d in form_data)
all_gws = list(range(1, max_gw + 1))

# Map form values, fill missing GW with None
form_dict = {d["gw"]: d["form"] for d in form_data}
form_values = [form_dict.get(gw, None) for gw in all_gws]

plt.figure(figsize=(10,5))
plt.plot(all_gws, form_values, marker="o", linestyle="-", color="tab:green", label="Form")

plt.xlabel("Gameweek")
plt.ylabel("Form")
plt.title(f"Form per Gameweek - {player_name}")
plt.grid(True)
plt.legend()

plt.gca().xaxis.set_major_locator(MaxNLocator(integer=True))
plt.xticks(all_gws)
plt.tight_layout()

buf = io.BytesIO()
plt.savefig(buf, format="png")
plt.close()
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode("utf-8")
print(img_base64)
