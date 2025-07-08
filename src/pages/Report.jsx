import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/apiService";
import { API } from "../config/api";
import {
  UserCircleIcon,
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

function Report() {
  const { reportId } = useParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(API.REPORT.GET, {
          params: { reportId },
        });
        setReport(response.data.data);
      } catch (error) {
        console.error("Report Fetch Error:", error);
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(API.REPORT.SUBMIT, form);
      // handle success
    } catch (err) {
      setError("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Report Not Found</h2>
        <p className="text-gray-600 mt-2">
          The requested report could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Exposure Score */}
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your Digital Exposure Score
        </h2>
        <div className="text-6xl font-bold text-primary-600">
          {report.exposureScore}
        </div>
        <p className="text-gray-600 mt-2">
          {report.exposureScore < 50
            ? "You have a relatively low digital footprint."
            : report.exposureScore < 100
            ? "You have a moderate digital presence."
            : "You have a significant digital footprint."}
        </p>
      </div>

      {/* GitHub Data */}
      {report.githubData && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <UserCircleIcon className="h-8 w-8 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              GitHub Profile
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={report.githubData.profile.avatarUrl}
                alt={report.githubData.profile.username}
                className="h-16 w-16 rounded-full"
              />
              <div>
                <h4 className="text-lg font-medium text-gray-900">
                  {report.githubData.profile.name ||
                    report.githubData.profile.username}
                </h4>
                <p className="text-gray-600">{report.githubData.profile.bio}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {report.githubData.profile.publicRepos}
                </div>
                <div className="text-sm text-gray-600">Public Repos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {report.githubData.profile.followers}
                </div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {report.githubData.profile.following}
                </div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breach Data */}
      {report.breachData && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldExclamationIcon className="h-8 w-8 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Data Breach History
            </h3>
          </div>
          {report.breachData.totalBreaches > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your email has been found in {report.breachData.totalBreaches}{" "}
                data breaches.
              </p>
              <div className="space-y-2">
                {report.breachData.breaches.map((breach) => (
                  <div key={breach.name} className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900">{breach.title}</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {breach.description}
                    </p>
                    <div className="text-sm text-red-600 mt-2">
                      Breach Date:{" "}
                      {new Date(breach.breachDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              No data breaches found for your email address.
            </p>
          )}
        </div>
      )}

      {/* Search Results */}
      {report.searchData && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <MagnifyingGlassIcon className="h-8 w-8 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Search Results
            </h3>
          </div>
          <div className="space-y-4">
            {report.searchData.organicResults.map((result) => (
              <div
                key={result.link}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <a
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {result.title}
                </a>
                <p className="text-gray-600 text-sm mt-1">{result.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Media Presence */}
      {report.socialData && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Social Media Presence
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(report.socialData.platforms).map(
              ([platform, data]) => (
                <div
                  key={platform}
                  className={`p-4 rounded-lg text-center ${
                    data.exists ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <h4 className="font-medium capitalize">{platform}</h4>
                  <p className="text-sm mt-1">
                    {data.exists ? (
                      <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        Profile Found
                      </a>
                    ) : (
                      <span className="text-gray-500">Not Found</span>
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Form fields here */}
        <button type="submit" disabled={loading}>
          Submit Report
        </button>
        {error && <div>{error}</div>}
      </form>
    </div>
  );
}

export default Report;
