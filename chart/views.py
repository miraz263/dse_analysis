from django.shortcuts import render
import random
import datetime
import matplotlib.pyplot as plt
import io
import urllib, base64

def fake_index_chart(request):
    # ফেক ডেটা তৈরি
    dates = [datetime.date.today() - datetime.timedelta(days=i) for i in range(30)][::-1]
    index_values = [random.randint(6000, 7000) for _ in range(30)]

    # Matplotlib দিয়ে চার্ট তৈরি
    plt.figure(figsize=(10,5))
    plt.plot(dates, index_values, marker='o', color='green', label='DSEX Index')
    plt.title("DSEX Index (Fake Data)")
    plt.xlabel("Date")
    plt.ylabel("Index Value")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.legend()

    # চার্টকে HTML এ দেখানোর জন্য base64 এ কনভার্ট
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    string = base64.b64encode(buf.read())
    uri = urllib.parse.quote(string)
    plt.close()

    return render(request, 'chart/fake_chart.html', {'chart': uri})
