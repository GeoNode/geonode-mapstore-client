import json

from django.contrib.contenttypes.models import ContentType
from django.db import migrations

remove_geostories_relation = "DROP TABLE IF EXISTS geoapp_geostories_geostory CASCADE;"
remove_dashboards_relation = "DROP TABLE IF EXISTS geoapp_dashboards_dashboard CASCADE;"


def update_geostory_dashboard_data(apps, _):
    model = apps.get_model("base", "ResourceBase")
    for item in model.objects.filter(resource_type__in=["dashboard", "geostory"]):
        if isinstance(item.blob, str):
            new_blob = json.loads(item.blob)
            model.objects.filter(id=item.id).update(blob=new_blob)
        rtype = ContentType.objects.get(model="geoapp")
        model.objects.filter(id=item.id).update(polymorphic_ctype=rtype)


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunPython(update_geostory_dashboard_data, migrations.RunPython.noop),
        migrations.RunSQL(remove_geostories_relation),
        migrations.RunSQL(remove_dashboards_relation),
    ]
