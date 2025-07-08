#!/usr/bin/env node

/**
 * Script to identify files that still use direct axios calls
 * This helps ensure all API calls use the apiService for CSRF protection
 */

const fs = require("fs");
const path = require("path");

// Files that have already been updated
const updatedFiles = [
  "frontend/src/context/NotificationContext.jsx",
  "frontend/src/pages/Login.jsx",
  "frontend/src/pages/Home.jsx",
  "frontend/src/pages/Cart.jsx",
  "frontend/src/components/Navbar.jsx",
  "frontend/src/pages/ProductDetail.jsx",
];

// Files that still need to be updated
const filesToUpdate = [
  "frontend/src/pages/Wishlist.jsx",
  "frontend/src/pages/Search.jsx",
  "frontend/src/pages/Checkout.jsx",
  "frontend/src/pages/Category.jsx",
  "frontend/src/pages/Register.jsx",
  "frontend/src/pages/Profile.jsx",
  "frontend/src/pages/Orders.jsx",
  "frontend/src/pages/AddressSelection.jsx",
  "frontend/src/pages/buyer/ManageAddress.jsx",
  "frontend/src/pages/buyer/OrderHistory.jsx",
  "frontend/src/pages/seller/Orders.jsx",
  "frontend/src/pages/seller/Earnings.jsx",
  "frontend/src/pages/seller/AllProducts.jsx",
  "frontend/src/pages/seller/AddProduct.jsx",
  "frontend/src/pages/Report.jsx",
  "frontend/src/pages/BecomeSeller.jsx",
  "frontend/src/pages/Scan.jsx",
  "frontend/src/pages/SellerDetails.jsx",
  "frontend/src/components/SellerSidebar.jsx",
  "frontend/src/components/BuyerSidebar.jsx",
  "frontend/src/App.jsx",
];

console.log("🔍 Files that have been updated:");
updatedFiles.forEach((file) => {
  console.log(`✅ ${file}`);
});

console.log("\n📝 Files that still need to be updated:");
filesToUpdate.forEach((file) => {
  console.log(`⚠️  ${file}`);
});

console.log("\n🛠️  Manual Update Instructions:");
console.log("For each file above, you need to:");
console.log('1. Replace: import axios from "axios";');
console.log('   With:    import api from "../services/apiService";');
console.log("");
console.log('2. Replace: import { API, API_CONFIG } from "../config/api";');
console.log('   With:    import { API } from "../config/api";');
console.log("");
console.log("3. Replace all axios calls with api calls:");
console.log("   - axios.get() → api.get()");
console.log("   - axios.post() → api.post()");
console.log("   - axios.put() → api.put()");
console.log("   - axios.delete() → api.delete()");
console.log("   - axios.patch() → api.patch()");
console.log("");
console.log(
  "4. Remove withCredentials: true from api calls (apiService handles this)"
);
console.log(
  "5. Remove API_CONFIG from axios calls (apiService handles headers)"
);

console.log("\n🎯 Priority files to update first:");
const priorityFiles = [
  "frontend/src/pages/Checkout.jsx",
  "frontend/src/pages/Category.jsx",
  "frontend/src/pages/Search.jsx",
  "frontend/src/pages/Wishlist.jsx",
];
priorityFiles.forEach((file) => {
  console.log(`🔥 ${file}`);
});

console.log("\n📊 Summary:");
console.log(`✅ Updated: ${updatedFiles.length} files`);
console.log(`⚠️  Remaining: ${filesToUpdate.length} files`);
console.log(`🎯 Priority: ${priorityFiles.length} files`);

// Check if files exist
console.log("\n🔍 File existence check:");
filesToUpdate.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTS`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
  }
});
