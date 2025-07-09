// CSRF Debug Test Script
// Run this in the browser console to test CSRF functionality

const API_BASE = "https://starfish-app-6q6ot.ondigitalocean.app";

async function testCSRF() {
  console.log("🔍 Starting CSRF Debug Test...");

  // Test 1: Check current cookies
  console.log("\n📋 Current Cookies:");
  console.log(document.cookie);

  // Test 2: Try to get CSRF token from health endpoint
  console.log("\n🏥 Testing Health Endpoint...");
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Health Response Status:", healthResponse.status);
    console.log(
      "Health Response Headers:",
      Object.fromEntries(healthResponse.headers.entries())
    );

    const healthData = await healthResponse.json();
    console.log("Health Data:", healthData);

    // Wait a moment for cookie to be set
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check cookies after health request
    console.log("\n🍪 Cookies after health request:");
    console.log(document.cookie);

    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    console.log("CSRF Token found:", csrfToken ? "Yes" : "No");
    if (csrfToken) {
      console.log("Token length:", csrfToken.length);
    }
  } catch (error) {
    console.error("Health request failed:", error);
  }

  // Test 3: Try CSRF test endpoint
  console.log("\n🧪 Testing CSRF Test Endpoint...");
  try {
    const testResponse = await fetch(`${API_BASE}/api/csrf-test`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("CSRF Test Response Status:", testResponse.status);
    const testData = await testResponse.json();
    console.log("CSRF Test Data:", testData);
  } catch (error) {
    console.error("CSRF test request failed:", error);
  }

  // Test 4: Try POST with CSRF token
  console.log("\n📤 Testing POST with CSRF Token...");
  try {
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    if (csrfToken) {
      const postResponse = await fetch(`${API_BASE}/api/csrf-test`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ test: "data" }),
      });

      console.log("POST Response Status:", postResponse.status);
      const postData = await postResponse.json();
      console.log("POST Data:", postData);
    } else {
      console.log("❌ No CSRF token available for POST test");
    }
  } catch (error) {
    console.error("POST request failed:", error);
  }

  // Test 5: Test with Axios instance
  console.log("\n🚀 Testing with Axios Instance...");
  try {
    const axios = await import("axios");
    const api = axios.default.create({
      baseURL: API_BASE,
      withCredentials: true,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-CSRF-Token",
    });

    const axiosResponse = await api.get("/api/csrf-test");
    console.log("Axios Response:", axiosResponse.data);
  } catch (error) {
    console.error("Axios test failed:", error);
  }

  console.log("\n✅ CSRF Debug Test Complete!");
}

// Run the test
testCSRF();
