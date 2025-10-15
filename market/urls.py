from django.urls import path
from . import views

urlpatterns = [
    path('api/dse_depth/', views.dse_depth_proxy, name='dse_depth_proxy'),
]
