from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('businesses', '0002_alter_business_closes_at_alter_business_opens_at')]

    operations = [
        migrations.AddField(
            model_name='business',
            name='operating_days',
            field=models.JSONField(default=list),
        ),
    ]
