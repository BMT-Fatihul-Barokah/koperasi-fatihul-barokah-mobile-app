# Mobile Koperasi Syariah Application - Implementation Plan

## Project Overview

The Mobile Koperasi Syariah application is a digital solution for KSPPS BMT Fatihul Barokah Gandaria to provide members with self-service access to their financial information. This React Native mobile application aims to modernize the existing cooperative's operations while working within the constraints of their current system.

## Business Context

- The cooperative has been operating since 2019 with proper licensing
- Currently using a purchased system (Rp 16 million) that lacks mobile capabilities
- Members must physically visit the office to check balances and transaction history
- Transaction recording is semi-manual with potential for data discrepancies
- Financial records close daily at 3 PM, with later transactions processed the next day

## Key Challenges

1. **Limited Digital Access**: Members have no online method to check balances or transaction history
2. **Manual Administrative Processes**: Loan applications require paper forms and physical presence
3. **Limited Payment Options**: No digital payment integration for installments
4. **Data Synchronization**: Main system cannot be directly accessed; only daily exports at 3 PM
5. **Security Implementation**: Need to implement proper authentication while maintaining user convenience

## Application Goals

1. Provide members with convenient access to their financial information
2. Streamline loan application processes
3. Implement notification systems for payment reminders
4. Create a digital platform that works with the constraints of the existing system
5. Improve overall member experience through digital transformation
6. Facilitate new customer registration process with digital forms
7. Provide administrative tools for monitoring and managing the application

## User Flows

### Registration Process

1. **Splash Screen**: Initial loading screen with logo and illustration (3 seconds)
2. **Introduction**: Continue button leading to phone number entry
3. **Phone Verification**:
      - Enter phone number
      - Select verification method (WhatsApp/SMS)
      - Receive and enter verification code (retryable after 1 minute if not received)
4. **Account Validation**:
      - Enter full name exactly as registered with the cooperative
      - Enter account number for validation against the main system data
      - System validates against imported data (updated daily at 3 PM)
      - **New:** "Daftar Rekening BMT Fatihul Barokah" button for new customers without an account in input nomor rekening page
5. **Security Setup**:
      - Create 6-digit security PIN
      - Confirm 6-digit security PIN
6. **Registration Completion**:
      - Account creation success message
      - Redirect to dashboard

### New Customer Registration Flow

Warning this properties form not final yet so it can be change in the future base on requirement on the company (cause i still dont know yet)

1. **Registration Form Access**:
      - Via "Daftar Rekening BMT Fatihul Barokah" button during account validation
2. **Multi-page Form**:
      - Personal information (name, address, ID number, etc.)
      - Contact information
      - Employment details
      - Account type selection
      - Required documents upload
3. **Form Submission**:
      - Submit completed form to admin for processing
      - Confirmation screen with submission ID
      - Information about next steps (visit to office required for finalization)
4. **Status Tracking**:
      - Check registration status
      - Receive notifications about application progress

### Login Process

1. **Entry Screen**: Logo and illustration with login button
2. **Authentication**: Enter 6-digit security PIN
      - Limited to 5 failed attempts before temporary lockout (30 minutes)
      - "Forgot PIN" option available
3. **PIN Recovery** (if needed):
      - Phone verification via OTP
      - Identity confirmation questions
      - PIN reset process

### Main Functionality

1. **Dashboard**:

      - Account balance summary (savings, loans)
      - Recent transactions (last 5)
      - Quick action buttons
      - Notifications center

2. **Account Information**:

      - Detailed balance view
      - Transaction history with filtering options
      - Account details and membership status

3. **Loan Management**:

      - Current loan details
      - Payment schedule
      - Digital loan application (initial steps)
      - Loan history

4. **Notifications**:

      - Payment due reminders
      - Cooperative announcements
      - Account activity alerts
      - Event notifications

5. **Profile Management**:
      - Personal information
      - Security settings
      - Notification preferences
      - Help and support
      - Logout functionality

## Technical Architecture

### Tech Stack

- **Frontend**: React Native with TypeScript, Expo, and Expo Router
- **Backend/Database**: Supabase
- **UI Framework**: React Native Paper
- **Admin Panel**: Next.js with TypeScript

### Frontend

- **Framework**: React Native for cross-platform compatibility
- **UI Library**: React Native Paper
- **State Management**: Redux or Context API
- **Navigation**: Expo Router
- **Offline Support**: Local storage for essential information

### Admin Panel

(build later after the mobile app finish)

- **Framework**: Next.js with TypeScript
- **UI Library**: Material UI or Tailwind CSS
- **State Management**: Redux or Context API
- **Authentication**: Role-based access control for administrators

### Backend

- **Server**: Supabase
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Authentication with phone verification
- **Storage**: Supabase Storage for profile images and documents
- **Push Notifications**: Supabase Push Notifications

### Data Synchronization

- **Approach**: Daily import of exported data from main system (at 3 PM)
- **Process**:
     1. Main system exports data to structured format
     2. Backend import job processes data and updates database
     3. App shows data freshness timestamp ("Last updated: DD/MM/YYYY 15:00")
     4. Clear user communication about non-real-time nature of data

## Security Implementations

### Authentication Security

- **Phone Verification**: OTP sent via WhatsApp or SMS
- **PIN Protection**: 6-digit numeric PIN with salted hashing
- **Brute Force Prevention**: 5 failed attempts trigger 30-minute lockout
- **Session Management**: JWT with 24-hour expiration, refreshable

### Data Security

- **Encryption**: End-to-end encryption for sensitive data
- **Secure Storage**: Encrypted local storage for offline data
- **Transport Security**: HTTPS/TLS for all API communications
- **Data Minimization**: Only store essential information on device

### Account Recovery

- **PIN Reset Flow**:
     1. Request reset through "Forgot PIN" option
     2. Verify phone number with OTP
     3. Additional verification questions if needed
     4. Set new PIN with confirmation
     5. Invalidate old sessions for security

## Error Handling

### Network Issues

- **Offline Detection**: Monitor connectivity status
- **Offline Mode**: Access to cached data with clear indication
- **Retry Mechanism**: Automatic retry for failed API calls
- **Synchronization Queue**: Store updates locally until connectivity restored

### Validation Errors

- **Input Validation**: Client-side validation for all forms
- **Feedback System**: Clear error messages with suggestions
- **Field Highlighting**: Visual indication of problematic fields
- **Progressive Validation**: Validate fields as user completes them

### System Errors

- **Error Logging**: Capture and log errors for analysis
- **Graceful Degradation**: Fallback functionality when features fail
- **User Communication**: Clear, non-technical error messages
- **Support Contact**: Easy access to help when needed

## Data Models

### User Profile

```
{
  userId: string,
  phoneNumber: string,
  fullName: string,
  accountNumber: string,
  profileImage: string (optional),
  registrationStatus: enum ['incomplete', 'pending', 'validated', 'invalid'],
  registrationDate: timestamp,
  lastLoginDate: timestamp,
  notificationSettings: {
    paymentReminders: boolean,
    announcements: boolean,
    accountActivity: boolean
  },
  deviceToken: string (for push notifications)
}
```

### Account Information

```
{
  userId: string,
  accountNumber: string,
  savingsBalance: number,
  loanBalance: number,
  lastUpdated: timestamp,
  membershipStatus: string,
  membershipDate: timestamp
}
```

### Transaction

```
{
  transactionId: string,
  userId: string,
  transactionDate: timestamp,
  amount: number,
  type: enum ['deposit', 'withdrawal', 'loan_disbursement', 'loan_payment'],
  description: string,
  reference: string,
  balanceAfter: number,
  status: enum ['pending', 'completed', 'failed']
}
```

### Loan

```
{
  loanId: string,
  userId: string,
  principalAmount: number,
  approvedAmount: number,
  purposeDescription: string,
  applicationDate: timestamp,
  approvalDate: timestamp,
  disbursementDate: timestamp,
  term: number (months),
  installmentAmount: number,
  remainingBalance: number,
  nextPaymentDate: timestamp,
  status: enum ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']
}
```

### Notification

```
{
  notificationId: string,
  userId: string,
  title: string,
  message: string,
  type: enum ['payment_reminder', 'announcement', 'account_update'],
  createdAt: timestamp,
  readAt: timestamp,
  relatedEntityId: string,
  relatedEntityType: string,
  action: string (deep link)
}
```

### New Customer Registration

```
{
  registrationId: string,
  fullName: string,
  phoneNumber: string,
  idNumber: string,
  address: string,
  dateOfBirth: date,
  occupation: string,
  employmentDetails: object,
  accountType: string,
  documents: array[{
    type: string,
    fileUrl: string,
    uploadedAt: timestamp
  }],
  submissionDate: timestamp,
  status: enum ['submitted', 'under_review', 'approved', 'rejected', 'account_created'],
  notes: string,
  adminId: string,
  processedDate: timestamp
}
```

### Admin User

```
{
  adminId: string,
  username: string,
  fullName: string,
  email: string,
  role: enum ['super_admin', 'customer_service', 'content_manager', 'staff'],
  permissions: array[string],
  isActive: boolean,
  lastLogin: timestamp,
  createdAt: timestamp,
  createdBy: string
}
```

### Content Management

```
{
  contentId: string,
  title: string,
  type: enum ['news', 'announcement', 'report', 'faq'],
  body: string,
  attachments: array[{
    name: string,
    fileUrl: string,
    fileType: string
  }],
  publishDate: timestamp,
  expiryDate: timestamp,
  status: enum ['draft', 'published', 'archived'],
  authorId: string,
  lastModified: timestamp
}
```

## Admin Panel Features

(do later after the mobile app finish)

### User Management

- User listing with search and filter capabilities
- User details view with account history
- Account status management
- Manual verification options
- Support ticket handling

### New Registration Processing

- Registration application queue
- Application review interface
- Document verification tools
- Approval/rejection workflow
- Communication with applicants
- Status tracking

### Content Management

- News and announcement creation
- Document and report publishing
- FAQ management
- Push notification sending

### Monitoring and Support

- User activity dashboard
- Error monitoring and resolution
- User feedback management
- Support ticket system
- App usage analytics

### System Management

- Data synchronization monitoring
- User role and permission management
- System settings configuration
- Audit logging

## Development Approach

### Agile Methodology

- **Sprint Duration**: 4 weeks
- **MVP Features**: Focus on core functionality first
- **Iterative Development**: Regular releases with incremental improvements
- **User Feedback**: Early testing with cooperative staff and select members

### Development Phases

1. **Planning & Design** (4 weeks)

      - Requirement gathering
      - UI/UX design
      - Technical architecture design

2. **MVP Development** (8 weeks - 2 sprints)

      - Core authentication flows
      - Basic dashboard
      - Account information display
      - Simple notification system
      - Basic admin panel functionality

3. **Testing & Refinement** (4 weeks)

      - Internal testing
      - User acceptance testing
      - Performance optimization

4. **Deployment & Training** (4 weeks)

      - App store submission
      - User documentation
      - Staff training for support and admin panel usage

5. **Phase 2 Development** (8 weeks)
      - New customer registration flow
      - Extended admin panel features
      - Content management system
      - Advanced reporting

## Implementation Considerations

### Data Freshness

- Clearly communicate to users that data is updated daily at 3 PM
- Show last update timestamp on all financial information
- Implement manual refresh option for users to check for updates

### Progressive Account Completion

- Save user progress at each registration step
- Allow resuming registration from the last completed step
- Label accounts with appropriate status flags for tracking

### Offline Functionality

- Cache essential account information for offline viewing
- Queue actions performed offline for sync when connectivity returns
- Clear indicators of offline mode and data freshness

### Security Best Practices

- No sensitive data stored in client-side storage
- Regular security audits of codebase
- Certificate pinning for API communication
- Implement app timeout after period of inactivity

### Admin Panel Integration

- Role-based access control for different admin functions
- Secure admin authentication with MFA
- Audit logging for all admin actions
- Responsive design for desktop and tablet use

## Performance Metrics

- User adoption rate (target: 50% of members in first 3 months)
- App stability (target: < 1% crash rate)
- User satisfaction (target: 4.5/5 rating)
- Support ticket reduction (target: 30% reduction in balance inquiries)
- New customer registration completion rate (target: 80% form completion)

## Support and Maintenance

- Dedicated support email and in-app feedback
- Regular updates (monthly security patches, quarterly feature updates)
- Monitoring system for app performance and errors
- Documentation for troubleshooting common issues
- Admin training programs for new staff
