# -*- coding: utf-8 -*-
import pytest
from tutor_scraper import generate_additional_profiles, get_raw_tutors

def test_generate_additional_profiles():
    profiles = generate_additional_profiles(10)
    assert len(profiles) == 10
    for p in profiles:
        assert "fullName" in p
        assert "gender" in p
        assert "age" in p
        assert "subject" in p
        assert "qualification" in p
        assert "gradeLevels" in p
        assert "rating" in p
        assert "avatar_url" in p
        # verify random spaces are generated
        # at least one profile will be created if we generated 10

def test_get_raw_tutors():
    data = get_raw_tutors()
    # Base data is 30, additional is 75, so total should be 105
    assert len(data) == 105
    assert data[0]["fullName"] == "Nguyễn Thành Long"
