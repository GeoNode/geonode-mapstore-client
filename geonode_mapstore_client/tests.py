import os
import shutil
import zipfile
from io import BytesIO

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from geonode.tests.base import GeoNodeBaseTestSupport

from .utils import validate_zip_file
from .admin import ExtensionAdminForm
from .models import Extension
from unittest import mock


# Define temporary directories for testing to avoid affecting the real media/static roots
TEST_MEDIA_ROOT = os.path.join(settings.PROJECT_ROOT, "test_media")
TEST_STATIC_ROOT = os.path.join(settings.PROJECT_ROOT, "test_static")


@override_settings(
    MEDIA_ROOT=TEST_MEDIA_ROOT,
    STATIC_ROOT=TEST_STATIC_ROOT,
)
class ExtensionFeatureTestCase(TestCase):
    """
    A comprehensive test case for the MapStore Extension feature, updated to match
    the latest code with constants and new API response structures.
    """

    def setUp(self):
        """Set up the test environment."""
        self.tearDown()
        os.makedirs(TEST_MEDIA_ROOT, exist_ok=True)
        os.makedirs(TEST_STATIC_ROOT, exist_ok=True)
        self.client = APIClient()
        cache.clear()

    def tearDown(self):
        """Clean up the test directories after each test."""
        if os.path.exists(TEST_MEDIA_ROOT):
            shutil.rmtree(TEST_MEDIA_ROOT)
        if os.path.exists(TEST_STATIC_ROOT):
            shutil.rmtree(TEST_STATIC_ROOT)

    def _create_mock_zip_file(
        self, filename="SampleExtension.zip", add_index_js=True, add_index_json=True
    ):
        """Creates an in-memory zip file for testing uploads."""
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            if add_index_js:
                zf.writestr("index.js", 'console.log("hello");')
            if add_index_json:
                zf.writestr("index.json", '{"name": "test"}')
        zip_buffer.seek(0)
        return SimpleUploadedFile(
            filename, zip_buffer.read(), content_type="application/zip"
        )

    def test_model_save_derives_name_from_file(self):
        """Test that the Extension.save() method correctly sets the name."""
        mock_zip = self._create_mock_zip_file()
        ext = Extension.objects.create(uploaded_file=mock_zip)
        self.assertEqual(ext.name, "SampleExtension")

    def test_form_prevents_duplicate_names(self):
        """Test that ExtensionAdminForm validation fails for a duplicate name."""
        Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        form_data = {}
        file_data = {"uploaded_file": self._create_mock_zip_file()}
        form = ExtensionAdminForm(data=form_data, files=file_data)
        self.assertFalse(form.is_valid())
        self.assertIn("uploaded_file", form.errors)
        self.assertIn("already exists", form.errors["uploaded_file"][0])

    def test_zip_validator_raises_error_for_invalid_file(self):
        """Test that validate_zip_file raises an error for non-zip files."""
        invalid_file = SimpleUploadedFile("test.txt", b"not a zip file")
        with self.assertRaises(ValidationError) as context:
            validate_zip_file(invalid_file)
        self.assertIn("not a valid zip archive", str(context.exception))

    def test_zip_validator_raises_error_for_missing_required_files(self):
        """Test that validate_zip_file fails if index.js or index.json is missing."""
        missing_js_zip = self._create_mock_zip_file(add_index_js=False)
        with self.assertRaises(ValidationError) as context:
            validate_zip_file(missing_js_zip)
        self.assertIn("must contain index.js and index.json", str(context.exception))

    def test_post_save_signal_unzips_file_and_clears_cache(self):
        """Test that the post_save signal unzips the file and clears the cache."""
        ext = Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        self.assertEqual(ext.name, "SampleExtension")

        expected_dir = os.path.join(TEST_STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, ext.name)

        self.assertTrue(
            os.path.isdir(expected_dir), f"Directory {expected_dir} was not created."
        )
        self.assertTrue(os.path.exists(os.path.join(expected_dir, "index.js")))

    def test_post_delete_signal_removes_files_and_clears_cache(self):
        """Test that the post_delete signal removes files and clears the cache."""
        ext = Extension.objects.create(uploaded_file=self._create_mock_zip_file())
        zip_path = ext.uploaded_file.path
        unzipped_dir = os.path.join(TEST_STATIC_ROOT, settings.MAPSTORE_EXTENSIONS_FOLDER_PATH, ext.name)
        self.assertTrue(os.path.exists(zip_path))
        self.assertTrue(os.path.isdir(unzipped_dir))
        ext.delete()
        self.assertFalse(os.path.exists(zip_path))
        self.assertFalse(os.path.isdir(unzipped_dir))

    def test_extensions_view(self):
        """Test the extensions index API endpoint with isolated static folder."""
        # Create mock uploaded extensions
        Extension.objects.create(
            name="ActiveExt", active=True, uploaded_file=self._create_mock_zip_file()
        )
        Extension.objects.create(
            name="InactiveExt", active=False, uploaded_file=self._create_mock_zip_file()
        )

        url = reverse("mapstore-extension")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("ActiveExt", data)
        self.assertNotIn("InactiveExt", data)


    def test_plugins_config_view_structure(self):
        """Test the plugins config API endpoint and its new response structure."""
        mock_file = self._create_mock_zip_file()
        Extension.objects.create(
            name="MapPlugin",
            active=True,
            is_map_extension=True,
            uploaded_file=mock_file,
        )
        Extension.objects.create(
            name="NotAMapPlugin",
            active=True,
            is_map_extension=False,
            uploaded_file=mock_file,
        )

        url = reverse("mapstore-pluginsconfig")

        mock_config_dir = os.path.join(
            settings.STATIC_ROOT, "mapstore", "configs"
        )
        os.makedirs(mock_config_dir, exist_ok=True)
        with open(os.path.join(mock_config_dir, "pluginsConfig.json"), "w") as f:
            f.write('{"plugins": [{"name": "BasePlugin"}]}')

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("plugins", data)

        plugin_list = data["plugins"]
        plugin_names = {p.get("name") for p in plugin_list}

        self.assertIn("MapPlugin", plugin_names)
        self.assertIn("BasePlugin", plugin_names)
        self.assertNotIn("NotAMapPlugin", plugin_names)

        map_plugin_data = next(
            (p for p in plugin_list if p.get("name") == "MapPlugin"), None
        )
        self.assertIsNotNone(map_plugin_data)
        self.assertIn("bundle", map_plugin_data)
        self.assertTrue(map_plugin_data["bundle"].endswith("MapPlugin/index.js"))


class RequestConfigurationViewTestCase(GeoNodeBaseTestSupport):
    """
    Test cases for RequestConfigurationView.
    """

    def setUp(self):
        """Set up test environment."""
        from django.contrib.auth import get_user_model
        from geonode_mapstore_client.registry import RequestConfigurationRulesRegistry
        
        User = get_user_model()
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client = APIClient()
        
        # Reset registry to clean state
        RequestConfigurationRulesRegistry.REGISTRY = []

    def tearDown(self):
        """Clean up after tests."""
        from geonode_mapstore_client.registry import RequestConfigurationRulesRegistry
        RequestConfigurationRulesRegistry.REGISTRY = []

    def test_view_returns_rules_from_all_handlers(self):
        """Test that the view collects and returns rules from all registered handlers."""
        from geonode_mapstore_client.registry import RequestConfigurationRulesRegistry, BaseRequestConfigurationRuleHandler
        
        # Create mock handlers
        class MockHandler1(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"urlPattern": "http://example1.com/.*", "params": {"key1": "value1"}}]
        
        class MockHandler2(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"urlPattern": "http://example2.com/.*", "params": {"key2": "value2"}}]
        
        # Register handlers
        RequestConfigurationRulesRegistry.REGISTRY = []
        RequestConfigurationRulesRegistry.REGISTRY.append(MockHandler1)
        RequestConfigurationRulesRegistry.REGISTRY.append(MockHandler2)
        
        # Make request
        url = reverse("request-params")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("rules", data)
        
        rules = data["rules"]
        self.assertEqual(len(rules), 2)
        
        # Verify both handlers' rules are present
        patterns = [rule["urlPattern"] for rule in rules]
        self.assertIn("http://example1.com/.*", patterns)
        self.assertIn("http://example2.com/.*", patterns)

    def test_view_returns_user_specific_token(self):
        """Test that authenticated users receive rules with their own token."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        from geonode_mapstore_client.registry import RequestConfigurationRulesRegistry
        from geonode.base.auth import get_or_create_token
        
        # Register the default handler
        RequestConfigurationRulesRegistry.REGISTRY = []
        RequestConfigurationRulesRegistry.REGISTRY.append(BaseConfigurationRuleHandler)
        
        self.client.force_authenticate(user=self.user)
        
        # Get expected token
        expected_token = get_or_create_token(self.user).token
        
        # Make request
        url = reverse("request-params")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        rules = data["rules"]
        
        # Verify token is present in rules
        self.assertTrue(len(rules) > 0)
        
        # Check that the token appears in the rules
        token_found = False
        for rule in rules:
            if "params" in rule and "access_token" in rule["params"]:
                self.assertEqual(rule["params"]["access_token"], expected_token)
                token_found = True
            elif "headers" in rule and "Authorization" in rule["headers"]:
                self.assertIn(expected_token, rule["headers"]["Authorization"])
                token_found = True
        
        self.assertTrue(token_found, "User token should be present in rules")

    def test_only_get_allowed(self):
        """Test that only GET requests are allowed."""
        url = reverse("request-params")

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Test POST
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, 405)
        
        # Test PUT
        response = self.client.put(url, {})
        self.assertEqual(response.status_code, 405)
        
        # Test DELETE
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 405)


class RequestConfigurationRulesRegistryTestCase(GeoNodeBaseTestSupport):
    """
    Test cases for RequestConfigurationRulesRegistry.
    """

    def setUp(self):
        """Set up test environment."""
        from geonode_mapstore_client.registry import RequestConfigurationRulesRegistry
        self.registry = RequestConfigurationRulesRegistry()
        self.registry.reset()

    def tearDown(self):
        """Clean up after tests."""
        self.registry.reset()

    def test_add_handler_to_registry(self):
        """Test adding a handler to the registry."""
        from geonode_mapstore_client.registry import BaseRequestConfigurationRuleHandler
        
        class TestHandler(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"test": "rule"}]
        
        initial_count = len(self.registry.REGISTRY)
        self.registry.REGISTRY.append(TestHandler)
        
        self.assertEqual(len(self.registry.REGISTRY), initial_count + 1)
        self.assertIn(TestHandler, self.registry.REGISTRY)

    def test_remove_handler_from_registry(self):
        """Test removing a handler from the registry."""
        from geonode_mapstore_client.registry import BaseRequestConfigurationRuleHandler
        
        class TestHandler(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"test": "rule"}]
        
        self.registry.REGISTRY.append(TestHandler)
        self.assertIn(TestHandler, self.registry.REGISTRY)
        
        self.registry.REGISTRY.remove(TestHandler)
        self.assertNotIn(TestHandler, self.registry.REGISTRY)

    def test_get_rules_collects_from_all_handlers(self):
        """Test that get_rules aggregates rules from all registered handlers."""
        from geonode_mapstore_client.registry import BaseRequestConfigurationRuleHandler
        from django.test import RequestFactory
        
        class Handler1(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"urlPattern": "pattern1"}]
        
        class Handler2(BaseRequestConfigurationRuleHandler):
            def get_rules(self, request):
                return [{"urlPattern": "pattern2"}, {"urlPattern": "pattern3"}]
        
        self.registry.REGISTRY.append(Handler1)
        self.registry.REGISTRY.append(Handler2)
        
        factory = RequestFactory()
        request = factory.get("/")
        
        result = self.registry.get_rules(request)
        
        self.assertIn("rules", result)
        rules = result["rules"]
        self.assertEqual(len(rules), 3)
        
        patterns = [rule["urlPattern"] for rule in rules]
        self.assertIn("pattern1", patterns)
        self.assertIn("pattern2", patterns)
        self.assertIn("pattern3", patterns)

    def test_sanity_check_rejects_invalid_handler(self):
        """Test that sanity checks reject non-subclass handlers."""
        class InvalidHandler:
            """Not a subclass of BaseRequestConfigurationRuleHandler"""
            pass
        
        with self.assertRaises(TypeError) as context:
            self.registry._RequestConfigurationRulesRegistry__check_item(InvalidHandler)
        
        self.assertIn("must be a subclass of BaseRequestConfigurationRuleHandler", str(context.exception))

    @override_settings(REQUEST_CONFIGURATION_RULES_HANDLERS=[
        "geonode_mapstore_client.handlers.BaseConfigurationRuleHandler"
    ])
    def test_init_registry_loads_from_settings(self):
        """Test that init_registry loads handlers from settings."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        
        self.registry.reset()
        self.registry.init_registry()
        
        self.assertIn(BaseConfigurationRuleHandler, self.registry.REGISTRY)


class BaseConfigurationRuleHandlerTestCase(GeoNodeBaseTestSupport):
    """
    Test cases for BaseConfigurationRuleHandler.
    """

    def setUp(self):
        """Set up test environment."""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        self.user1 = User.objects.create_user(username="user1", password="pass1")
        self.user2 = User.objects.create_user(username="user2", password="pass2")

    def test_authenticated_user_gets_rules(self):
        """Test that authenticated users receive configuration rules."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        from django.test import RequestFactory
        
        handler = BaseConfigurationRuleHandler()
        factory = RequestFactory()
        request = factory.get("/")
        request.user = self.user1
        
        rules = handler.get_rules(request)
        
        self.assertIsInstance(rules, list)
        self.assertTrue(len(rules) > 0)

    def test_anonymous_user_gets_empty_rules(self):
        """Test that anonymous users receive empty rules list."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        from django.test import RequestFactory
        from django.contrib.auth.models import AnonymousUser
        
        handler = BaseConfigurationRuleHandler()
        factory = RequestFactory()
        request = factory.get("/")
        request.user = AnonymousUser()
        
        rules = handler.get_rules(request)
        
        self.assertIsInstance(rules, list)
        self.assertEqual(len(rules), 0)

    def test_rules_contain_correct_structure(self):
        """Test that rules have the correct structure with urlPattern and params/headers."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        from django.test import RequestFactory
        
        handler = BaseConfigurationRuleHandler()
        factory = RequestFactory()
        request = factory.get("/")
        request.user = self.user1
        
        rules = handler.get_rules(request)
        
        # Verify each rule has required fields
        for rule in rules:
            self.assertIn("urlPattern", rule)
            self.assertTrue("params" in rule or "headers" in rule)

    def test_different_users_get_different_tokens(self):
        """Test that different users receive different tokens in their rules."""
        from geonode_mapstore_client.handlers import BaseConfigurationRuleHandler
        from django.test import RequestFactory
        from geonode.base.auth import get_or_create_token
        
        handler = BaseConfigurationRuleHandler()
        factory = RequestFactory()
        
        # Get rules for user1
        request1 = factory.get("/")
        request1.user = self.user1
        rules1 = handler.get_rules(request1)
        token1 = get_or_create_token(self.user1).token
        
        # Get rules for user2
        request2 = factory.get("/")
        request2.user = self.user2
        rules2 = handler.get_rules(request2)
        token2 = get_or_create_token(self.user2).token
        
        # Verify tokens are different
        self.assertNotEqual(token1, token2)
        
        # Verify each user's rules contain their own token
        token1_found = any(
            rule.get("params", {}).get("access_token") == token1 or
            token1 in rule.get("headers", {}).get("Authorization", "")
            for rule in rules1
        )
        token2_found = any(
            rule.get("params", {}).get("access_token") == token2 or
            token2 in rule.get("headers", {}).get("Authorization", "")
            for rule in rules2
        )
        
        self.assertTrue(token1_found, "User1's token should be in their rules")
        self.assertTrue(token2_found, "User2's token should be in their rules")
