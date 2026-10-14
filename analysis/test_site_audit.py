import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location('site_audit', Path(__file__).with_name('site_audit.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class SiteAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / 'index.html'
        self.source.write_text('<a href="/proof#valid">Proof</a>')
        (self.root / 'proof.html').write_text('<h1 id="valid">Proof</h1>')

    def tearDown(self):
        self.temp.cleanup()

    def test_clean_route_and_cross_page_fragment(self):
        self.assertEqual(audit.audit(self.root, [self.source])['errors'], [])

    def test_missing_target_is_detected(self):
        self.source.write_text('<a href="missing.xlsx">Download</a>')
        self.assertIn('missing local target', audit.audit(self.root, [self.source])['errors'][0])

    def test_missing_fragment_is_detected(self):
        self.source.write_text('<a href="/proof#wrong">Proof</a>')
        self.assertIn('missing HTML fragment', audit.audit(self.root, [self.source])['errors'][0])

    def test_duplicate_ids_are_detected(self):
        self.source.write_text('<p id="a"></p><p id="a"></p>')
        self.assertIn('duplicate id', audit.audit(self.root, [self.source])['errors'][0])

    def test_remote_links_are_not_claimed_as_verified(self):
        self.source.write_text('<a href="https://example.org/missing">Remote</a>')
        result = audit.audit(self.root, [self.source])
        self.assertEqual(result['local_references_checked'], 0)
        self.assertEqual(result['errors'], [])

    def test_encoded_traversal_is_rejected(self):
        self.source.write_text('<a href="/%2e%2e/outside">Escape</a>')
        self.assertIn('escapes site root', audit.audit(self.root, [self.source])['errors'][0])

    def test_directory_and_query_string(self):
        folder = self.root / 'tool'
        folder.mkdir()
        (folder / 'index.html').write_text('<h1>Tool</h1>')
        self.source.write_text('<a href="/tool/?mode=review">Tool</a>')
        self.assertEqual(audit.audit(self.root, [self.source])['errors'], [])


if __name__ == '__main__':
    unittest.main()
