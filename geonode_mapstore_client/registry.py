from django.conf import settings
from django.utils.module_loading import import_string


class BaseRequestConfigurationRuleHandler:
    """
    Base class for request configuration rule handlers.
    """

    def get_rules(self, request):
        return []


class RequestConfigurationRulesRegistry:
    """
    A registry for request configuration rule handlers.
    """

    REGISTRY = []

    def init_registry(self):
        self._register()
        self.sanity_checks()

    def add(self, module_path):
        item = import_string(module_path)
        self.__check_item(item)
        if item not in self.REGISTRY:
            self.REGISTRY.append(item)

    def remove(self, module_path):
        item = import_string(module_path)
        self.__check_item(item)
        if item in self.REGISTRY:
            self.REGISTRY.remove(item)

    def reset(self):
        self.REGISTRY = []

    @classmethod
    def get_registry(cls):
        return cls.REGISTRY

    def sanity_checks(self):
        for item in self.REGISTRY:
            self.__check_item(item)

    def get_rules(self, request):
        rules = []
        for HandlerClass in self.REGISTRY:
            handler = HandlerClass()
            rules.extend(handler.get_rules(request))
        return {"rules": rules}

    def __check_item(self, item):
        """
        Ensure that the handler is a subclass of BaseRequestConfigurationRuleHandler
        """
        if not (isinstance(item, type) and issubclass(item, BaseRequestConfigurationRuleHandler)):
            raise TypeError(f"Item must be a subclass of BaseRequestConfigurationRuleHandler, " f"got {item}")

    def _register(self):
        for module_path in getattr(settings, "REQUEST_CONFIGURATION_RULES_HANDLERS", []):
            self.add(module_path)


request_configuration_rules_registry = RequestConfigurationRulesRegistry()