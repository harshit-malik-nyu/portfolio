import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('review_case', Path(__file__).with_name('review_case.py'))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class ReviewCaseTests(unittest.TestCase):
    def test_one_hundred_variants_against_independent_oracle(self):
        for seed in range(100):
            with self.subTest(seed=seed):
                result = review.verify(review.make_case(seed))
                self.assertEqual(result['fixture_verification'], 'passed')
                self.assertEqual(result['candidate_assessment'], 'not_performed')

    def test_reproducible_but_varied(self):
        self.assertEqual(review.make_case(18), review.make_case(18))
        self.assertNotEqual(review.make_case(18), review.make_case(19))

    def test_original_fixture_is_not_mutated(self):
        case = review.make_case(1)
        review.verify(case)
        self.assertEqual(case, review.make_case(1))


if __name__ == '__main__':
    unittest.main()
