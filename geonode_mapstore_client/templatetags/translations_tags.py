from django import template
from geonode.base.i18n import labelResolver
from django.utils.translation import get_language

register = template.Library()

@register.simple_tag
def gn_translate(keyword):
    if keyword and not isinstance(keyword, list):
        return labelResolver.gettext(str(keyword), lang=get_language())