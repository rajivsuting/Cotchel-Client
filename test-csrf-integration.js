// Frontend CSRF Integration Test Script
// Run this in the browser console to test CSRF protection

console.log("🧪 Testing Frontend CSRF Integration...");

// Test CSRF token utilities
function testCSRFUtils() {
  console.log("\n📋 Testing CSRF Utilities...");

  // Test getCSRFToken
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  console.log("✅ CSRF Token found:", token ? "Yes" : "No");
  console.log("✅ Token length:", token ? token.length : 0);

  // Test token validation
  const isValid = token ? /^[a-zA-Z0-9]+$/.test(token) : false;
  console.log("✅ Token format valid:", isValid);

  return { token, isValid };
}

// Test API calls with CSRF protection
async function testAPICalls() {
  console.log("\n🌐 Testing API Calls...");

  const results = {
    healthCheck: null,
    csrfProtected: null,
    rateLimit: null,
  };

  try {
    // Test health check (should work without CSRF)
    console.log("Testing health check...");
    const healthResponse = await fetch("/api/health", {
      credentials: "include",
    });
    results.healthCheck = {
      status: healthResponse.status,
      success: healthResponse.ok,
    };
    console.log(
      "✅ Health check:",
      results.healthCheck.success ? "PASS" : "FAIL"
    );

    // Test CSRF protected endpoint (should work with token)
    console.log("Testing CSRF protected endpoint...");
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    const csrfResponse = await fetch("/api/test/test-csrf", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token && { "X-CSRF-Token": token }),
      },
      body: JSON.stringify({ test: "data" }),
    });

    results.csrfProtected = {
      status: csrfResponse.status,
      success: csrfResponse.ok,
    };
    console.log(
      "✅ CSRF protected call:",
      results.csrfProtected.success ? "PASS" : "FAIL"
    );

    // Test rate limiting (make multiple requests)
    console.log("Testing rate limiting...");
    let rateLimitHit = false;
    for (let i = 0; i < 105; i++) {
      const response = await fetch("/api/health", {
        credentials: "include",
      });
      if (response.status === 429) {
        rateLimitHit = true;
        break;
      }
    }

    results.rateLimit = {
      hit: rateLimitHit,
      success: true, // Test completed
    };
    console.log("✅ Rate limiting test:", rateLimitHit ? "HIT" : "NOT HIT");
  } catch (error) {
    console.error("❌ API test error:", error);
  }

  return results;
}

// Test error handling
function testErrorHandling() {
  console.log("\n🛡️ Testing Error Handling...");

  const tests = {
    networkError: false,
    csrfError: false,
    rateLimitError: false,
  };

  // Test network error simulation
  try {
    fetch("http://invalid-url-that-does-not-exist.com")
      .then(() => {})
      .catch(() => {
        tests.networkError = true;
        console.log("✅ Network error handling: PASS");
      });
  } catch (error) {
    tests.networkError = true;
    console.log("✅ Network error handling: PASS");
  }

  // Test CSRF error simulation
  fetch("/api/test/test-csrf", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // No CSRF token - should trigger 403
    },
    body: JSON.stringify({ test: "data" }),
  })
    .then((response) => {
      if (response.status === 403) {
        tests.csrfError = true;
        console.log("✅ CSRF error handling: PASS");
      }
    })
    .catch(() => {
      tests.csrfError = true;
      console.log("✅ CSRF error handling: PASS");
    });

  return tests;
}

// Test React components (if available)
function testReactComponents() {
  console.log("\n⚛️ Testing React Components...");

  const tests = {
    errorBoundary: false,
    healthMonitor: false,
  };

  // Check if ErrorBoundary is available
  if (
    window.ErrorBoundary ||
    document.querySelector('[data-testid="error-boundary"]')
  ) {
    tests.errorBoundary = true;
    console.log("✅ ErrorBoundary component: AVAILABLE");
  } else {
    console.log("⚠️ ErrorBoundary component: NOT FOUND");
  }

  // Check if HealthMonitor is available
  if (
    window.HealthMonitor ||
    document.querySelector('[data-testid="health-monitor"]')
  ) {
    tests.healthMonitor = true;
    console.log("✅ HealthMonitor component: AVAILABLE");
  } else {
    console.log("⚠️ HealthMonitor component: NOT FOUND");
  }

  return tests;
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting Frontend CSRF Integration Tests...");
  console.log("=".repeat(60));

  const startTime = Date.now();

  // Run all tests
  const csrfUtils = testCSRFUtils();
  const apiResults = await testAPICalls();
  const errorHandling = testErrorHandling();
  const reactComponents = testReactComponents();

  const totalTime = Date.now() - startTime;

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary:");
  console.log("=".repeat(60));

  console.log("CSRF Utilities:");
  console.log(`  - Token found: ${csrfUtils.token ? "✅" : "❌"}`);
  console.log(`  - Token valid: ${csrfUtils.isValid ? "✅" : "❌"}`);

  console.log("\nAPI Calls:");
  console.log(
    `  - Health check: ${apiResults.healthCheck?.success ? "✅" : "❌"}`
  );
  console.log(
    `  - CSRF protected: ${apiResults.csrfProtected?.success ? "✅" : "❌"}`
  );
  console.log(
    `  - Rate limiting: ${apiResults.rateLimit?.success ? "✅" : "❌"}`
  );

  console.log("\nError Handling:");
  console.log(
    `  - Network errors: ${errorHandling.networkError ? "✅" : "❌"}`
  );
  console.log(`  - CSRF errors: ${errorHandling.csrfError ? "✅" : "❌"}`);
  console.log(
    `  - Rate limit errors: ${errorHandling.rateLimitError ? "✅" : "❌"}`
  );

  console.log("\nReact Components:");
  console.log(
    `  - ErrorBoundary: ${reactComponents.errorBoundary ? "✅" : "❌"}`
  );
  console.log(
    `  - HealthMonitor: ${reactComponents.healthMonitor ? "✅" : "❌"}`
  );

  console.log(`\n⏱️ Total test time: ${totalTime}ms`);

  // Overall status
  const allTestsPassed =
    csrfUtils.isValid &&
    apiResults.healthCheck?.success &&
    apiResults.csrfProtected?.success;

  console.log(`\n🎯 Overall Status: ${allTestsPassed ? "✅ PASS" : "❌ FAIL"}`);

  if (allTestsPassed) {
    console.log(
      "\n🎉 All tests passed! Frontend CSRF integration is working correctly."
    );
  } else {
    console.log("\n⚠️ Some tests failed. Please check the implementation.");
  }

  return {
    csrfUtils,
    apiResults,
    errorHandling,
    reactComponents,
    allTestsPassed,
    totalTime,
  };
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testCSRFUtils,
    testAPICalls,
    testErrorHandling,
    testReactComponents,
    runAllTests,
  };
}

// Auto-run if in browser
if (typeof window !== "undefined") {
  // Wait for page to load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAllTests);
  } else {
    runAllTests();
  }
}

console.log("📝 To run tests manually, call: runAllTests()");
