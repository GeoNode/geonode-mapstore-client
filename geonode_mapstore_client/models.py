import os
import shutil
import zipfile
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from django.dispatch import receiver
from django.db.models import signals
from django.core.cache import caches
from django.db import models
from geonode_mapstore_client.utils import validate_zip_file, clear_extension_caches
from geonode_mapstore_client.templatetags.get_search_services import (
    populate_search_service_options,
)
from django.conf import settings


class SearchService(models.Model):
    class Meta:
        verbose_name = _("Search Service")

    def __str__(self):
        return f"{self.name} - {self.url}"

    name = models.CharField(
        max_length=250,
        null=False,
        verbose_name="Service Name",
        help_text="Name of the Search Service",
        default="",
    )
    display_name = models.CharField(
        max_length=250,
        null=False,
        verbose_name="Result string",
        help_text="Literal template to be returned as result, Ex. 'UNESCO - ${properties.site}'",
    )
    sub_title = models.CharField(
        max_length=250,
        null=True,
        verbose_name="Service SubTitle",
        help_text="Sub title of the Search Service",
    )
    priority = models.IntegerField(null=False, verbose_name="Priority", default=3)
    url = models.CharField(
        max_length=250,
        null=False,
        verbose_name="URL of the WFS service",
        default="",
    )
    typename = models.CharField(
        max_length=250,
        null=False,
        verbose_name="Typename",
        help_text="Layer name with workspace, e.g. geonode:layer",
    )
    attributes = ArrayField(
        max_length=250,
        null=False,
        base_field=models.CharField(max_length=250, null=False),
        verbose_name="Attributes",
        help_text="Comma separated list of attributes. Search is performed on these fields. Only textual fields can be configured",
    )
    sortby = models.CharField(
        max_length=250,
        null=False,
        verbose_name="Sort By",
        help_text="Sorting attribute, must be a dataset attribute",
    )
    srsName = models.CharField(
        max_length=250,
        null=False,
        verbose_name="SRS name",
        default="EPSG:4326",
        help_text="EPSG:xxxx code for the CRS of returned geometries",
    )
    maxFeatures = models.IntegerField(
        null=False,
        verbose_name="Max Features",
        default=20,
        help_text="Max number of feature returned by the search",
    )


@receiver(signals.post_save, sender=SearchService)
def post_save_search_service(instance, sender, created, **kwargs):
    # reset subsite object cache
    services_cache = caches["search_services"]
    services = services_cache.get("search_services")
    if services:
        services_cache.delete("search_services")

    services_cache.set("search_services", populate_search_service_options(), 300)



def extension_upload_path(instance, filename):
    return f"mapstore_extensions/{filename}"


class Extension(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        blank=True,  # Will be populated from the zip filename
        help_text="Name of the extension, derived from the zip file name. Must be unique.",
    )
    uploaded_file = models.FileField(
        upload_to=extension_upload_path,
        validators=[validate_zip_file],
        help_text="Upload the MapStore extension as a zip folder.",
    )
    active = models.BooleanField(
        default=True,
        help_text="Whether the extension is active and should be included in the index.",
    )
    is_map_extension = models.BooleanField(
        default=False,
        help_text="Check if this extension is a map-specific plugin for Map Viewers.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.name and self.uploaded_file:
            self.name = os.path.splitext(os.path.basename(self.uploaded_file.name))[0]
        super().save(*args, **kwargs)

    class Meta:
        ordering = ("name",)
        verbose_name = "MapStore Extension"
        verbose_name_plural = "MapStore Extensions"


@receiver(signals.post_save, sender=Extension)
def handle_extension_upload(sender, instance, **kwargs):
    """
    Unzips the extension file and clears the API cache after saving.
    """
    target_path = os.path.join(
        settings.STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, instance.name
    )

    if os.path.exists(target_path):
        shutil.rmtree(target_path)

    try:
        with zipfile.ZipFile(instance.uploaded_file.path, "r") as zip_ref:
            zip_ref.extractall(target_path)
    except FileNotFoundError:
        pass

    clear_extension_caches()


@receiver(signals.post_delete, sender=Extension)
def handle_extension_delete(sender, instance, **kwargs):
    """
    Removes the extension's files and clears the API cache on deletion.
    """
    if instance.name:
        extension_path = os.path.join(
            settings.STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, instance.name
        )
        if os.path.exists(extension_path):
            shutil.rmtree(extension_path)

    if instance.uploaded_file and os.path.exists(instance.uploaded_file.path):
        os.remove(instance.uploaded_file.path)

    clear_extension_caches()
