import re

from django import template
from django.utils.html import escape, format_html
from django.utils.safestring import mark_safe

register = template.Library()

URL_RE = re.compile(r"https?://[^\s<>\"']*[^\s<>\"'.,:;!?)\]}]", re.IGNORECASE)
LINK = '<a href="{url}" target="_blank" rel="noopener noreferrer">{url}</a>'


@register.filter(is_safe=True)
def gn_urlize(value):
    """Render every http(s) URL found in value as a link opening in a new page."""
    if value is None:
        return ""
    text = str(value)
    parts = []
    end_of_previous_url = 0
    for match in URL_RE.finditer(text):
        parts.append(escape(text[end_of_previous_url:match.start()]))
        parts.append(format_html(LINK, url=match.group()))
        end_of_previous_url = match.end()
    parts.append(escape(text[end_of_previous_url:]))
    return mark_safe("".join(parts))
