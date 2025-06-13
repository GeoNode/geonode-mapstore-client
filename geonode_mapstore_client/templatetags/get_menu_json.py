from django import template
from django.conf import settings
from geonode.base.models import Configuration, Menu, MenuItem

register = template.Library()

def _handle_single_item(menu_item):
    m_item = {}
    m_item["type"] = "link"
    m_item["href"] = menu_item.url
    m_item["label"] = menu_item.title
    if menu_item.blank_target:
        m_item["target"] = "_blank"
    return m_item

@register.simple_tag
def get_menu_json(placeholder_name):
    menus = {
        m: MenuItem.objects.filter(menu=m).order_by("order")
        for m in Menu.objects.filter(placeholder__name=placeholder_name)
    }
    ms = []
    for menu, menu_items in menus.items():
        if len(menu_items) > 1:
            m = {}
            m["label"] = menu.title
            m["type"] = "dropdown"
            m["items"] = []
            for menu_item in menu_items:
                m_item = _handle_single_item(menu_item)
                m["items"].append(m_item)

            ms.append(m)
        if len(menu_items) == 1:
            m = _handle_single_item(menu_items.first())
            ms.append(m)
    return ms

@register.simple_tag
def get_settings():
    return {
        'ACCOUNT_OPEN_SIGNUP': settings.ACCOUNT_OPEN_SIGNUP,
        'READ_ONLY': Configuration.load().read_only,
        'GEOSERVER_WEB_UI_LOCATION': settings.GEOSERVER_WEB_UI_LOCATION
    }