# TeamSync – Real-Time Collaborative Workspace Platform

TeamSync is a full-stack collaboration platform for teams that need shared workspaces, documents, chat, scheduling, notifications, analytics, and file management in one place. The project now includes real-time collaborative document editing, live collaborator presence, live cursor tracking, safer concurrent edit handling, and reliable autosave/sync behavior.

---

## 1. Project Overview

TeamSync lets teams create workspaces, invite members, co-author documents, chat in real time, manage files, schedule meetings, review notifications, and explore analytics from a responsive dashboard. The latest update focuses on true multi-user document collaboration without breaking the existing workspace and document workflows.

---

## 2. Core Features

### Authentication & Access

- Register, login, logout, JWT-based sessions, protected routes, and role-aware permissions.
- Session expiry handling and automatic socket disconnects.

### Workspaces

- Create and join workspaces, invite and manage members, switch workspaces, and enforce workspace membership checks.

### Documents

- Create, edit, delete, tag, share, export, restore previous versions, and now collaborate in real time.
- Role-based sharing for owner, editor, and viewer users.

### Real-Time Collaboration

- Multiple users can edit the same document at the same time.
- Document content is synchronized live across connected clients.
- Safe merge handling reduces accidental overwrite conflicts.
- Live presence shows who is viewing or editing a document.
- Live cursors show collaborator positions and names.
- Autosave and reconnect handling keep document state synchronized.

### Chat & Notifications

- Real-time workspace and private chat, typing indicators, reactions, mentions, notifications, and document sharing inside chat.

### Files, Calendar, Analytics, and Profile

- File upload, document export, calendar/meeting management, analytics dashboards, and profile/settings management.

---

## 3. Newly Added Real-Time Collaboration Features

### Collaborative Editing

- Shared document rooms are joined through Socket.IO.
- Content updates are broadcast to active collaborators.
- Server-side merge logic preserves concurrent changes instead of overwriting them.

### Presence Awareness

- Users who open a document are added to a live collaboration room.
- Presence updates are emitted when collaborators join, leave, or disconnect.

### Live Cursor Tracking

- Remote collaborators appear with unique visual indicators and their names.
- Cursor positions update in real time while they edit.

### Autosave & Reconnect Handling

- Document changes are autosaved after a short delay.
- Save status states include Saving, Saved, and Reconnecting.
- Reconnected clients can resync unsaved changes automatically.

---

## 4. Tech Stack

### Frontend

- React + Vite
- React Router DOM
- Tailwind CSS
- Socket.IO Client
- React Hot Toast
- React Icons
- Recharts
- Framer Motion

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT + Cookie Parser
- Cloudinary + Multer
- PDFKit

---

## 5. Folder Structure

```text
TeamSync/
├── client/
│   └── src/
│       ├── components/
│       │   └── documents/
│       │       ├── RichTextEditor.jsx
│       │       └── ShareModal.jsx
│       ├── pages/
│       │   └── DocumentEditor.jsx
│       ├── services/
│       │   └── socket.js
│       └── context/
│           └── AuthContext.jsx
├── server/
│   └── src/
│       ├── controllers/
│       │   └── documentController.js
│       ├── sockets/
│       │   └── socketHandler.js
│       ├── utils/
│       │   └── documentCollaboration.js
│       └── models/
│           └── Document.js
```

---

## 6. Database Changes

The existing document model was extended to support collaborative flows through Socket.IO and merge-safe updates. No breaking schema changes were introduced for existing document records.

Relevant document fields remain:

- title
- content
- workspace
- createdBy
- lastEditedBy
- sharedWith
- versionHistory
- tags

---

## 7. Socket.IO Events

### Client → Server

- join_document
- leave_document
- document_change
- document_cursor
- document_save
- user_online
- join_workspace
- leave_workspace
- send_message

### Server → Client

- document_presence_snapshot
- document_presence_update
- document_cursor_update
- document_content_update
- document_saved
- online_users
- receive_message
- receive_notification
- socket_error

---

## 8. API Changes

The document update flow now accepts a base content payload for safer real-time merge behavior while preserving the existing REST API structure.

### Document updates

- PUT /api/documents/:id
  - Supports existing title/content/tags updates.
  - Uses merge-safe logic when concurrent edits are detected.

---

## 9. Installation

```bash
git clone <repo-url>
cd TeamSync

# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

Set up your environment variables for MongoDB, JWT, and Cloudinary before running the app.

---

## 10. Testing Checklist

- [x] Real-time document editing across multiple connected clients
- [x] Presence updates for viewers/editors
- [x] Live cursor tracking for collaborators
- [x] Merge-safe handling for concurrent edits
- [x] Autosave and reconnect synchronization
- [x] Existing workspace, chat, sharing, and notification flows remain intact

---

## 11. Changelog

### v2.3.0

- Added real-time collaborative document editing through Socket.IO.
- Added collaborator presence for open documents.
- Added live cursor tracking with collaborator labels.
- Added merge-safe document update handling for concurrent edits.
- Added autosave, save status indicators, and reconnect resync behavior.
- Updated documentation to reflect the new collaboration workflow.

### v2.2.0

- Improved chat reliability, sharing workflow, notifications, and performance.

---

## 12. Known Limitations

- The collaboration layer is optimized for real-time editing and presence within the existing document editor experience.
- A production-scale presence store may be needed for very large concurrent deployments.
- Full operational features such as Redis-backed scaling or push notifications are still optional follow-ups.

---

## 13. License

MIT
