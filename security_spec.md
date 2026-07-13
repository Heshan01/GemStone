# RatnaGem Firebase Security Specification

This document details the security constraints, data invariants, and defensive tests designed to secure RatnaGem's Firestore collections against malicious reads, writes, and privilege escalation attacks.

## 1. Data Invariants

1. **User Role Lock**: Users can register accounts, but are strictly forbidden from setting or changing their `role` to `'admin'`.
2. **Account Blocking**: Users who are marked as `isBlocked == true` must have all write privileges revoked across the database.
3. **Ad Creation Verification**: All new gemstone ads must be posted with `status = 'Pending Approval'` (unless posted by an admin) and `sellerId` matching the caller's auth UID.
4. **Ad Ownership Integrity**: Only the original poster (`sellerId`) can modify or delete their ad. Non-owners are blocked from modifying ads (except admins, who can moderate).
5. **Locked Terminal States**: Once an ad status reaches `'Sold'`, `'Expired'`, or `'Rejected'`, standard users cannot edit it or change it back to `'Active'`. Only admins can modify terminal-state ads.
6. **Chat Participation Privacy**: A chat room's `participants` array must contain exactly the `buyerId` and `sellerId` of the conversation, and standard reads/writes for both the room and sub-collection messages are strictly restricted to the listed participants.
7. **Report Confidentiality**: Reporting is anonymous to other users. Only the creator (`reporterId`) can create reports, and only administrators (`role == 'admin'`) can list, read, or resolve reports.
8. **Temporal Audit Consistency**: All document creations must set `createdAt` equal to `request.time`. Updates must set `updatedAt` to `request.time` where appropriate.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent unauthorized operations designed to breach the system. The security rules are configured to reject every single one of these attempts with `PERMISSION_DENIED`.

### P1: Admin Role Hijacking (Privilege Escalation)
Attempting to create a user profile with `role: "admin"` to hijack dashboard privileges.
* **Payload (write to `/users/attacker_uid`):**
```json
{
  "uid": "attacker_uid",
  "name": "Attacker",
  "email": "attacker@gmail.com",
  "photoURL": "",
  "phone": "",
  "location": "Ratnapura",
  "bio": "",
  "isVerifiedSeller": false,
  "isBlocked": false,
  "role": "admin",
  "createdAt": "request.time"
}
```
* **Expected Result:** `PERMISSION_DENIED` (User creation rule forces `role == "user"`).

### P2: Self-Verification (Sellers verifying themselves)
Sellers attempting to set their own profile `isVerifiedSeller: true`.
* **Payload (update to `/users/seller_uid`):**
```json
{
  "isVerifiedSeller": true
}
```
* **Expected Result:** `PERMISSION_DENIED` (Sellers cannot modify `isVerifiedSeller`).

### P3: Block Bypass Update
A user who is blocked trying to update their own profile location or bio.
* **Payload (update to `/users/blocked_uid` by blocked user):**
```json
{
  "location": "Colombo"
}
```
* **Expected Result:** `PERMISSION_DENIED` (Rules check user document to ensure `isBlocked != true`).

### P4: Direct Ad Auto-Approval
A seller bypasses the moderation queue by posting a new listing directly in `'Active'` status.
* **Payload (create to `/ads/ad_123`):**
```json
{
  "id": "ad_123",
  "title": "Unheated Blue Sapphire",
  "category": "Blue Sapphire",
  "sellerId": "attacker_uid",
  "images": [],
  "weight": 2.5,
  "color": "Royal Blue",
  "shape": "Oval",
  "treatment": "Unheated",
  "price": 500000,
  "isNegotiable": true,
  "contactPreference": "chat",
  "location": "Ratnapura",
  "status": "Active",
  "isFeatured": false,
  "createdAt": "request.time",
  "updatedAt": "request.time"
}
```
* **Expected Result:** `PERMISSION_DENIED` (Sellers must set `status = "Pending Approval"` upon creation).

### P5: Identity Theft (Seller Spoofing)
A seller trying to post an ad under another registered user's UID.
* **Payload (create to `/ads/ad_123`):**
```json
{
  "sellerId": "victim_uid"
}
```
* **Expected Result:** `PERMISSION_DENIED` (`sellerId` must strictly equal `request.auth.uid`).

### P6: Price Modification on Sold Ad (Terminal State Lock)
A seller attempting to change the price on an ad that they have already marked as `'Sold'`.
* **Payload (update to `/ads/ad_123` where existing status is `'Sold'`):**
```json
{
  "price": 999999
}
```
* **Expected Result:** `PERMISSION_DENIED` (Standard users cannot update terminal-state ads).

### P7: Unregistered Ghost Ad
A seller attempting to post an ad referencing a project category that does not exist in the categories list.
* **Expected Result:** `PERMISSION_DENIED` (Rules verify category exists using `exists(/databases/$(database)/documents/categories/$(incoming().category))`).

### P8: Intruder Chat Infiltration
An attacker attempting to read a private chat between Buyer A and Seller B.
* **Expected Result:** `PERMISSION_DENIED` (Read block verifies `request.auth.uid in resource.data.participants`).

### P9: Forge Message in Someone Else's Room
An attacker attempting to send a message into a Chat room they are not a participant of.
* **Expected Result:** `PERMISSION_DENIED` (Parent Chat fetch verifies caller is a participant).

### P10: Fraudulent Reporting (Reporter Spoofing)
An attacker submitting a report with `reporterId` set to a victim user's UID.
* **Payload (create to `/reports/report_123`):**
```json
{
  "id": "report_123",
  "adId": "ad_123",
  "reporterId": "victim_uid",
  "reason": "Fraud",
  "details": "Fake gemstone seller",
  "status": "pending",
  "createdAt": "request.time"
}
```
* **Expected Result:** `PERMISSION_DENIED` (`reporterId` must match `request.auth.uid`).

### P11: Scraping All User Reports (PII Leak)
A standard user attempting to fetch all submitted reports.
* **Expected Result:** `PERMISSION_DENIED` (Listing and reading reports is strictly restricted to `isAdmin()`).

### P12: Injecting ID Poisoning Attacks
An attacker attempting to create an ad with an extremely long, garbage string as the ID to waste Firestore resource storage.
* **Payload (create to `/ads/super_long_garbage_character_string_extending_beyond_bounds...`):**
* **Expected Result:** `PERMISSION_DENIED` (`isValidId` helper rejects IDs exceeding 128 chars or containing invalid characters).

---

## 3. Recommended Test Suite Architecture

A complete `firestore.rules.test.ts` would use `@firebase/rules-unit-testing` to programmatically assert these security boundaries.

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, doc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gen-lang-client-0487732599',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

test('P1: Attacker cannot register as an Admin', async () => {
  const aliceContext = testEnv.authenticatedContext('alice_uid');
  const aliceDb = aliceContext.firestore();
  
  await expect(
    setDoc(doc(aliceDb, 'users/alice_uid'), {
      uid: 'alice_uid',
      name: 'Alice',
      email: 'alice@gmail.com',
      isVerifiedSeller: false,
      isBlocked: false,
      role: 'admin',
      createdAt: new Date()
    })
  ).rejects.toThrow();
});
```
