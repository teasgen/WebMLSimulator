# Generated by Django 5.1.2 on 2025-03-14 19:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_simulationinstance_delete_qablock'),
    ]

    operations = [
        migrations.AddField(
            model_name='simulationinstance',
            name='is_ended',
            field=models.BooleanField(default=False),
        ),
    ]
