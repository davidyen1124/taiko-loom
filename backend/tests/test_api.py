import time

import pytest
from fastapi.testclient import TestClient

from taiko_backend.main import app


@pytest.fixture()
def client(data_dir):
    return TestClient(app)


def wait_for(client, job_id, timeout=120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = client.get(f"/api/jobs/{job_id}").json()
        if job["status"] in ("done", "error"):
            return job
        time.sleep(0.2)
    raise AssertionError("analysis did not finish")


def upload(client, path, name, **fields):
    with path.open("rb") as handle:
        return client.post("/api/songs", files={"file": (name, handle, "audio/wav")}, data=fields)


def test_health_and_empty_library(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.get("/api/songs").json() == {"songs": []}


def test_upload_analyse_play_rename_delete(client, loop_factory, data_dir):
    response = upload(client, loop_factory(120, 0.25, 40), "Night Owls - Lantern Parade.wav")
    assert response.status_code == 202
    job = wait_for(client, response.json()["id"])
    assert job["status"] == "done", job
    assert job["progress"] == 1
    song = job["song"]
    assert song["title"] == "Lantern Parade" and song["artist"] == "Night Owls"
    assert set(song["levels"]) == {"easy", "medium", "hard"}

    listing = client.get("/api/songs").json()["songs"]
    assert [s["id"] for s in listing] == [song["id"]]

    full = client.get(f"/api/songs/{song['id']}").json()
    assert full["audio"] == f"/api/songs/{song['id']}/audio"
    assert abs(full["bpm"] - 120) < 0.1
    assert len(full["charts"]["hard"]["notes"]) > len(full["charts"]["easy"]["notes"])

    audio = client.get(full["audio"])
    assert audio.status_code == 200
    assert audio.headers["content-type"] == "audio/flac"
    assert audio.content[:4] == b"fLaC"
    partial = client.get(full["audio"], headers={"Range": "bytes=0-99"})
    assert partial.status_code == 206 and len(partial.content) == 100

    renamed = client.patch(f"/api/songs/{song['id']}", json={"title": "  Moon   Market "}).json()
    assert renamed["title"] == "Moon Market" and renamed["artist"] == "Night Owls"

    assert client.delete(f"/api/songs/{song['id']}").status_code == 204
    assert client.get(f"/api/songs/{song['id']}").status_code == 404
    assert client.get("/api/songs").json() == {"songs": []}
    assert not (data_dir / "songs" / song["id"]).exists()


def test_same_file_is_stored_once(client, loop_factory):
    first = wait_for(client, upload(client, loop_factory(120, 0.25, 40), "a.wav").json()["id"])
    second = wait_for(client, upload(client, loop_factory(120, 0.25, 40), "b.wav", title="Custom").json()["id"])
    assert first["song"]["id"] == second["song"]["id"]
    songs = client.get("/api/songs").json()["songs"]
    assert len(songs) == 1 and songs[0]["title"] == "Custom"


def test_rejects_bad_uploads(client, tmp_path):
    text = tmp_path / "notes.txt"
    text.write_text("hello")
    assert upload(client, text, "notes.txt").status_code == 415
    empty = tmp_path / "empty.mp3"
    empty.write_bytes(b"")
    assert upload(client, empty, "empty.mp3").status_code == 400
    fake = tmp_path / "fake.mp3"
    fake.write_text("definitely not audio")
    job = wait_for(client, upload(client, fake, "fake.mp3").json()["id"])
    assert job["status"] == "error" and "audio" in job["error"]


def test_unknown_ids_are_404_and_paths_cannot_escape(client):
    assert client.get("/api/jobs/nope").status_code == 404
    assert client.get("/api/songs/0000000000000000").status_code == 404
    assert client.get("/api/songs/..%2F..%2Fetc").status_code == 404
    assert client.delete("/api/songs/not-a-real-id").status_code == 404
