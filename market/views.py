import requests
from django.http import JsonResponse
from django.shortcuts import render
import random
import datetime
import matplotlib.pyplot as plt
import io
import urllib, base64

def index_chart_view(request):
    """
    Render template to show embedded chart
    """
    return render(request, 'market/index_chart.html')


def scrape_dsex(request):
    """
    Fetch DSEX index, calculate Bull/Bear, generate 30-day fake chart.
    Returns JSON with chart_base64.
    """
    url = "https://www.dsebd.org/latest_share_price_all.json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        dsex_row = next((item for item in data if item.get('CompanyName') == 'DSEX'), None)
        if dsex_row:
            dsex_value = float(dsex_row['ClosePrice'].replace(',', ''))
        else:
            dsex_value = random.randint(6500, 6800)

    except Exception:
        dsex_value = random.randint(6500, 6800)

    # Bull / Bear / Neutral
    highest = dsex_value * 1.05
    lowest = dsex_value * 0.95
    increase_percent = ((dsex_value - lowest) / lowest) * 100
    decrease_percent = ((highest - dsex_value) / highest) * 100

    if increase_percent >= 20:
        status = "BULL"
    elif decrease_percent >= 20:
        status = "BEAR"
    else:
        status = "NEUTRAL ⚖️"

    # Generate fake 30-day chart
    dates = [datetime.date.today() - datetime.timedelta(days=i) for i in range(30)][::-1]
    index_values = [dsex_value + random.randint(-50, 50) for _ in range(30)]

    plt.figure(figsize=(10,5))
    plt.plot(dates, index_values, marker='o', color='green', label='DSEX Index')
    plt.title("DSEX Index (Last 30 Days)")
    plt.xlabel("Date")
    plt.ylabel("Index Value")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.legend()

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    chart_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return JsonResponse({
        "value": round(dsex_value, 2),
        "status": status,
        "highest": round(highest, 2),
        "lowest": round(lowest, 2),
        "increase_percent": round(increase_percent, 2),
        "decrease_percent": round(decrease_percent, 2),
        "chart_base64": chart_base64
    })
