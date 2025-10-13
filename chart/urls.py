from django.urls import path
from .views import fake_index_chart

urlpatterns = [
    path('fake-chart/', fake_index_chart, name='fake_chart'),
]
