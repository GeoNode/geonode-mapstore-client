from django.contrib import admin
from geonode_mapstore_client.models import SearchService


@admin.register(SearchService)
class SearchServiceAdmin(admin.ModelAdmin):
    pass
