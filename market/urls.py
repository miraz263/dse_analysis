from django.urls import path
from . import views

urlpatterns = [
    path('chart/', views.index_chart_view, name='index_chart'),
    path('scrape/', views.scrape_dsex, name='scrape_dsex'),
]
