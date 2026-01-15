# Hospital Management System - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Module Overview](#module-overview)
5. [Detailed Module Instructions](#detailed-module-instructions)
6. [Common Tasks](#common-tasks)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Appendix](#appendix)

---

## Introduction

The Hospital Management System is a comprehensive web-based application designed to manage all aspects of hospital operations including doctors, patients, cases, appointments, billing, and payments. The system provides role-based access control, ensuring that users only have access to the modules and functions they are authorized to use.

### Key Features

- **Doctor Management**: Maintain doctor profiles, specializations, and contact information
- **Patient Management**: Store and manage patient records
- **Case Management**: Track patient cases (OPD/IPD) with detailed information
- **Appointment Scheduling**: Schedule and manage doctor appointments
- **Billing & Payments**: Generate bills, process payments, and manage financial records
- **Charge Master**: Manage hospital service charges
- **Payouts**: Track and manage doctor payouts
- **Reports**: View summary reports and analytics
- **User Management**: Admin can create users and assign permissions
- **Activity Logs**: Track all user activities for audit purposes

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Valid user account

### Logging In

1. Open the Hospital Management System in your web browser
2. You will see the login page
3. Enter your **Username** and **Password**
4. Click the **Login** button

**Default Admin Credentials:**
- Username: `sunilsahu`
- Password: `admin123` (Please change this after first login)

### Navigation

After logging in, you will see:

- **Sidebar Menu**: Left side contains all available modules based on your permissions
- **Main Content Area**: Right side displays the selected module's content
- **User Info**: Bottom of sidebar shows your name and role
- **Logout Button**: Located at the bottom of the sidebar

### Logging Out

Click the **Logout** button at the bottom of the sidebar to securely log out of the system.

---

## User Roles and Permissions

### Admin User

The admin user (`sunilsahu`) has:
- Full access to all modules
- Ability to create, edit, and delete users
- Permission to assign module access rights to users
- Access to Activity Logs for monitoring user activities
- Cannot be deleted from the system

### Regular Users

Regular users have:
- Access only to modules they have been granted permissions for
- Permissions can be:
  - **View**: Can see and read data
  - **Edit**: Can create and modify data
  - **Delete**: Can remove data

**Note**: Users must have "View" permission to access a module. "Edit" and "Delete" permissions are additional rights.

---

## Module Overview

### 1. Doctors
Manage doctor profiles, specializations, qualifications, and contact information.

### 2. Doctor Charges
Set and manage consultation and service charges for doctors.

### 3. Patients
Maintain patient records including personal details and medical history.

### 4. Cases
Track patient cases (OPD/IPD) with admission/discharge dates, diagnosis, and charges.

### 5. Appointments
Schedule and manage doctor appointments with patients.

### 6. Billing & Payments
Handle billing, process payments, apply discounts, and generate bills.

### 7. Charge Master
Manage hospital charges for various services (Lab, X-Ray, Surgery, etc.).

### 8. Payouts
Track and manage doctor payouts with payment status.

### 9. Reports
View summary reports and analytics.

### 10. User Management (Admin Only)
Create users and assign module permissions.

### 11. Activity Logs (Admin Only)
View audit trail of all user activities.

---

## Detailed Module Instructions

### Doctors Module

#### Viewing Doctors
1. Click **Doctors** from the sidebar menu
2. The list of active doctors will be displayed
3. Use the search box to find doctors by name, specialization, phone, or email
4. Navigate through pages using Previous/Next buttons

#### Adding a Doctor
1. Click **Add Doctor** button
2. Fill in the required information:
   - **Name** (required)
   - **Specialization**
   - **Qualification**
   - **Phone**
   - **Email**
   - **Address**
3. Click **Save**

#### Editing a Doctor
1. Find the doctor in the list
2. Click **Edit** button
3. Modify the information
4. Click **Save**

#### Deactivating a Doctor
1. Find the doctor in the list
2. Click **Delete** button
3. Confirm the action
4. The doctor will be deactivated (not permanently deleted)

---

### Doctor Charges Module

#### Viewing Doctor Charges
1. Click **Doctor Charges** from the sidebar
2. View all doctor-charge associations
3. See which doctors are associated with which charges

#### Adding a Doctor Charge
1. Click **Add Doctor Charge** button
2. Select:
   - **Doctor** (required)
   - **Charge Master** (required)
   - **Amount** (required)
   - **Payment Mode** (optional)
3. Click **Save**

#### Editing/Deleting Doctor Charges
- Use **Edit** button to modify
- Use **Delete** button to remove

---

### Patients Module

#### Viewing Patients
1. Click **Patients** from the sidebar
2. Browse the patient list with pagination
3. Use search to find patients by name, phone, email, or address

#### Adding a Patient
1. Click **Add Patient** button
2. Fill in patient details:
   - **Name** (required)
   - **Phone** (required)
   - **Email**
   - **Date of Birth**
   - **Gender**
   - **Address**
   - **Emergency Contact**
3. Click **Save**

#### Editing a Patient
1. Find the patient in the list
2. Click **Edit** button
3. Update information
4. Click **Save**

#### Deleting a Patient
1. Find the patient in the list
2. Click **Delete** button
3. Confirm deletion

---

### Cases Module

#### Viewing Cases
1. Click **Cases** from the sidebar
2. View all cases with:
   - Case number
   - Patient name
   - Case type (OPD/IPD)
   - Status (Open/Closed)
   - Admission date
   - Appointments count
   - Charges count and total

#### Adding a Case
1. Click **Add Case** button
2. Fill in case details:
   - **Patient** (required - use search to find)
   - **Case Type** (OPD or IPD)
   - **Admission Date**
   - **Time of Admission**
   - **Discharge Date** (optional)
   - **Time of Discharge** (optional)
   - **Diagnosis**
   - **Referred By** (optional - can search for patient or doctor)
3. Click **Save**

#### Viewing Case Details
1. Click **View** button next to a case
2. See complete case information including:
   - Patient charges
   - Prescriptions
   - Appointments
   - Case information

#### Adding Patient Charges to a Case
1. Open case details by clicking **View**
2. In the "Patient Charges" section, click **Add Patient Charge**
3. Select:
   - **Charge Master** (required)
   - **Doctor** (required for OPD Charge, IPD Doctor Visit, or Surgery)
   - **Quantity** (default: 1)
   - **Unit Amount** (auto-filled from charge master)
   - **Total Amount** (auto-calculated)
4. Click **Save**

**Note**: Unit Amount is automatically populated from the Charge Master and cannot be edited. Total Amount is calculated as Quantity × Unit Amount.

#### Uploading Prescriptions
1. Open case details
2. In the "Prescriptions" section, click **Upload Prescription**
3. Select one or more image/PDF files
4. Click **Upload**
5. View prescriptions by clicking **VIEW** button (opens in lightbox with zoom/download options)

#### Adding Appointments
1. Open case details
2. In the "Appointments" section, click **Add Appointment**
3. Fill in:
   - **Patient** (required - searchable)
   - **Case** (optional - searchable)
   - **Doctor** (optional)
   - **Date** (required)
   - **Time** (required)
   - **Status** (optional)
4. Click **Save**

#### Editing a Case
1. Find the case in the list
2. Click **Edit** button
3. Modify information
4. Click **Save**

**Note**: Closed cases cannot be edited.

---

### Appointments Module

#### Viewing Appointments
1. Click **Appointments** from the sidebar
2. View all appointments with pagination
3. See appointment details including patient, doctor, date, time, and status

#### Adding an Appointment
1. Click **Add Appointment** button
2. Fill in:
   - **Patient** (required - use search)
   - **Case** (optional - searchable)
   - **Doctor** (optional)
   - **Date** (required)
   - **Time** (required)
   - **Status** (optional)
3. Click **Save**

#### Editing/Deleting Appointments
- Use **Edit** button to modify
- Use **Delete** button to remove

---

### Billing & Payments Module

**Important**: This module is read-only for charges. You can only view charges, not add or modify them. Charges must be added through the Cases module.

#### Accessing Billing
1. Click **Billing & Payments** from the sidebar
2. Search for a patient by name or phone
3. Select a patient from search results
4. View all cases for that patient
5. Click **View Bill** for a specific case

#### Viewing Bill Details
The bill view shows:
- **Patient Information**: Name, phone, email, case type, admission date/time, discharge date/time
- **Charges**: Read-only list of all charges (cannot be added or edited here)
- **Payments**: List of all payments made
- **Discount**: Apply discount to the case
- **Bill Summary**: Total charges, discount, total after discount, total paid, balance

#### Adding a Payment
1. In the bill view, click **Add Payment** button
2. Select payment type:
   - **Full Payment**: Automatically sets amount to current balance (read-only)
   - **Partial Payment**: Allows you to enter the amount
3. Fill in:
   - **Payment Amount** (required)
   - **Payment Date** (required)
   - **Payment Mode** (required: Cash, Card, UPI, Bank Transfer, or Cheque)
   - **Reference Number** (optional)
   - **Notes** (optional)
4. Click **Save Payment**

#### Editing/Deleting Payments
- Use **Edit** button to modify payment details
- Use **Delete** button to remove a payment

#### Applying Discount
1. In the bill view, find the "Discount" section
2. Enter discount amount
3. The discount is automatically saved
4. Bill summary updates to show total after discount

#### Generating a Bill
1. Click **Generate Bill** button
2. The bill will be displayed in a lightbox
3. Review the bill with:
   - Patient information
   - All charges
   - Payment history
   - Bill summary with discount
   - Watermark showing payment status:
     - **BILL PAID** (green) - Fully paid
     - **PARTIAL BILL PAID** (orange) - Partially paid
     - **BILL NOT PAID** (red) - Not paid
4. Click **Print** to print the bill
5. Click **Close Case** to close the case (only available if balance is ₹0.00)

**Note**: 
- Cases can only be closed when fully paid (balance = ₹0.00)
- The bill is formatted for A4 letterhead printing
- Hospital logo area is reserved at the top (80mm)

---

### Charge Master Module

#### Viewing Charges
1. Click **Charge Master** from the sidebar
2. View all hospital charges with pagination
3. See charge name, category, and amount

#### Adding a Charge
1. Click **Add Charge** button
2. Fill in:
   - **Name** (required)
   - **Category** (optional)
   - **Amount** (required)
3. Click **Save**

#### Editing/Deleting Charges
- Use **Edit** button to modify
- Use **Delete** button to remove

**Note**: Charge amounts are used as base unit amounts when adding charges to cases.

---

### Payouts Module

#### Viewing Payouts
1. Click **Payouts** from the sidebar
2. View all payouts with pagination (10 per page)
3. Filter by:
   - **Date Range**: Select start and end dates
   - **Payment Status**: All, Pending, Paid, or Partially Paid
4. Click **Apply Filters** to update the list

#### Color Coding
- **Green**: Fully paid
- **Yellow**: Pending payment
- **Blue**: Partially paid

#### Adding a Payout
1. Click **Add Payout** button
2. Fill in payout details
3. Click **Save**

#### Marking Payment as Done
1. Find the payout in the list
2. Click **Mark as Paid** or **Update Payment**
3. Fill in:
   - **Payment Status**: Paid or Partially Paid
   - **Payment Date**
   - **Payment Mode**
   - **Reference Number**
   - **Comments**
4. Click **Save**

#### Viewing Case Details
- Click **VIEW CASE** to see case details in the Cases module

#### Generating Report
1. Click **Generate Report** button
2. An Excel file will be downloaded with all payout data

---

### Reports Module

#### Viewing Reports
1. Click **Reports** from the sidebar
2. View summary statistics:
   - Total Doctors
   - Total Patients
   - Total Cases
   - Total Appointments
   - Total Prescriptions

#### Generating Reports
- Click **Download Report** to generate and download a detailed Excel report

---

### User Management Module (Admin Only)

#### Viewing Users
1. Click **User Management** from the sidebar (admin only)
2. View all users in the system
3. See username, full name, email, role, and status

#### Adding a User
1. Click **Add User** button
2. Fill in:
   - **Username** (required, must be unique)
   - **Full Name**
   - **Email**
   - **Password** (required)
   - **Status**: Active or Inactive
   - **Module Permissions**: For each module, check:
     - **View**: User can see the module
     - **Edit**: User can create/modify data
     - **Delete**: User can delete data
3. Click **Save**

#### Editing a User
1. Find the user in the list
2. Click **Edit** button
3. Modify:
   - Full name, email, status
   - Password (leave blank to keep current)
   - Module permissions
4. Click **Save**

#### Deleting a User
1. Find the user in the list
2. Click **Delete** button
3. Confirm deletion

**Note**: Admin user (`sunilsahu`) cannot be deleted.

---

### Activity Logs Module (Admin Only)

#### Viewing Activity Logs
1. Click **Activity Logs** from the sidebar (admin only)
2. View all user activities with:
   - Timestamp
   - Username
   - Action (color-coded badges)
   - Module
   - Details
   - IP Address

#### Filtering Logs
Use the filter section to filter by:
- **Username**: Enter username to filter
- **Module**: Select specific module
- **Action**: Select specific action (view, create, update, delete, login, logout)
- Click **Apply Filters** to update results

#### Action Color Codes
- **Blue**: View
- **Green**: Create
- **Orange**: Update
- **Red**: Delete
- **Purple**: Login
- **Gray**: Logout

---

## Common Tasks

### Creating a Complete Patient Case Flow

1. **Add Patient** (if not exists)
   - Go to Patients module
   - Add new patient with all details

2. **Create Case**
   - Go to Cases module
   - Add new case for the patient
   - Fill in admission date, time, diagnosis, etc.

3. **Add Charges**
   - View case details
   - Add patient charges as services are provided
   - Select appropriate charge from Charge Master
   - Add doctor if required (for OPD/IPD/Surgery charges)

4. **Upload Prescriptions**
   - View case details
   - Upload prescription images/PDFs

5. **Schedule Appointments**
   - View case details
   - Add appointments as needed

6. **Process Billing**
   - Go to Billing & Payments module
   - Search and select patient
   - View bill for the case
   - Add payments as received
   - Apply discount if applicable
   - Generate bill when ready
   - Close case when fully paid

### Searching for Information

Most modules support search functionality:
- **Doctors**: Search by name, specialization, phone, email
- **Patients**: Search by name, phone, email, address
- **Cases**: Search by case number, patient name, phone, email
- **Appointments**: Search by patient name, doctor name, date

### Printing Bills

1. Go to Billing & Payments module
2. Select patient and case
3. Click **Generate Bill**
4. Review the bill in the lightbox
5. Click **Print** button
6. The bill is formatted for A4 letterhead printing

---

## Tips and Best Practices

### Data Entry

1. **Always verify patient information** before creating a case
2. **Use search functionality** to avoid creating duplicate patients
3. **Add charges immediately** after services are provided
4. **Upload prescriptions promptly** for better record keeping
5. **Apply discounts before generating final bill**

### Case Management

1. **Close cases only when fully paid** to prevent further modifications
2. **Use referred_by field** to track how patients were referred
3. **Add admission/discharge times** for accurate record keeping
4. **Keep diagnosis information updated**

### Billing Best Practices

1. **Review all charges** before generating bill
2. **Apply discounts before closing case**
3. **Record payments immediately** when received
4. **Use reference numbers** for traceability
5. **Generate bill only when ready** to close the case

### Security

1. **Change default admin password** immediately after first login
2. **Assign minimal required permissions** to users
3. **Regularly review activity logs** to monitor system usage
4. **Deactivate users** instead of deleting when they leave
5. **Use strong passwords** for all user accounts

---

## Troubleshooting

### Login Issues

**Problem**: Cannot log in
- **Solution**: Verify username and password are correct
- Check if account is active (contact admin)
- Clear browser cache and try again

**Problem**: Forgot password
- **Solution**: Contact system administrator to reset password

### Module Access Issues

**Problem**: Cannot see a module in the menu
- **Solution**: You don't have View permission for that module. Contact admin to grant access.

**Problem**: Cannot edit/delete data
- **Solution**: You don't have Edit/Delete permissions. Contact admin to grant access.

### Data Issues

**Problem**: Charges not showing in bill
- **Solution**: Ensure charges are added through Cases module, not Billing module

**Problem**: Cannot close case
- **Solution**: Case can only be closed when balance is ₹0.00. Ensure all payments are recorded.

**Problem**: Cannot add charges to case
- **Solution**: Check if case is closed. Closed cases cannot be modified.

### Technical Issues

**Problem**: Page not loading
- **Solution**: 
  - Check internet connection
  - Refresh the page
  - Clear browser cache
  - Try different browser

**Problem**: Search not working
- **Solution**: 
  - Ensure you type at least 2 characters
  - Wait for search results to load
  - Check if you have permission for that module

---

## Appendix

### Module Permission Reference

| Module | View | Edit | Delete | Description |
|--------|------|------|--------|-------------|
| Doctors | ✓ | ✓ | ✓ | Manage doctor profiles |
| Doctor Charges | ✓ | ✓ | ✓ | Set doctor charges |
| Patients | ✓ | ✓ | ✓ | Manage patient records |
| Cases | ✓ | ✓ | - | Manage patient cases |
| Appointments | ✓ | ✓ | ✓ | Schedule appointments |
| Billing & Payments | ✓ | ✓* | ✓* | Process billing (*for payments only) |
| Charge Master | ✓ | ✓ | ✓ | Manage service charges |
| Payouts | ✓ | ✓ | ✓ | Manage doctor payouts |
| Reports | ✓ | - | - | View reports |

**Note**: Billing & Payments module allows Edit/Delete only for payments, not charges.

### Keyboard Shortcuts

- **Escape Key**: Close modals/lightboxes
- **Enter Key**: Submit forms (when focused on input fields)

### Browser Compatibility

- **Chrome**: Recommended (latest version)
- **Firefox**: Supported (latest version)
- **Safari**: Supported (latest version)
- **Edge**: Supported (latest version)

### Support

For technical support or questions:
- Contact your system administrator
- Review activity logs for troubleshooting
- Check this user guide for common solutions

---

## Version Information

- **Application Version**: 1.0
- **Last Updated**: 2024
- **Documentation Version**: 1.0

---

**End of User Guide**
