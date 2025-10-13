from django.db import models

class DSEXIndex(models.Model):
    date = models.DateField(auto_now_add=True)
    value = models.FloatField()
    status = models.CharField(max_length=10)  # BULL / BEAR / NEUTRAL

    def __str__(self):
        return f"{self.date} - {self.value} ({self.status})"
