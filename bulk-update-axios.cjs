#!/usr/bin/env node

/**
 * Bulk update script to replace all direct axios calls with apiService
 * This fixes CSRF token issues across the entire frontend
 */

const fs = require("fs");
const path = require("path");

// Files that still need to be updated
const filesToUpdate = [
  "frontend/src/pages/SellerDetails.jsx",
  "frontend/src/pages/seller/Orders.jsx",
  "frontend/src/pages/seller/Earnings.jsx",
  "frontend/src/pages/seller/AllProducts.jsx",
  "frontend/src/pages/seller/AddProduct.jsx",
  "frontend/src/pages/Scan.jsx",
  "frontend/src/pages/Report.jsx",
  "frontend/src/pages/Register.jsx",
  "frontend/src/pages/buyer/OrderHistory.jsx",
  "frontend/src/pages/buyer/ManageAddress.jsx",
  "frontend/src/pages/BecomeSeller.jsx",
  "frontend/src/pages/AddressSelection.jsx",
  "frontend/src/components/SellerSidebar.jsx",
  "frontend/src/components/BuyerSidebar.jsx",
];

// Files that have already been updated
const updatedFiles = [
  "frontend/src/context/NotificationContext.jsx",
  "frontend/src/pages/Login.jsx",
  "frontend/src/pages/Home.jsx",
  "frontend/src/pages/Cart.jsx",
  "frontend/src/components/Navbar.jsx",
  "frontend/src/pages/ProductDetail.jsx",
  "frontend/src/pages/Wishlist.jsx",
  "frontend/src/pages/Checkout.jsx",
  "frontend/src/pages/Search.jsx",
  "frontend/src/pages/Category.jsx",
  "frontend/src/pages/Products.jsx",
];

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let updated = false;

    // Replace import statements
    if (content.includes('import axios from "axios"')) {
      content = content.replace(
        'import axios from "axios"',
        'import api from "../services/apiService"'
      );
      updated = true;
    }

    // Replace API_CONFIG imports
    if (content.includes("import { API, API_CONFIG")) {
      content = content.replace("import { API, API_CONFIG", "import { API");
      updated = true;
    }

    // Replace axios calls with api calls
    const axiosReplacements = [
      { from: "axios.get(", to: "api.get(" },
      { from: "axios.post(", to: "api.post(" },
      { from: "axios.put(", to: "api.put(" },
      { from: "axios.delete(", to: "api.delete(" },
      { from: "axios.patch(", to: "api.patch(" },
    ];

    axiosReplacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, "g"), to);
        updated = true;
      }
    });

    // Remove withCredentials and API_CONFIG from api calls
    content = content.replace(
      /,\s*{\s*\.\.\.API_CONFIG,\s*withCredentials:\s*true\s*}/g,
      ""
    );
    content = content.replace(/,\s*{\s*withCredentials:\s*true\s*}/g, "");
    content = content.replace(/,\s*{\s*\.\.\.API_CONFIG\s*}/g, "");

    if (updated) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

console.log("🚀 Starting bulk axios to apiService update...\n");

console.log("✅ Files already updated:");
updatedFiles.forEach((file) => {
  console.log(`   ${file}`);
});

console.log("\n📝 Files to update:");
filesToUpdate.forEach((file) => {
  console.log(`   ${file}`);
});

console.log("\n🛠️  Updating files...\n");

let successCount = 0;
let totalCount = filesToUpdate.length;

filesToUpdate.forEach((file) => {
  if (updateFile(file)) {
    successCount++;
  }
});

console.log("\n📊 Summary:");
console.log(`✅ Successfully updated: ${successCount}/${totalCount} files`);
console.log(`❌ Failed: ${totalCount - successCount} files`);

if (successCount === totalCount) {
  console.log("\n🎉 All files updated successfully!");
  console.log("Your frontend should now work without CSRF token errors.");
} else {
  console.log("\n⚠️  Some files failed to update. Please check manually.");
}

console.log("\n📋 Manual verification checklist:");
console.log("1. Check that all files now import apiService instead of axios");
console.log("2. Verify that all API calls use api.get(), api.post(), etc.");
console.log(
  "3. Ensure withCredentials and API_CONFIG are removed from api calls"
);
console.log("4. Test the application to confirm CSRF errors are resolved");
