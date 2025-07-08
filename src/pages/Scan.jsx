import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/apiService";
import { API } from "../config/api";

function Scan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    githubUsername: "",
    email: "",
    name: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fetch data from all endpoints in parallel
      const [githubData, breachData, searchData, socialData] =
        await Promise.all([
          formData.githubUsername
            ? api.get(API.GITHUB.GET, {
                params: { username: formData.githubUsername },
              })
            : Promise.resolve({ data: null }),
          formData.email
            ? api.get(API.BREACHES.GET, { params: { email: formData.email } })
            : Promise.resolve({ data: null }),
          formData.name
            ? api.get(API.SEARCH.GET, { params: { name: formData.name } })
            : Promise.resolve({ data: null }),
          formData.githubUsername
            ? api.get(API.SOCIAL.GET, {
                params: { username: formData.githubUsername },
              })
            : Promise.resolve({ data: null }),
        ]);

      // Store the report
      const reportResponse = await api.post(API.REPORT.POST, {
        githubData: githubData.data?.data,
        breachData: breachData.data?.data,
        searchData: searchData.data?.data,
        socialData: socialData.data?.data,
      });

      // Navigate to report page
      navigate(`/report/${reportResponse.data.data.reportId}`);
    } catch (error) {
      console.error("Scan Error:", error);
      toast.error(
        error.response?.data?.message || "An error occurred during scanning"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (data) => {
    try {
      const response = await api.post(API.PRODUCTS.SEARCH, { data });
      setResult(response.data);
    } catch (err) {
      setError("Scan failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Scan Your Digital Footprint
          </h1>
          <p className="text-gray-600">
            Enter your information below to discover what's publicly visible
            about you online.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="githubUsername"
              className="block text-sm font-medium text-gray-700"
            >
              GitHub Username (optional)
            </label>
            <input
              type="text"
              id="githubUsername"
              name="githubUsername"
              value={formData.githubUsername}
              onChange={handleChange}
              className="input mt-1"
              placeholder="Enter your GitHub username"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address (optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input mt-1"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name (optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input mt-1"
              placeholder="Enter your full name"
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              (!formData.githubUsername && !formData.email && !formData.name)
            }
            className={`btn btn-primary w-full ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Scanning..." : "Start Scan"}
          </button>
        </form>

        <div className="text-sm text-gray-500 text-center">
          <p>
            We respect your privacy. Your data is only used for this scan and is
            not stored permanently.
          </p>
        </div>

        {result && <div>{JSON.stringify(result)}</div>}
        {error && <div>{error}</div>}
      </div>
    </div>
  );
}

export default Scan;
