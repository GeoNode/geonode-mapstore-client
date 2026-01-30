from django.conf import settings
from geonode.base.auth import get_or_create_token
from .registry import BaseRequestConfigurationRuleHandler



class BaseConfigurationRuleHandler(BaseRequestConfigurationRuleHandler):
    """
    Base handler for configuration rules.
    """

    def get_rules(self, request):
        user = request.user
        if not user.is_authenticated:
            return []
        rules = []
        token_obj = get_or_create_token(user)
        access_token = token_obj.token

        rules.extend(
            [
                {
                    "urlPattern": f"{settings.GEOSERVER_WEB_UI_LOCATION.rstrip('/')}/.*",
                    "params": {"access_token": access_token},
                },
                {"urlPattern": f"{settings.SITEURL.rstrip('/')}/gs.*", "params": {"access_token": access_token}},
                {
                    "urlPattern": f"{settings.SITEURL.rstrip('/')}/api/v2.*",
                    "headers": {"Authorization": f"Bearer {access_token}"},
                },
            ]
        )
        return rules