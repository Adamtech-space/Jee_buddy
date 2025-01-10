# Generated by Django 5.1.4 on 2025-01-10 19:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "subscription",
            "0002_alter_subscription_options_remove_subscription_user_and_more",
        ),
    ]

    operations = [
        migrations.AlterField(
            model_name="subscription",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="subscription",
            name="currency",
            field=models.CharField(default="INR", max_length=10),
        ),
        migrations.AlterField(
            model_name="subscription",
            name="payment_status",
            field=models.CharField(default="pending", max_length=50),
        ),
        migrations.AlterField(
            model_name="subscription",
            name="status",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="subscription",
            name="subscription_id",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterModelTable(
            name="subscription",
            table=None,
        ),
    ]
