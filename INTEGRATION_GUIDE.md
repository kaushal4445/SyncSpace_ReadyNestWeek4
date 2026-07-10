# TeamSync Integration Guide

This guide explains how the pieces of TeamSync connect to each other and to third-party services, so you can configure, extend, or debug any module quickly.

---

## 1. How the Frontend Talks to the Backend

Every API call goes through the shared Axios instance:

```js
// client/src/services/api.js
const api = axios.create({ baseURL: "/api", withCredentials: true });
```

- `baseURL: "/api"` works in dev because `vite.config.js` proxies `/api` to `http://localhost:5000`. In production, set `VITE_API_URL` and point your host's rewrite rules (or a reverse proxy) at the backend, or change `baseURL` to the full backend URL.
- `withCredentials: true` is required for the JWT httpOnly cookie to be sent/received — do not remove it, and make sure the backend's CORS config (`CLIENT_URL` in `server/.env`) matches your frontend origin exactly (including protocol and port).

Every resource has its own thin service module (`documentService.js`, `fileService.js`, etc.) that wraps `api.get/post/put/delete`. **When adding a new backend endpoint, add one function to the matching service file — don't call `api` directly from a page component.**

---

## 2. How Real-Time Features Connect

```
client/src/services/socket.js  →  socket.io-client  →  server/src/sockets/socketHandler.js
```

- The socket connects only after login (`AuthContext.fetchProfile/login` calls `socket.connect()` then `socket.emit("user_online", userId)`), and disconnects on `logout`.
- On `user_online`, the server joins the socket to a personal room `user_<userId>`. This is how targeted notifications work — anything emitted server-side with `io.to(\`user\_${userId}\`).emit(...)` reaches only that user's open tabs.
- Workspace-scoped real-time features (chat) join `workspace_<workspaceId>` when `Chat.jsx` mounts with a workspace active, via `socket.emit("join_workspace", id)`.
- Use the `useSocketEvent(eventName, handler, deps)` hook in any component that needs to listen — it subscribes on mount and unsubscribes on unmount automatically, preventing duplicate listeners across re-renders.

**To add a new real-time event:** add the emitter/listener pair in `socketHandler.js` (server) and call `socket.emit(...)` / `useSocketEvent(...)` (client) — do not create a second Socket.IO client instance.

### 2.1 Socket handler stability rules (read this before adding a new event)

A recurring bug class in this codebase was a bad/incomplete socket payload throwing an unhandled promise rejection inside an `async` handler, which crashed the entire Node process — every unrelated HTTP request (including plain REST calls like `GET /api/messages/private/:userId`) then failed with `ECONNREFUSED` until the process was manually restarted. Fixed in `socketHandler.js` and `server.js`, but the rules matter for anything you add:

1. **Every handler body is wrapped in `try/catch`.** Never `await` inside a socket handler without one.
2. **Validate ids before querying.** Use `mongoose.Types.ObjectId.isValid(id)` on anything that becomes a Mongo query — a `null`/`undefined`/malformed id must short-circuit with `return`, not reach the database.
3. **Never let a handler throw past its own scope.** Log with `console.error` and optionally `socket.emit("message_error", ...)` so the client can show a toast — don't rethrow.
4. **`server.js` also has `process.on("unhandledRejection"/"uncaughtException")` as a last line of defense** — but treat that as a safety net, not a substitute for #1–3.
5. **Client-side, `services/socket.js` sets explicit reconnection options** (`reconnection: true`, capped exponential backoff) so a restarted backend is retried gracefully instead of the tab needing a manual refresh.

### 2.2 Chat pagination

`chatController.js` uses cursor-based pagination (`?before=<ISO date>`) for `GET /messages/workspace/:id` and `GET /messages/private/:id`, not `page`/`limit` skip-based paging. This matters: skip-based paging breaks under infinite scroll because a new message arriving between two page loads shifts every subsequent skip offset by one, silently dropping or duplicating whichever message sits on the page boundary. If you add a new paginated real-time list, prefer a cursor anchored to a stable field (`createdAt`, `_id`) over `page`/`limit` for the same reason.

---

## 3. Workspace Context — the Backbone of Every Module

Documents, Files, Chat, Calendar, and Analytics are all scoped to a workspace. `WorkspaceContext` fetches `GET /api/workspaces` once the user is authenticated and exposes:

```js
const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
```

- `Sidebar.jsx` renders a proper workspace switcher (dropdown with switch/settings/create/join), not a bare `<select>`. `WorkspaceContext` also persists the last-selected workspace id in `localStorage` so a refresh doesn't silently drop back to `workspaces[0]`.
- Every workspace-scoped page (`Documents`, `Files`, `Chat`, `Calendar`, `Analytics`) reads `currentWorkspace` and re-fetches its data whenever it changes (see the `useEffect` dependency arrays in each page).
- If `currentWorkspace` is `null` (new user with no workspace yet), `Dashboard.jsx` shows a real onboarding screen (Create Workspace / Join Workspace buttons, backed by `components/workspace/CreateWorkspaceModal.jsx` and `JoinWorkspaceModal.jsx`) instead of a dead-end empty state. Other workspace-scoped pages still render a simple `EmptyState` telling the user to pick a workspace from the sidebar switcher.

**If you build a new workspace-scoped module, always guard on `currentWorkspace` before fetching**, exactly as the existing pages do.

---

## 4. File Uploads — Multer → Cloudinary Pipeline

```
<input type="file"> → FormData → axios multipart POST
   → Multer (memory storage, uploadMiddleware.js) → req.file / req.files (Buffer)
   → streamifier converts Buffer to a readable stream
   → cloudinary.uploader.upload_stream(...) → secure_url
   → saved to MongoDB (File model) or User.avatar
```

Three places use this pipeline:

1. **File Manager** (`fileController.uploadFiles`) — multiple files, saved as `File` documents, folder `TeamSync/<workspaceId>`.
2. **Avatar upload** (`authController.updateAvatar`) — single file, folder `TeamSync/avatars`, saved directly to `User.avatar`.
3. Any future feature needing uploads should reuse `upload.single("field")` or `upload.array("field", n)` from `middleware/uploadMiddleware.js` and the same `streamifier` pattern — don't write files to local disk.

**Required setup:** a free Cloudinary account, with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `server/.env`. Without valid credentials, every upload call will fail at `cloudinary.uploader.upload_stream`.

---

## 5. Adding a New Protected, Workspace-Scoped Endpoint (Recipe)

1. **Model** (if new data): add to `server/src/models/`.
2. **Controller**: create `server/src/controllers/yourController.js`, following the pattern of returning `{ success, ...data }` and calling `next(error)` on failure (the global `errorHandler` formats it).
3. **Routes**: create `server/src/routes/yourRoutes.js`:
   ```js
   router.use(protect);
   router.use("/workspace/:workspaceId", requireWorkspaceMember); // add requireWorkspaceAdmin too if needed
   router.get("/workspace/:workspaceId", yourController.list);
   ```
4. **Mount** in `server/src/app.js`: `app.use("/api/your-resource", yourRoutes);`
5. **Service**: add `client/src/services/yourService.js` wrapping the new endpoints.
6. **Page/Component**: consume the service, guard on `currentWorkspace`, use `Skeleton`/`EmptyState` from `components/ui/` for loading/empty states — matching every existing module.
7. **Route**: register the page in `client/src/App.jsx` inside the `DashboardLayout` route group, and add a link in `Sidebar.jsx`.

---

## 6. Pagination, Filtering, Sorting, Search — Use `ApiFeatures`

Every list endpoint (Documents, Files, and any future one) should use the shared helper instead of writing manual `.skip()/.limit()` logic:

```js
const ApiFeatures = require("../utils/apiFeatures");

const base = Document.find({ workspace: req.params.workspaceId });
const features = new ApiFeatures(base, req.query)
  .search(["title", "content"]) // ?search=
  .filter(["tags"]) // ?tags=...
  .sort("-updatedAt") // ?sort=field1,-field2
  .paginate(20); // ?page=&limit=

const results = await features.query;
```

This keeps query-string conventions (`page`, `limit`, `sort`, `search`) consistent across the whole API, which the frontend services already assume (`{ params }` passed straight through on `GET` calls).

---

## 7. Authorization Layers

| Layer                          | Middleware                                                    | Applies to                                                                                       |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Logged in at all               | `protect` (`authMiddleware.js`)                               | Every route except register/login/forgot-password                                                |
| Global role (`admin`/`member`) | `authorizeRoles(...roles)`                                    | Available for app-wide admin-only routes (not currently wired to any route, but ready to use)    |
| Member of this workspace       | `requireWorkspaceMember` (`workspaceAuth.js`)                 | Documents, Files, Chat, Calendar, Meetings, Analytics — anything under `/workspace/:workspaceId` |
| Admin/owner of this workspace  | `requireWorkspaceAdmin` (used after `requireWorkspaceMember`) | Workspace update/delete/invite/remove                                                            |

When adding a new sensitive action (e.g. "delete all files in a workspace"), chain `requireWorkspaceMember` then `requireWorkspaceAdmin` exactly like `workspaceRoutes.js` does.

---

## 8. Preferences / Settings Integration

`User.preferences` (added to the existing `User` model, non-breaking) backs the Settings page:

```
Settings.jsx  →  PUT /api/auth/preferences  →  authController.updatePreferences
             →  merges into User.preferences  →  response  →  AuthContext.updateUser()
```

Dark mode specifically toggles the `dark` class on `<html>` (`document.documentElement.classList.toggle("dark", ...)`), which activates Tailwind's `darkMode: "class"` config already set in `tailwind.config.js` — every component using `dark:` utility classes (most of them already do) responds automatically. No further wiring needed if you add `dark:` variants to new components.

---

## 9. PDF Export Integration

`GET /api/documents/:id/export-pdf` streams a PDF directly in the HTTP response using `pdfkit` (no temp files):

```js
const pdf = new PDFDocument({ margin: 50 });
pdf.pipe(res);
pdf.fontSize(20).text(document.title, ...);
pdf.end();
```

The frontend simply links to this URL (`documentService.exportPdfUrl(id)`) in a new tab — the browser handles the download via the `Content-Disposition: attachment` header. If you need richer PDF layout (tables, images, page breaks), extend the same controller; avoid switching libraries without checking Node compatibility in the deployment environment (Render supports pdfkit natively; headless-Chrome-based tools like Puppeteer need extra build steps).

---

## 10. Analytics Integration Notes

All analytics aggregations run as MongoDB aggregation pipelines scoped to `workspace: workspaceId` (see `analyticsController.js`). If you add a new metric:

1. Add an aggregation function to `analyticsController.js`.
2. Add a route under `/api/analytics/workspace/:workspaceId/your-metric` in `analyticsRoutes.js` (already behind `requireWorkspaceMember`).
3. Add a service function to `analyticsService.js`.
4. Render it with the existing `AnalyticsBarChart` / `AnalyticsLineChart` / `AnalyticsPieChart` wrappers in `Analytics.jsx` — they already expect `{ data, xKey/dataKey, yKey/nameKey }` shaped arrays, so shape your aggregation's output to match rather than building a one-off chart component.

---

## 11. Known Integration Gaps (things to wire up next)

- **Email service**: `forgotPassword` generates a reset token but does not send an email — plug in Nodemailer/SendGrid/Postmark inside `authController.forgotPassword` where the `TODO` comment is.
- **@Mentions**: workspace chat and document comments don't yet support `@name` autocomplete/notifications — `GET /api/search?types=users` already returns exactly what a mention picker needs, it just isn't wired into `Chat.jsx`'s input yet.
- **Week/Day calendar views**: `CalendarHeader` already renders the view switcher buttons, but `Calendar.jsx` only renders `CalendarGrid` (month). Extend `CalendarGrid` (or add sibling `CalendarWeekView`/`CalendarDayView` components) and switch on the `view` state.
- **Document sharing schema migration**: `Document.sharedWith` changed from a flat array of user ids to `[{ user, role }]` subdocuments to support viewer/editor permissions. If you have pre-existing documents seeded under the old shape, either drop the `documents` collection in a dev DB or write a one-off migration script (`db.documents.updateMany({}, [{ $set: { sharedWith: { $map: { input: "$sharedWith", as: "u", in: { user: "$$u", role: "viewer" } } } } }])`-style) before deploying.
- **Reactions/typing are workspace-and-private only** — group chat (`chatType: "group"`) has the model/socket plumbing but no dedicated UI yet.

### Already wired up (previously listed here as gaps — now done)

- ~~User picker for document sharing~~ — `ShareModal.jsx` now uses `UserSearchPicker.jsx` (search-as-you-type against `GET /api/search?types=users`) and shares by `userId` + `role`, not raw email text.
- ~~Onboarding flow~~ — `Dashboard.jsx` now shows Create/Join Workspace CTAs when `currentWorkspace` is `null`.

---

## 12. Verifying Everything Still Works

Quick smoke test after pulling this update:

```bash
# Backend
cd server && npm install && npm run dev
curl http://localhost:5000/api/health   # → {"status":"ok"}

# Frontend
cd client && npm install && npm run dev
# Open http://localhost:5173, register, create a workspace,
# then visit /documents, /files, /chat, /calendar, /analytics, /profile, /settings in turn.
```

If any page shows a permanent loading skeleton, check the browser console for a 401 (cookie/CORS mismatch) or 403 (workspace membership) error first — those are the two most common integration issues when environment variables are misconfigured.
