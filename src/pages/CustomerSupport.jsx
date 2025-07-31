import { useRef, useState, useEffect } from "react";
import {
  FaQuestionCircle,
  FaEnvelope,
  FaPlusCircle,
  FaListAlt,
  FaPhone,
  FaRegFileAlt,
  FaRegComments,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
import { apiGet, apiPost } from "../services/apiService";

const QUICK_LINKS = [
  {
    icon: <FaQuestionCircle className="w-6 h-6 text-[#0c0b45]" />,
    title: "Order Issues",
    desc: "Track, return, or cancel orders",
  },
  {
    icon: <FaRegFileAlt className="w-6 h-6 text-[#0c0b45]" />,
    title: "Payments",
    desc: "Refunds, failed payments",
  },
  {
    icon: <FaRegComments className="w-6 h-6 text-[#0c0b45]" />,
    title: "Account Help",
    desc: "Login, password, profile",
  },
  {
    icon: <FaEnvelope className="w-6 h-6 text-[#0c0b45]" />,
    title: "Contact Us",
    desc: "Email, phone, support",
  },
  {
    icon: <FaPlusCircle className="w-6 h-6 text-[#0c0b45]" />,
    title: "Raise Query",
    desc: "Submit a support request",
  },
  {
    icon: <FaListAlt className="w-6 h-6 text-[#0c0b45]" />,
    title: "My Queries",
    desc: "View your support tickets",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: <FaEnvelope className="w-5 h-5 text-[#0c0b45]" />,
    title: "Email Support",
    desc: "Get a response within 24 hours",
    action: "Email",
    link: "mailto:support@cotchel.com",
    external: true,
  },
  {
    icon: <FaPhone className="w-5 h-5 text-[#0c0b45]" />,
    title: "Call Us",
    desc: "Mon-Sat, 9am-7pm IST",
    action: "+91 98765 43210",
    link: "tel:+919876543210",
    external: true,
  },
  {
    icon: <FaPlusCircle className="w-5 h-5 text-[#0c0b45]" />,
    title: "Raise an Inquiry",
    desc: "Submit a support request",
    action: "Submit",
    link: "#raise-inquiry-section",
    external: false,
  },
];

const FAQS = [
  {
    question: "How do I track my order?",
    answer:
      "Go to 'Track Order' in the navigation bar and enter your order ID to see the latest status.",
  },
  {
    question: "How do I return a product?",
    answer:
      "Visit your orders page, select the order, and click on 'Request Return'. Follow the instructions provided.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can use the 'Raise a Query' option, or contact us via email or phone as listed in the Contact Options.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit/debit cards, UPI, net banking, and popular wallets.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click on 'Forgot Password' to reset your password via email.",
  },
];

const statusBadge = (status) => {
  let color = "bg-gray-200 text-gray-700";
  if (status === "Open") color = "bg-yellow-100 text-yellow-800";
  else if (status === "In_Progress") color = "bg-blue-100 text-blue-800";
  else if (status === "Resolved") color = "bg-green-100 text-green-800";
  else if (status === "Closed") color = "bg-gray-400 text-white";
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      {status?.replace("_", " ") || "Open"}
    </span>
  );
};

const CustomerSupport = () => {
  const inquirySectionRef = useRef(null);
  const [showInquirySection, setShowInquirySection] = useState(false);
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  // Inquiry form state
  const [form, setForm] = useState({
    subject: "",
    message: "",
    inquiryType: "General",
    attachments: [],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Inquiry list state
  const [inquiries, setInquiries] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // Fetch inquiries when section is shown
  useEffect(() => {
    if (showInquirySection && isAuthenticated()) {
      fetchInquiries();
    }
    // eslint-disable-next-line
  }, [showInquirySection, isAuthenticated]);

  const fetchInquiries = async () => {
    setListLoading(true);
    setListError(null);
    const res = await apiGet(API.INQUIRY.USER);
    if (res.success && Array.isArray(res.data.data?.inquiries)) {
      setInquiries(res.data.data.inquiries);
    } else {
      setListError(res.error || "Failed to load inquiries");
      setInquiries([]);
    }
    setListLoading(false);
  };

  // Handle contact option click
  const handleContactOptionClick = (opt, e) => {
    if (opt.external) return; // let <a> handle mailto/tel
    e.preventDefault();
    if (!isAuthenticated()) {
      toast.error("Please log in to raise an inquiry.");
      return;
    }
    setShowInquirySection(true);
    setTimeout(() => {
      if (inquirySectionRef.current) {
        inquirySectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    // For demo, just use file names as URLs. Replace with actual upload logic if needed.
    const urls = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, attachments: urls }));
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    const payload = {
      subject: form.subject,
      message: form.message,
      inquiryType: form.inquiryType || "General",
      attachments: form.attachments,
    };
    const res = await apiPost(API.INQUIRY.CREATE, payload);
    if (res.success) {
      toast.success("Inquiry submitted successfully.");
      setForm({
        subject: "",
        message: "",
        inquiryType: "General",
        attachments: [],
      });
      setFormSuccess("Inquiry submitted successfully.");
      fetchInquiries();
    } else {
      setFormError(res.error || "Failed to submit inquiry");
      toast.error(res.error || "Failed to submit inquiry");
    }
    setFormLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Quick Links / Help Topics */}
      <section className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-6">
          {QUICK_LINKS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border flex flex-col items-center p-3 sm:p-4"
            >
              <div className="mb-2">{item.icon}</div>
              <div className="font-semibold text-gray-800 text-xs sm:text-sm mb-1 text-center">
                {item.title}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 text-center">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Options & FAQ */}
      <section className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
        {/* Contact Options */}
        <div className="col-span-1 bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
            Contact Options
          </h2>
          {CONTACT_OPTIONS.map((opt, idx) =>
            opt.external ? (
              <a
                key={idx}
                href={opt.link}
                className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg border hover:shadow transition-all group"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="bg-gray-100 rounded-full p-1.5 sm:p-2">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm sm:text-base group-hover:text-[#0c0b45]">
                    {opt.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {opt.desc}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-[#0c0b45] font-semibold group-hover:underline">
                  {opt.action}
                </span>
              </a>
            ) : (
              <a
                key={idx}
                href={opt.link}
                onClick={(e) => handleContactOptionClick(opt, e)}
                className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg border hover:shadow transition-all group"
              >
                <div className="bg-gray-100 rounded-full p-1.5 sm:p-2">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm sm:text-base group-hover:text-[#0c0b45]">
                    {opt.title}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    {opt.desc}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-[#0c0b45] font-semibold group-hover:underline">
                  {opt.action}
                </span>
              </a>
            )
          )}
        </div>
        {/* FAQ Section */}
        <div className="col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <FaQuestionCircle className="text-[#0c0b45]" /> Frequently Asked
            Questions
          </h2>
          <ul className="divide-y divide-gray-100">
            {FAQS.map((faq, idx) => (
              <li key={idx}>
                <button
                  className="w-full text-left py-3 flex items-center justify-between focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span className="font-medium text-gray-900 text-sm sm:text-base flex-1">
                    {faq.question}
                  </span>
                  <span
                    className={`ml-4 transition-transform ${
                      openFaq === idx ? "rotate-90" : "rotate-0"
                    }`}
                  >
                    ▶
                  </span>
                </button>
                {openFaq === idx && (
                  <div
                    id={`faq-answer-${idx}`}
                    className="text-gray-600 text-sm sm:text-base pb-3 pl-1 pr-2 animate-fadeIn"
                  >
                    {faq.answer}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Raise Inquiry Section (hidden by default) */}
      {showInquirySection && (
        <section
          ref={inquirySectionRef}
          id="raise-inquiry-section"
          className="max-w-7xl mx-auto px-4 py-10"
        >
          <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
            {/* Inquiry Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 sm:p-6 flex-1 md:max-w-md w-full">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaPlusCircle className="text-[#0D0B46]" /> Raise an Inquiry
              </h2>
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D0B46] focus:border-transparent"
                    placeholder="Subject"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D0B46] focus:border-transparent resize-none"
                    placeholder="Message"
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inquiry Type
                  </label>
                  <select
                    name="inquiryType"
                    value={form.inquiryType}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D0B46] focus:border-transparent"
                    disabled={formLoading}
                  >
                    <option value="General">General</option>
                    <option value="Order">Order</option>
                    <option value="Payment">Payment</option>
                    <option value="Product">Product</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Return">Return</option>
                    <option value="Account">Account</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments (optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D0B46] focus:border-transparent"
                    disabled={formLoading}
                  />
                  {form.attachments.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600">
                      {form.attachments.map((url, idx) => (
                        <li key={idx}>{url.split("/").pop()}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#0D0B46] text-white py-3 rounded-lg font-semibold text-base shadow-sm hover:bg-[#23206a] transition"
                  disabled={formLoading}
                >
                  {formLoading ? "Submitting..." : "Submit Inquiry"}
                </button>
                {formError && (
                  <div className="text-red-500 text-sm mt-2">{formError}</div>
                )}
                {formSuccess && (
                  <div className="text-green-600 text-sm mt-2">
                    {formSuccess}
                  </div>
                )}
              </form>
            </div>
            {/* My Inquiries */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 sm:p-6 flex-1 w-full">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaListAlt className="text-[#0D0B46]" /> My Inquiries
              </h2>
              {listLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : listError ? (
                <div className="text-red-500">{listError}</div>
              ) : inquiries.length === 0 ? (
                <div className="text-gray-500">No inquiries found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inquiries.map((inq) => (
                    <div
                      key={inq._id}
                      className="rounded-xl border border-gray-100 shadow-sm bg-gray-50 hover:bg-white transition p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-semibold text-[#23206a] text-base truncate max-w-[70%]"
                          title={inq.subject}
                        >
                          {inq.subject}
                        </span>
                        {statusBadge(inq.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-[#0D0B46] font-medium">
                          {inq.inquiryType}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="text-gray-400">ID: {inq._id}</span>
                      </div>
                      <div className="text-gray-700 text-sm line-clamp-2">
                        {inq.message}
                      </div>
                      {inq.attachments && inq.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {inq.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline break-all"
                            >
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CustomerSupport;
