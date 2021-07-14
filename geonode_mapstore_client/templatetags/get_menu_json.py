from django import template
from geonode.base.models import Menu, MenuItem

register = template.Library()

def _handle_single_item(menu_item):
    m_item = {}
    m_item['type'] = 'link'
    m_item['href'] = menu_item.url
    m_item['label'] = menu_item.title
    if menu_item.blank_target:
        m_item['target'] = '_blank'
    return m_item

@register.simple_tag
def get_base_left_topbar_menu():

    return [
        {
            "label": "Datasets",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/catalogue/#/search/?filter{resource_type.in}=layer",
                    "label": "Datasets"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/layers/upload",
                    "label": "Upload dataset"
                }
            ]
        },
        {
            "label": "Documents",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/catalogue/#/search/?filter{resource_type.in}=document",
                    "label": "Documents"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/documents/upload",
                    "label": "Upload document"
                }
            ]
        },
        {
            "type": "divider"
        },
        {
            "label": "Maps",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/catalogue/#/search/?filter{resource_type.in}=map",
                    "label": "Explore maps"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/catalogue/#/map/new",
                    "label": "Create Map"
                }
            ]
        },
        {
            "label": "GeoStories",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/catalogue/#/search/?filter{resource_type.in}=geostory",
                    "label": "GeoStories"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/catalogue/#/geostory/new",
                    "label": "Create GeoStory"
                }
            ]
        },
        {
            "label": "About",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/people/",
                    "label": "People"
                },
                {
                    "type": "link",
                    "href": "/groups/",
                    "label": "Groups"
                },
                {
                    "type": "link",
                    "href": "/groups/categories/",
                    "label": "Groups categories"
                },
                {
                    "type": "link",
                    "href": "/announcements/",
                    "label": "Announcements"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/invitations/geonode-send-invite/",
                    "label": "Invite users"
                },
                {
                    "type": "link",
                    "href": "/admin/people/profile/add/",
                    "label": "Add user"
                },
                {
                    "type": "link",
                    "href": "/groups/create/",
                    "label": "Create group"
                }
            ]
        }
    ]

@register.simple_tag
def get_user_menu():

    '''
    if user is not authenticated
        {
            "label": "Register",
            "type": "link",
            "href": "/account/signup/?next=/"
        },
        {
            "label": "Sign in",
            "type": "link",
            "href": "/account/login/?next=/"
        }
    '''

    '''
    if user is authenticated
    '''
    return [
        
        {
            # get src of user avatar
            "image": "https://www.gravatar.com/avatar/7a68c67c8d409ff07e42aa5d5ab7b765/?s=240",
            "type": "dropdown",
            "className": "gn-user-menu-dropdown",
            "items": [
                {
                    "type": "link",
                    # get href of user profile
                    "href": "{state('user') && state('user').hrefProfile}",
                    "label": "Profile"
                },
                {
                    "type": "link",
                    "href": "/social/recent-activity",
                    "label": "Recent activity"
                },
                {
                    "type": "link",
                    "href": "/favourite/list/",
                    "label": "Favorites"
                },
                {
                    "type": "link",
                    "href": "/messages/inbox/",
                    "label": "Inbox"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/admin/",
                    "label": "Admin"
                },
                {
                    "type": "link",
                    "href": "/geoserver/",
                    "label": "GeoServer"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/help/",
                    "label": "Help"
                },
                {
                    "type": "divider"
                },
                {
                    "type": "link",
                    "href": "/account/logout/?next=/",
                    "label": "Log out"
                }
            ]
        }
    ]

@register.simple_tag
def get_menu_json(placeholder_name):
    menus = {
        m: MenuItem.objects.filter(menu=m).order_by('order')
        for m in Menu.objects.filter(placeholder__name=placeholder_name)
    }
    ms = []
    for menu, menu_items in menus.items():
        if len(menu_items) > 1:
            m = {}
            m['label'] = menu.title
            m['type'] = 'dropdown'
            m['items'] = []
            for menu_item in menu_items:
                m_item = _handle_single_item(menu_item)
                m['items'].append(m_item)

            ms.append(m)
        if len(menu_items) == 1:
            m = _handle_single_item(menu_items.first())
            ms.append(m)
    return ms
