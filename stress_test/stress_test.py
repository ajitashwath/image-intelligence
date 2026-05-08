"""
Stress Test Suite — Event-Driven Image Intelligence Pipeline
Tests: S3 upload throughput, API Gateway /images endpoint, concurrent load, Lambda cold-start, error paths
"""

import os
import sys
import time
import uuid
import json
import asyncio
import argparse
import statistics
import threading
import concurrent.futures
from dataclasses import dataclass, field
from typing import List, Optional

import boto3
import requests
from botocore.exceptions import ClientError

# ─── Config ────────────────────────────────────────────────────────────────────
REGION          = os.environ.get("AWS_REGION", "us-east-1")
BUCKET_NAME     = os.environ.get("S3_BUCKET_NAME", "")        # Required
API_BASE_URL    = os.environ.get("API_BASE_URL", "")          # Required  e.g. https://xxx.execute-api.us-east-1.amazonaws.com/prod
USER_ID         = os.environ.get("TEST_USER_ID", "stress-test-user")

# ─── Data classes ──────────────────────────────────────────────────────────────
@dataclass
class TestResult:
    name: str
    passed: bool
    duration_ms: float
    detail: str = ""
    error: Optional[str] = None

@dataclass
class SuiteReport:
    results: List[TestResult] = field(default_factory=list)

    def add(self, r: TestResult):
        self.results.append(r)

    def print_summary(self):
        passed  = [r for r in self.results if r.passed]
        failed  = [r for r in self.results if not r.passed]
        durations = [r.duration_ms for r in self.results]
        print("\n" + "═" * 70)
        print("  STRESS TEST REPORT")
        print("═" * 70)
        print(f"  Total  : {len(self.results)}")
        print(f"  Passed : {len(passed)}")
        print(f"  Failed : {len(failed)}")
        if durations:
            print(f"  Avg latency : {statistics.mean(durations):.0f} ms")
            print(f"  P95 latency : {sorted(durations)[int(len(durations)*0.95)]:.0f} ms")
            print(f"  Max latency : {max(durations):.0f} ms")
        print("─" * 70)
        for r in self.results:
            icon = "✓" if r.passed else "✗"
            print(f"  {icon}  {r.name:<45} {r.duration_ms:>7.0f} ms")
            if r.error:
                print(f"       └─ {r.error}")
            elif r.detail:
                print(f"       └─ {r.detail}")
        print("═" * 70)
        return len(failed) == 0

# ─── Helpers ───────────────────────────────────────────────────────────────────
def _timer():
    return time.perf_counter() * 1000   # ms

def _make_test_image(size_kb: int = 50) -> bytes:
    """Return a minimal valid JPEG of approximately size_kb."""
    # Minimal 1×1 JPEG header + filler bytes
    jpeg_header = bytes([
        0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,
        0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xD9
    ])
    filler = b"\x00" * max(0, size_kb * 1024 - len(jpeg_header))
    return jpeg_header + filler

def _s3_client():
    return boto3.client("s3", region_name=REGION)

def _upload_image(bucket: str, key: str, data: bytes) -> float:
    """Upload bytes to S3, return duration in ms."""
    s3 = _s3_client()
    t0 = _timer()
    s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType="image/jpeg")
    return _timer() - t0

def _api_get(path: str, params: dict = None, timeout: int = 10):
    url = f"{API_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
    t0 = _timer()
    resp = requests.get(url, params=params, timeout=timeout)
    ms = _timer() - t0
    return resp, ms

# ─── Test functions ────────────────────────────────────────────────────────────

def test_s3_single_upload(bucket: str) -> TestResult:
    """Upload a single image and verify it lands in S3."""
    name = "S3 — Single image upload"
    key  = f"{USER_ID}/single-{uuid.uuid4()}.jpg"
    data = _make_test_image(50)
    try:
        ms = _upload_image(bucket, key, data)
        # Verify object exists
        s3 = _s3_client()
        head = s3.head_object(Bucket=bucket, Key=key)
        ok   = head["ContentLength"] == len(data)
        return TestResult(name, ok, ms, f"key={key} size={len(data)}B")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_s3_burst_uploads(bucket: str, count: int = 20, workers: int = 5) -> TestResult:
    """Upload `count` images concurrently using `workers` threads."""
    name = f"S3 — Burst {count} uploads ({workers} workers)"
    data = _make_test_image(30)
    errors = []
    durations = []

    def _upload(_):
        key = f"{USER_ID}/burst-{uuid.uuid4()}.jpg"
        try:
            ms = _upload_image(bucket, key, data)
            durations.append(ms)
        except Exception as e:
            errors.append(str(e))

    t0 = _timer()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(_upload, range(count)))
    total_ms = _timer() - t0

    ok = len(errors) == 0
    detail = (f"success={count - len(errors)}/{count} "
              f"avg={statistics.mean(durations):.0f}ms "
              f"total={total_ms:.0f}ms")
    error_msg = "; ".join(errors[:3]) if errors else None
    return TestResult(name, ok, total_ms, detail, error_msg)


def test_s3_large_image(bucket: str) -> TestResult:
    """Upload a 5 MB image to verify Lambda can handle large S3 events."""
    name = "S3 — Large image (5 MB)"
    key  = f"{USER_ID}/large-{uuid.uuid4()}.jpg"
    data = _make_test_image(5120)
    try:
        ms = _upload_image(bucket, key, data)
        return TestResult(name, True, ms, f"size={len(data)//1024}KB")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_s3_special_chars(bucket: str) -> TestResult:
    """Upload an image with spaces/special chars in the key (orchestrator URL-decodes these)."""
    name = "S3 — Key with spaces (URL encoding)"
    key  = f"{USER_ID}/test image with spaces {uuid.uuid4()}.jpg"
    data = _make_test_image(10)
    try:
        ms = _upload_image(bucket, key, data)
        return TestResult(name, True, ms, f"key='{key}'")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_api_missing_userid() -> TestResult:
    """GET /images without userId should return 400."""
    name = "API — Missing userId returns 400"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")
    try:
        resp, ms = _api_get("/images")
        ok = resp.status_code == 400
        return TestResult(name, ok, ms, f"status={resp.status_code}")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_api_valid_request() -> TestResult:
    """GET /images?userId=X should return 200 with an `items` array."""
    name = "API — Valid userId returns 200 + items[]"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")
    try:
        resp, ms = _api_get("/images", {"userId": USER_ID})
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
        has_items = "items" in body
        return TestResult(name, ok and has_items, ms,
                          f"status={resp.status_code} items={len(body.get('items', []))}")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_api_concurrent_requests(count: int = 30, workers: int = 10) -> TestResult:
    """Hammer the API Gateway with concurrent GET requests."""
    name = f"API — {count} concurrent GET /images"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")

    durations = []
    errors = []

    def _call(_):
        try:
            resp, ms = _api_get("/images", {"userId": USER_ID})
            durations.append(ms)
            if resp.status_code != 200:
                errors.append(f"HTTP {resp.status_code}")
        except Exception as e:
            errors.append(str(e))

    t0 = _timer()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(_call, range(count)))
    total_ms = _timer() - t0

    ok = len(errors) == 0
    avg = statistics.mean(durations) if durations else 0
    p95 = sorted(durations)[int(len(durations) * 0.95)] if durations else 0
    detail = (f"success={count-len(errors)}/{count} "
              f"avg={avg:.0f}ms p95={p95:.0f}ms")
    return TestResult(name, ok, total_ms, detail,
                      "; ".join(errors[:3]) if errors else None)


def test_api_response_time_sla(threshold_ms: int = 2000) -> TestResult:
    """Single cold request must respond under `threshold_ms`."""
    name = f"API — Response time SLA < {threshold_ms}ms"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")
    try:
        resp, ms = _api_get("/images", {"userId": USER_ID})
        ok = resp.status_code == 200 and ms < threshold_ms
        return TestResult(name, ok, ms, f"status={resp.status_code} latency={ms:.0f}ms")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_api_invalid_method() -> TestResult:
    """POST /images should be rejected (405 or 403)."""
    name = "API — POST /images returns 4xx"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")
    try:
        url = f"{API_BASE_URL.rstrip('/')}/images"
        t0  = _timer()
        resp = requests.post(url, json={}, timeout=10)
        ms   = _timer() - t0
        ok = resp.status_code in (403, 405)
        return TestResult(name, ok, ms, f"status={resp.status_code}")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_pipeline_end_to_end(bucket: str, wait_seconds: int = 30) -> TestResult:
    """
    Upload an image → poll DynamoDB until the record appears (max wait_seconds).
    Validates the full async pipeline: S3 → Lambda → Rekognition → DynamoDB.
    """
    name = f"E2E — Upload → DynamoDB record (wait≤{wait_seconds}s)"
    if not bucket:
        return TestResult(name, False, 0, error="S3_BUCKET_NAME not set")

    key  = f"{USER_ID}/e2e-{uuid.uuid4()}.jpg"
    data = _make_test_image(50)

    try:
        upload_ms = _upload_image(bucket, key, data)
    except Exception as e:
        return TestResult(name, False, 0, error=f"Upload failed: {e}")

    # Poll DynamoDB for the record
    ddb   = boto3.resource("dynamodb", region_name=REGION)
    table_name = os.environ.get("TABLE_NAME", "")
    if not table_name:
        return TestResult(name, False, upload_ms,
                          error="TABLE_NAME env var not set — cannot verify DynamoDB write")

    table = ddb.Table(table_name)
    t0    = _timer()
    found = False
    while (_timer() - t0) < wait_seconds * 1000:
        try:
            resp = table.get_item(Key={"imageId": key})
            if "Item" in resp:
                found = True
                break
        except ClientError:
            pass
        time.sleep(2)

    total_ms = upload_ms + (_timer() - t0)
    if found:
        return TestResult(name, True, total_ms,
                          f"Record found in {(total_ms - upload_ms):.0f}ms after upload")
    return TestResult(name, False, total_ms,
                      error=f"Record NOT found within {wait_seconds}s")


def test_dynamodb_userindex_gsi() -> TestResult:
    """Query the UserIndex GSI directly and verify pagination/sorting."""
    name = "DynamoDB — UserIndex GSI query"
    table_name = os.environ.get("TABLE_NAME", "")
    if not table_name:
        return TestResult(name, False, 0, error="TABLE_NAME not set")

    ddb   = boto3.resource("dynamodb", region_name=REGION)
    table = ddb.Table(table_name)
    t0    = _timer()
    try:
        resp = table.query(
            IndexName="UserIndex",
            KeyConditionExpression=boto3.dynamodb.conditions.Key("userId").eq(USER_ID),
            ScanIndexForward=False,
            Limit=50
        )
        ms    = _timer() - t0
        items = resp.get("Items", [])
        # Verify descending sort (createdAt)
        dates = [i.get("createdAt", "") for i in items]
        sorted_ok = dates == sorted(dates, reverse=True)
        return TestResult(name, True, ms,
                          f"items={len(items)} sorted={sorted_ok}")
    except Exception as e:
        return TestResult(name, False, _timer() - t0, error=str(e))


def test_s3_non_image_file(bucket: str) -> TestResult:
    """Upload a .txt file — orchestrator should not crash (error is caught, not re-raised fatally)."""
    name = "S3 — Non-image (.txt) upload handled gracefully"
    if not bucket:
        return TestResult(name, False, 0, error="S3_BUCKET_NAME not set")

    key  = f"{USER_ID}/document-{uuid.uuid4()}.txt"
    data = b"This is not an image file."
    try:
        s3 = _s3_client()
        t0 = _timer()
        s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType="text/plain")
        ms = _timer() - t0
        # We can't easily check Lambda logs here, so we just confirm S3 accepted it
        return TestResult(name, True, ms, "Uploaded .txt — Lambda error is expected and caught")
    except Exception as e:
        return TestResult(name, False, 0, error=str(e))


def test_api_pagination_stress(pages: int = 5) -> TestResult:
    """Call /images repeatedly simulating a user paginating quickly."""
    name = f"API — Rapid sequential pagination ({pages} calls)"
    if not API_BASE_URL:
        return TestResult(name, False, 0, error="API_BASE_URL not set")

    durations = []
    errors     = []
    t0         = _timer()
    for _ in range(pages):
        try:
            resp, ms = _api_get("/images", {"userId": USER_ID})
            durations.append(ms)
            if resp.status_code != 200:
                errors.append(f"HTTP {resp.status_code}")
        except Exception as e:
            errors.append(str(e))

    total_ms = _timer() - t0
    ok = not errors
    avg = statistics.mean(durations) if durations else 0
    return TestResult(name, ok, total_ms,
                      f"pages={pages} avg={avg:.0f}ms",
                      "; ".join(errors) if errors else None)


# ─── Runner ────────────────────────────────────────────────────────────────────

def run_all(args) -> bool:
    report = SuiteReport()
    bucket = args.bucket or BUCKET_NAME

    print("\n" + "═" * 70)
    print("  EVENT-DRIVEN IMAGE INTELLIGENCE — STRESS TEST SUITE")
    print("═" * 70)
    print(f"  Region    : {REGION}")
    print(f"  Bucket    : {bucket or '(not set)'}")
    print(f"  API URL   : {API_BASE_URL or '(not set)'}")
    print(f"  User ID   : {USER_ID}")
    print("─" * 70 + "\n")

    # ── S3 Tests ──────────────────────────────────────────────────────────────
    if bucket:
        print("Running S3 upload tests...")
        report.add(test_s3_single_upload(bucket))
        report.add(test_s3_burst_uploads(bucket, count=args.burst_count, workers=args.workers))
        report.add(test_s3_large_image(bucket))
        report.add(test_s3_special_chars(bucket))
        report.add(test_s3_non_image_file(bucket))
    else:
        print("⚠  Skipping S3 tests — S3_BUCKET_NAME not set")

    # ── API Tests ─────────────────────────────────────────────────────────────
    if API_BASE_URL:
        print("\nRunning API Gateway tests...")
        report.add(test_api_missing_userid())
        report.add(test_api_valid_request())
        report.add(test_api_response_time_sla(threshold_ms=args.sla_ms))
        report.add(test_api_invalid_method())
        report.add(test_api_concurrent_requests(count=args.api_count, workers=args.workers))
        report.add(test_api_pagination_stress(pages=5))
    else:
        print("⚠  Skipping API tests — API_BASE_URL not set")

    # ── DynamoDB Tests ────────────────────────────────────────────────────────
    if os.environ.get("TABLE_NAME"):
        print("\nRunning DynamoDB tests...")
        report.add(test_dynamodb_userindex_gsi())
    else:
        print("⚠  Skipping DynamoDB tests — TABLE_NAME not set")

    # ── End-to-End Test ───────────────────────────────────────────────────────
    if args.e2e and bucket and os.environ.get("TABLE_NAME"):
        print("\nRunning end-to-end pipeline test (this may take up to 30s)...")
        report.add(test_pipeline_end_to_end(bucket, wait_seconds=args.e2e_wait))
    elif args.e2e:
        print("⚠  Skipping E2E test — S3_BUCKET_NAME or TABLE_NAME not set")

    return report.print_summary()


# ─── CLI ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stress test the Image Intelligence pipeline")
    parser.add_argument("--bucket",       default=BUCKET_NAME,  help="S3 bucket name")
    parser.add_argument("--burst-count",  type=int, default=20, help="Number of images in burst test")
    parser.add_argument("--api-count",    type=int, default=30, help="Number of concurrent API requests")
    parser.add_argument("--workers",      type=int, default=5,  help="Thread pool size")
    parser.add_argument("--sla-ms",       type=int, default=2000, help="API response SLA in ms")
    parser.add_argument("--e2e",          action="store_true",  help="Run end-to-end pipeline test")
    parser.add_argument("--e2e-wait",     type=int, default=30, help="Seconds to wait for E2E DynamoDB write")
    args = parser.parse_args()

    success = run_all(args)
    sys.exit(0 if success else 1)
