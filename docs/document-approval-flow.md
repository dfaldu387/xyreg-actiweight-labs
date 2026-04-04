  ┌─────────────────────────────────────────────────────────────┐                                                                                                                                                                                                                │                    DOCUMENT LIFECYCLE                         │
  ├─────────────────────────────────────────────────────────────┤                                                                                                                                                                                                                │                                                              │
  │  ① DRAFT                                                     │
  │  ├── Author creates/edits document (OnlyOffice)             │
  │  ├── Status: "Draft"                                         │
  │  ├── Document is editable                                    │
  │  └── No signatures required                                  │
  │                                                              │
  │        │  Author clicks "Send for Review"                    │
  │        ▼                                                     │
  │                                                              │
  │  ② IN REVIEW                                                 │
  │  ├── Author selects reviewers from company users             │
  │  ├── Status: "In Review"                                     │
  │  ├── Document becomes READ-ONLY                              │
  │  ├── Reviewers get notified                                  │
  │  ├── Each reviewer can:                                      │
  │  │     ├── Add comments/annotations                          │
  │  │     ├── e-Sign as "Reviewer" (approve review)             │
  │  │     └── Reject (with reason) → back to Draft              │
  │  └── All reviewers must sign before next step                │
  │                                                              │
  │        │  All reviewers signed                               │
  │        ▼                                                     │
  │                                                              │
  │  ③ PENDING APPROVAL                                          │
  │  ├── Author selects approver(s)                              │
  │  ├── Status: "Pending Approval"                              │
  │  ├── Document remains READ-ONLY                              │
  │  ├── Approver must:                                          │
  │  │     ├── Input full legal name                             │
  │  │     ├── Select meaning (Approval) or custom               │
  │  │     ├── Re-authenticate (password)                        │
  │  │     └── e-Sign as "Approver"                              │
  │  └── Can reject → back to Draft with comments                │
  │                                                              │
  │        │  Approver signed                                    │
  │        ▼                                                     │
  │                                                              │
  │  ④ APPROVED / EFFECTIVE                                      │
  │  ├── Status: "Approved"                                      │
  │  ├── Document is LOCKED (no edits allowed)                   │
  │  ├── Signature page auto-generated in PDF:                   │
  │  │     ├── Printed name of each signer                       │
  │  │     ├── Timestamp (UTC)                                   │
  │  │     ├── Meaning (Review / Approval / Authorship)          │
  │  │     └── Document hash (SHA-256)                           │
  │  ├── PAdES digital signature embedded in PDF                 │
  │  ├── Audit trail sealed                                      │
  │  └── Download gives signed PDF with all signatures           │
  │                                                              │
  │        │  Need changes?                                      │
  │        ▼                                                     │
  │                                                              │
  │  ⑤ NEW REVISION (optional)                                   │
  │  ├── Create new version (v1.0 → v1.1)                       │
  │  ├── Previous version remains locked & archived              │
  │  ├── New draft starts at step ①                              │
  │  └── Revision history linked to previous version             │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘

  Signature Page (appended to PDF on download)

  ┌─────────────────────────────────────────────────────┐
  │              ELECTRONIC SIGNATURE RECORD              │
  │         FDA 21 CFR Part 11 Compliant                 │
  ├─────────────────────────────────────────────────────┤
  │                                                      │
  │  Document: Technical File / Design Dossier / DMR     │
  │  Version:  1.0                                       │
  │  Hash:     73a2f6714c1764661dfbd76aa757c5623ec...    │
  │                                                      │
  ├──────────┬───────────────┬────────────┬─────────────┤
  │  Name    │  Timestamp    │  Meaning   │  Auth Method│
  ├──────────┼───────────────┼────────────┼─────────────┤
  │ Denish   │ 2026-03-26    │ Reviewer   │ Password    │
  │ Faldu    │ 18:19:37 UTC  │ - I have   │ Re-Auth     │
  │          │               │ reviewed   │             │
  ├──────────┼───────────────┼────────────┼─────────────┤
  │ Arnar K. │ 2026-03-27    │ Approval   │ Password    │
  │          │ 09:15:22 UTC  │ - Approved │ Re-Auth     │
  │          │               │ for release│             │
  └──────────┴───────────────┴────────────┴─────────────┘
  │                                                      │
  │  This document was electronically signed per         │
  │  FDA 21 CFR Part 11. Signatures are legally          │
  │  equivalent to handwritten signatures.               │
  │                                                      │
  │  Verify: https://app.xyreg.com/verify/<doc-hash>    │
  └─────────────────────────────────────────────────────┘

  Key Points

  - Document locks after first signature — no edits once review/approval starts
  - Reject sends back to Draft — author revises, cycle restarts
  - Each signer inputs full legal name — not auto-filled
  - Meaning is a dropdown + "Other" with custom text
  - Signed PDF generated on download — signature page appended + optional PAdES embedding
  - Verification URL — anyone can verify the document hash online


    E-Signature Requirements Summary                                                                                                                                                                                                                                             
  1. Signing Flow                                                                                                                                                                                                                                                              
  ┌──────────────────┬───────────────────────────────┬──────────────────────────────────────────────────────┐
  │       Step       │            Action             │                       Details                        │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Draft            │ Author creates/edits document │ Editable via OnlyOffice                              │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Send for Review  │ Author selects signers        │ Choose reviewers + approvers from company users list │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ In Review        │ Document becomes read-only    │ Reviewers notified, review & sign or reject          │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Pending Approval │ Approver signs                │ Notified after all reviewers sign                    │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ Approved         │ Document locked               │ Signed PDF generated, audit trail sealed             │
  ├──────────────────┼───────────────────────────────┼──────────────────────────────────────────────────────┤
  │ New Revision     │ If changes needed             │ Creates new version, previous version archived       │
  └──────────────────┴───────────────────────────────┴──────────────────────────────────────────────────────┘

  2. Signature Form (per signer)

  ┌───────────────────┬─────────────────────────┬──────────────────────────────────────────────────────────┐
  │       Field       │          Type           │                         Details                          │
  ├───────────────────┼─────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Full Legal Name   │ Text input (user-typed) │ Not auto-filled, signer must type their full legal name  │
  ├───────────────────┼─────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Meaning           │ Dropdown + custom       │ Options: Review, Approval, Authorship, Other (free text) │
  ├───────────────────┼─────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Timestamp         │ Auto-generated          │ UTC, not editable                                        │
  ├───────────────────┼─────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Re-Authentication │ Password re-entry       │ Verifies identity before signing                         │
  └───────────────────┴─────────────────────────┴──────────────────────────────────────────────────────────┘

  3. Signed PDF Output (on download)

  - Signature page appended at bottom/end of PDF with:
    - Printed name of each signer
    - Timestamp (UTC)
    - Meaning of signature
    - Authentication method
    - Document hash (SHA-256)
  - PAdES digital signature embedded — verifiable by Adobe Reader
  - Verification URL — link to verify document hash online

  4. Notifications

  ┌─────────────────────────────────┬──────────────────────────┬────────────────────────────┐
  │             Channel             │           When           │          To Whom           │
  ├─────────────────────────────────┼──────────────────────────┼────────────────────────────┤
  │ In-app notification (bell icon) │ Sent for review/approval │ Assigned signers           │
  ├─────────────────────────────────┼──────────────────────────┼────────────────────────────┤
  │ Email notification              │ Sent for review/approval │ Each signer with deep link │
  ├─────────────────────────────────┼──────────────────────────┼────────────────────────────┤
  │ Dashboard widget                │ Always visible           │ "Pending Signatures" count │
  ├─────────────────────────────────┼──────────────────────────┼────────────────────────────┤
  │ Rejection notification          │ Signer rejects           │ Author with reason         │
  ├─────────────────────────────────┼──────────────────────────┼────────────────────────────┤
  │ Completion notification         │ All signed               │ Author notified            │
  └─────────────────────────────────┴──────────────────────────┴────────────────────────────┘

  5. External User Signing

  - Add external email as signer (no account needed)
  - Email with secure link
  - Identity verified via email OTP
  - Signs with full legal name + meaning

  6. Document Locking

  - Read-only once sent for review
  - Permanently locked after approval
  - Changes require a new revision

  7. Audit Trail (FDA 21 CFR Part 11)

  - Immutable, append-only log
  - Tracks: who, when, IP, user agent, auth method
  - Actions: Created, Viewed, Authenticated, Signed, Rejected, Completed, Voided, Hash Mismatch
  - Cannot be modified or deleted

  8. User List

  - Signers from Settings > Users (active company context)

  9. Compliance (FDA 21 CFR Part 11)

  - Personal username/password, cannot be shared
  - Re-authentication before signing
  - Printed name + timestamp + meaning on every signature
  - Document hash integrity verification
  - Compliance first, UX second



# Document Approval Flow — Draft to Approval

## 1. Draft Phase

- User creates/selects a document in the **Document Studio**
- Writes content in sections (Purpose, Scope, Responsibilities, etc.)
- Sets Document Control metadata (SOP Number, Version, Effective Date, Owner)
- Assigns Prepared By / Reviewed By / Approved By roles
- Clicks **"Save Draft"** → saves to `document_studio_templates` table
- Status: **Draft**

## 2. Send for Review

- Author clicks **"Send for Review"** → `SendToReviewGroupDialog`
- System exports the draft as DOCX → uploads to storage at `{companyId}/{docId}/review-draft-{timestamp}.docx`
- Updates `phase_assigned_document_template.file_path` with the review-draft path
- Creates/updates OnlyOffice editor session key
- Assigns reviewer groups via `reviewer_group_ids`
- Status: **In Review**

## 3. Review Phase

- Document appears on the reviewer's **"Awaiting My Review"** page
- Reviewer clicks **"Review Document"** → opens the DOCX in OnlyOffice viewer
- Reviewer reads the document, can add comments
- Reviewer clicks **Close** → Review Decision dialog appears with 3 options:

### 3a. Approve & Sign

- Reviewer enters full legal name, selects signature meaning
- Re-authenticates (password/TOTP/email OTP) per FDA 21 CFR Part 11
- System creates `esign_records` entry with document hash, auth method, timestamp
- Updates `document_reviewer_decisions` → `approved`
- Status: **Approved** ✅
- **Preview PDF button appears** (only for Approved docs)

### 3b. Request Changes

- Reviewer writes comments explaining what needs to change
- System saves decision to `document_reviewer_decisions` → `changes_requested`
- Saves review note to `document_review_notes`
- **Clears `reviewer_group_ids`** so author can re-send later
- Status: **Changes Requested** ⚠️

### 3c. Reject

- Reviewer writes reason for rejection
- Status: **Rejected** ❌

## 4. Changes Requested → Re-Draft → Re-Send

- Author sees the document is in **"Changes Requested"** status
- Opens the document in **Document Studio** again
- Makes the requested changes to the draft content
- Clicks **"Save Draft"** → updates `document_studio_templates`
- Clicks **"Send for Review"** again → exports a **new** DOCX (`review-draft-{newTimestamp}.docx`)
- Updates `file_path` with the new file, creates new editor session key (busting OnlyOffice cache)
- Re-assigns reviewer groups
- Status: **In Review** (again)
- This cycle can repeat multiple times

## 5. Final Approval

- Reviewer approves & signs → Status: **Approved**
- E-signature recorded with full audit trail

## Flow Diagram

```
Draft → Send for Review → In Review
                              │
                    ┌─────────┼──────────┐
                    ▼         ▼          ▼
               Approved   Changes    Rejected
                  ✅      Requested     ❌
                              │
                         Re-Draft
                              │
                      Send for Review
                              │
                         In Review
                           (repeat)
```

## Key Tables

| Table | Role |
|-------|------|
| `document_studio_templates` | Working draft content (sections, metadata) |
| `phase_assigned_document_template` | Document registry (status, file_path, reviewer_group_ids) |
| `document_editor_sessions` | OnlyOffice editor key for cache busting |
| `esign_records` | Signature records (name, meaning, hash, auth method) |
| `document_reviewer_decisions` | Per-reviewer decision history |
| `document_review_notes` | Review comments |

## Key Files

| File | Purpose |
|------|---------|
| `src/components/documents/SendToReviewGroupDialog.tsx` | Exports draft as DOCX, uploads to storage, updates PADT |
| `src/components/review/AwaitingMyReviewPage.tsx` | Reviewer dashboard — lists assigned documents |
| `src/components/review/OnlyOfficeReviewViewer.tsx` | Opens DOCX in OnlyOffice, handles approve/reject/changes |
| `src/services/documentStudioPersistenceService.ts` | Save/load drafts from `document_studio_templates` |
| `src/services/documentPdfPreviewService.ts` | Generates Preview PDF with header + signatures (Approved only) |
| `src/components/esign/lib/esign.service.ts` | E-signature creation, hash computation, audit logging |

