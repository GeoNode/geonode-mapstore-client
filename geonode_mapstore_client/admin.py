import os
from django import forms
from django.contrib import admin
from geonode_mapstore_client.models import SearchService, Extension


@admin.register(SearchService)
class SearchServiceAdmin(admin.ModelAdmin):
    pass


class ExtensionAdminForm(forms.ModelForm):
    class Meta:
        model = Extension
        fields = '__all__'

    def clean_uploaded_file(self):
        """
        It checks the uploaded file's name for uniqueness before the model is saved.
        """
        uploaded_file = self.cleaned_data.get('uploaded_file')

        if uploaded_file:
            extension_name = os.path.splitext(os.path.basename(uploaded_file.name))[0]

            queryset = Extension.objects.filter(name=extension_name)

            # If we are updating an existing instance, we can exclude it from the check
            if self.instance.pk:
                queryset = queryset.exclude(pk=self.instance.pk)

            # If the queryset finds any conflicting extension, raise a validation error
            if queryset.exists():
                raise forms.ValidationError(
                    f"An extension with the name '{extension_name}' already exists. Please upload a file with a different name."
                )

        return uploaded_file


@admin.register(Extension)
class ExtensionAdmin(admin.ModelAdmin):

    form = ExtensionAdminForm
    list_display = ('name', 'active', 'is_map_extension', 'updated_at')
    list_filter = ('active', 'is_map_extension')
    search_fields = ('name',)
    readonly_fields = ('name', 'created_at', 'updated_at')
