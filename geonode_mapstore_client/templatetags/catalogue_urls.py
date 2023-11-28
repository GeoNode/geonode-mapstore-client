import os
import logging

from django import template

logger = logging.getLogger(__name__)
register = template.Library()


@register.simple_tag(takes_context=True)
def catalogue_home(context):
    if context and "request" in context:
        current_path = context["request"].path
        if current_path == "/":
            return "/"
        elif current_path.find("/catalogue") == 0:
            return "#"
        else:
            return "/catalogue/#"
    return ""
