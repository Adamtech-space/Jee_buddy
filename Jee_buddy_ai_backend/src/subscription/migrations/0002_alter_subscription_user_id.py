# Generated by Django 4.2 on 2025-02-04 16:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscription', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscription',
            name='user_id',
            field=models.UUIDField(),
        ),
    ]
