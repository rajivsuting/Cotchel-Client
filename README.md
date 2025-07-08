# Cotchel Frontend

A modern React frontend for the Cotchel e-commerce platform with enterprise-grade security features including CSRF protection, enhanced error handling, and comprehensive monitoring.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛡️ Security Features

### CSRF Protection

The frontend is fully integrated with the backend's CSRF protection system:

- **Automatic Token Handling**: CSRF tokens are automatically included in all requests
- **Token Refresh**: Automatic page refresh when tokens expire
- **Error Handling**: Graceful handling of CSRF violations

### Enhanced Error Handling

- **Structured Error Responses**: All errors return consistent, user-friendly messages
- **Error Boundaries**: React error boundaries catch and handle errors gracefully
- **Rate Limiting**: Automatic handling of rate limit errors
- **Network Errors**: Proper handling of network connectivity issues

## 📊 Monitoring & Health Checks

### Health Monitoring

- **Real-time Health Checks**: Automatic monitoring of server health
- **System Metrics**: Display of database, memory, and system status
- **Performance Tracking**: Response time monitoring

### Error Tracking

- **Request ID Tracking**: Each request gets a unique ID for debugging
- **Structured Logging**: Comprehensive error logging
- **User-friendly Messages**: Clear error messages for users

## 🔧 API Integration

### API Service (`src/services/apiService.js`)

The main API service provides:

```javascript
import api, { apiGet, apiPost, apiPut, apiDelete } from "./services/apiService";

// Automatic CSRF token handling
const result = await apiPost("/api/products", productData);

// Enhanced error handling
if (result.success) {
  // Handle success
} else {
  // Handle error with user-friendly message
  console.error(result.error);
}
```

### Redux Integration (`src/redux/api/apiSlice.js`)

Redux Toolkit Query is configured with CSRF protection:

```javascript
// Automatic CSRF token inclusion in all RTK Query requests
const { data, error, isLoading } = useGetProductsQuery();
```

### Custom Hooks (`src/hooks/useApi.js`)

Custom hooks for API calls with built-in error handling:

```javascript
import { useApi, useRateLimit, useHealthCheck } from "./hooks/useApi";

function MyComponent() {
  const { get, post, loading, error } = useApi();
  const { healthStatus, checkHealth } = useHealthCheck();

  // Use with automatic CSRF protection
  const handleSubmit = async (data) => {
    const result = await post("/api/orders", data);
    if (result.success) {
      // Handle success
    }
  };
}
```

## 🛠️ Components

### Error Boundary (`src/components/ErrorBoundary.jsx`)

Catches and handles errors gracefully:

- **CSRF Errors**: Automatic page refresh for expired tokens
- **Rate Limit Errors**: User-friendly rate limiting messages
- **General Errors**: Graceful error handling with retry options

### Health Monitor (`src/components/HealthMonitor.jsx`)

Displays system health and metrics:

```javascript
import HealthMonitor from './components/HealthMonitor';

// Simple status indicator
<HealthMonitor />

// Detailed metrics view
<HealthMonitor showDetails={true} />
```

## 🔧 Utilities

### CSRF Utilities (`src/utils/csrfUtils.js`)

Utility functions for CSRF token management:

```javascript
import {
  getCSRFToken,
  hasCSRFToken,
  refreshCSRFToken,
  createHeadersWithCSRF,
} from "./utils/csrfUtils";

// Get current CSRF token
const token = getCSRFToken();

// Check if token exists
if (hasCSRFToken()) {
  // Token is available
}

// Create headers with CSRF token
const headers = createHeadersWithCSRF({
  Authorization: "Bearer token",
});
```

## 🌐 Environment Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Development/Production
NODE_ENV=development
```

### API Configuration (`src/config/api.js`)

Centralized API endpoint configuration:

```javascript
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    // ... more endpoints
  },
  // ... other API groups
};
```

## 🔄 Error Handling Flow

### 1. Request Interceptor

```javascript
// Automatically adds CSRF token to all requests
api.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});
```

### 2. Response Interceptor

```javascript
// Handles CSRF and rate limiting errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "Invalid or missing CSRF token"
    ) {
      window.location.reload();
    }
    return Promise.reject(error);
  }
);
```

### 3. Error Boundary

```javascript
// Catches React errors and displays user-friendly messages
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 📱 Usage Examples

### Making API Calls

```javascript
import { useApi } from "./hooks/useApi";

function ProductForm() {
  const { post, loading, error } = useApi();

  const handleSubmit = async (formData) => {
    const result = await post("/api/products", formData);

    if (result.success) {
      // Success handling
      toast.success("Product created successfully!");
    } else {
      // Error handling
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Product"}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
```

### Health Monitoring

```javascript
import { useHealthCheck } from "./hooks/useApi";

function Dashboard() {
  const { healthStatus, checkHealth } = useHealthCheck();

  return (
    <div>
      <h2>System Status</h2>
      <div className={`status ${healthStatus.status}`}>
        {healthStatus.status === "ok" ? "🟢 Healthy" : "🔴 Unhealthy"}
      </div>
      <button onClick={checkHealth}>Refresh Status</button>
    </div>
  );
}
```

## 🧪 Testing

### Testing CSRF Protection

```javascript
// Test CSRF token handling
import { getCSRFToken, hasCSRFToken } from "./utils/csrfUtils";

test("CSRF token is available", () => {
  expect(hasCSRFToken()).toBe(true);
});

test("CSRF token format is valid", () => {
  const token = getCSRFToken();
  expect(token).toMatch(/^[a-zA-Z0-9]+$/);
});
```

### Testing Error Handling

```javascript
// Test error boundary
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./components/ErrorBoundary";

test("Error boundary catches errors", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
});
```

## 🚀 Production Deployment

### Build Configuration

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

```bash
# Production environment variables
VITE_API_URL=https://your-production-api.com/api
NODE_ENV=production
```

### Security Headers

Ensure your hosting provider sets appropriate security headers:

```bash
# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'

# CSRF Protection
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

## 🔍 Troubleshooting

### Common Issues

#### CSRF Token Not Found

**Symptoms**: 403 errors on POST requests
**Solutions**:

- Check if cookies are enabled
- Verify CORS configuration
- Ensure `credentials: 'include'` is set

#### Rate Limiting Errors

**Symptoms**: 429 errors for normal users
**Solutions**:

- Check request frequency
- Implement exponential backoff
- Contact backend team if persistent

#### Network Errors

**Symptoms**: "No response from server" errors
**Solutions**:

- Check internet connection
- Verify API server is running
- Check firewall settings

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem("debug", "true");

// Check CSRF token info
import { getCSRFTokenInfo } from "./utils/csrfUtils";
console.log(getCSRFTokenInfo());
```

## 📚 Additional Resources

- [Backend API Documentation](../Cotchel_Server/README.md)
- [Security Implementation Guide](../Cotchel_Server/README.md#security-configuration)
- [Frontend Integration Guide](../Cotchel_Server/README.md#frontend-integration)

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test CSRF protection thoroughly
5. Ensure error handling is comprehensive

## 📄 License

This project is licensed under the ISC License.
#   C o t c h e l - C l i e n t  
 