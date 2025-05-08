from avatar.templatetags.avatar_tags import avatar_url
from django import template
from django.conf import settings
from geonode.base.models import Configuration, Menu, MenuItem

register = template.Library()


def _get_request_user(context):
    request = context.get("request")
    if request:
        return request.user


def _handle_single_item(menu_item):
    m_item = {}
    m_item["type"] = "link"
    m_item["href"] = menu_item.url
    m_item["label"] = menu_item.title
    if menu_item.blank_target:
        m_item["target"] = "_blank"
    return m_item


def _is_mobile_device(context):
    if context and "request" in context:
        req = context["request"]
        return req.user_agent.is_mobile
    return False


@register.simple_tag
def get_base_left_topbar_menu():

    return [
        {
            "type": "link",
            "href": "/catalogue/#/all",
            "label": "All resources",
        },
        {
            "type": "link",
            "href": "/catalogue/#/datasets",
            "label": "Datasets",
        },
        {
            "type": "link", 
            "href": "/catalogue/#/maps", 
            "label": "Maps"
        },
        {
            "type": "link",
            "href": "/catalogue/#/documents",
            "label": "Documents",
        },
        {
            "type": "link",
            "href": "/catalogue/#/geostories",
            "label": "GeoStories",
        },
        {
            "type": "link",
            "href": "/catalogue/#/dashboards",
            "label": "Dashboards",
        }
    ]

@register.simple_tag
def get_brand_navbar_menu():
    return [
        {
            "type": "link",
            "href": "/datasets",
            "label": "Datasets",
        },
        {
            "type": "link", 
            "href": "/maps", 
            "label": "Maps"
        },
        {
            "type": "link",
            "href": "/documents",
            "label": "Documents",
        },
        {
            "type": "link",
            "href": "/geostories",
            "label": "GeoStories",
        },
        {
            "type": "link",
            "href": "/dashboards",
            "label": "Dashboards",
        }
    ]

@register.simple_tag(takes_context=True)
def get_user_menu(context):
    is_mobile = _is_mobile_device(context)

    user = _get_request_user(context)

    if not user or (user and not user.is_authenticated):
        return [
            {"label": "Register", "type": "link", "href": "/account/signup/?next=/"}
            if settings.ACCOUNT_OPEN_SIGNUP and not Configuration.load().read_only
            else None,
            {"label": "Sign in", "type": "link", "href": "/account/login/?next=/"},
        ]

    devider = {"type": "divider"}

    profile_link = {
        "type": "link",
        # get href of user profile
        "href": user.get_absolute_url(),
        "label": "Profile",
    }

    logout = {"type": "link", "href": "/account/logout/?next=/", "label": "Log out"}

    if is_mobile:
        return [
            {
                # get src of user avatar
                "image": avatar_url(user),
                "type": "dropdown",
                "className": "gn-user-menu-dropdown",
                "items": [profile_link, devider, logout],
            }
        ]

    profile = {
        # get src of user avatar
        "image": avatar_url(user),
        "type": "dropdown",
        "className": "gn-user-menu-dropdown",
        "items": [
            profile_link,
            {
                "type": "link",
                "href": "/social/recent-activity",
                "label": "Recent activity",
            },
            {
                "type": "link",
                "href": "/catalogue/#/search/?f=favorite",
                "label": "Favorites",
            },
            {"type": "link", "href": "/messages/inbox/", "label": "Inbox"},
            devider,
        ],
    }

    people_groups = [
        {"type": "link", "href": "/people/", "label": "People"},
        {"type": "link", "href": "/groups/", "label": "Groups"},
        devider
        ]
        
    if user.is_superuser: 
        people_groups.extend(
            [
            {"type": "link", "href": "/invitations/geonode-send-invite/", "label": "Invite users"},
            {"type": "link","href": "/admin/people/profile/add/","label": "Add user"},
            {"type": "link", "href": "/groups/create/", "label": "Create group"},
            devider
            ]
        )
    
    general =  (
        people_groups + [
            {"type": "link", "href": "/help/", "label": "Help"}, 
            devider, 
            logout
            ]
    )

    admin_only = (
        [
            {"type": "link", "href": "/admin/", "label": "Admin"},
            {
                "type": "link",
                "href": settings.GEOSERVER_WEB_UI_LOCATION,
                "label": "GeoServer",
            },
        ]
        + [devider]
        + general
    )

    if user.is_superuser:
        profile["items"].extend(admin_only)
    else:
        profile["items"].extend(general)

    return [profile]


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
