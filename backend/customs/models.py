from django.db import models


class Season(models.Model):
    code = models.CharField(max_length=2, unique=True)
    description = models.TextField(blank=True, null=True)
    season_notes = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.code



class Heading(models.Model):
    code = models.CharField(max_length=4, unique=True)
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="headings")
    description = models.TextField(blank=True, null=True)
    heading_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.code





class HSCode(models.Model):
    code = models.CharField(max_length=20, unique=True)
    goods_name_fa = models.TextField(max_length=1000)
    goods_name_en = models.TextField(max_length=1000)
    profit = models.CharField(max_length=255)
    customs_duty_rate = models.IntegerField(
        null=True, blank=True
    )
    import_duty_rate = models.CharField(
        null=True, blank=True, max_length=255
    )
    priority = models.IntegerField(null=True, blank=True)
    SUQ_OPTIONS = [
        ('1000kwh','1000Kwh'),
        ('1000u','1000U'),
        ('2U','2U'),
        ('c','C'),
        ('Carat','Carat'),
        ('Kg','Kg'),
        ('kg','Kg'),
        ('L','L'),
        ('m','M'), 
        ('m2','M2'),
        ('m3','M3'),
        ('mm','Mm'),
        ('U','U'),
        ('1000U','1000U'),

    ]
    SUQ = models.CharField(max_length=20, choices=SUQ_OPTIONS, default='U')
    updated_date = models.DateTimeField(auto_now=True)
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="code_seasons")
    heading = models.ForeignKey(Heading, on_delete=models.SET_NULL, null=True, blank=True, related_name="hscodes")
    class Meta:
        ordering = ["-code"] 
    def __str__(self):
        return f"{self.code} "



