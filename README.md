# BFHL Node Hierarchy Analyzer

**SRM Full Stack Engineering Challenge**

> User: `srijansingh_10112006` | Email: `ss8566@srmist.edu.in` | Roll: `RA2311003010626`

---

## Project Structure

```
project/
├── backend/
│   ├── index.js        # Express server entry point
│   ├── processor.js    # All processing logic (validate, deduplicate, build trees)
│   └── package.json
├── frontend/
│   ├── index.html      # SPA markup
│   ├── style.css       # Premium dark UI styles
│   └── app.js          # Frontend logic
└── README.md
```

---

## Running Locally

### 1. Backend

```bash
cd backend
npm install
npm start
# Server starts at http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Frontend

The frontend is a plain HTML/CSS/JS SPA — no build step needed.

**Option A — Open directly:**
Open `frontend/index.html` in your browser (note: API calls require backend to be running).

**Option B — Serve via a static server (recommended to avoid CORS issues):**
```bash
npx -y serve frontend
# or
npx -y http-server frontend -p 5500
```
Then open `http://localhost:5500`.

### 3. Test the API

```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]}'
```

---

## API Reference

### `GET /bfhl`
Returns `{ "operation_code": 1 }`.

### `POST /bfhl`

**Request:**
```json
{ "data": ["A->B", "A->C", "B->D", "hello", "1->2"] }
```

**Response:**
```json
{
  "user_id": "srijansingh_10112006",
  "email_id": "ss8566@srmist.edu.in",
  "college_roll_number": "RA2311003010626",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "C": {} } }, "depth": 2 }
  ],
  "invalid_entries": ["hello", "1->2"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## Deploying Backend to Render

1. Push your `backend/` directory to a GitHub repository.
2. Go to [render.com](https://render.com) and click **New → Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment:** Node
5. Set the environment variable `PORT` to `3000` (Render auto-sets this, just make sure your code uses `process.env.PORT`).
6. Click **Create Web Service** — your API will be live at `https://your-app.onrender.com/bfhl`.

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity. First request may be slow.

---

## Deploying Frontend to Vercel

1. Push your `frontend/` directory to GitHub (or the whole repo).
2. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import your GitHub repo.
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Other (no build needed)
   - **Output Directory:** `.` (dot — root of frontend/)
5. **Important:** Before deploying, update `API_URL` in `frontend/app.js` to your Render backend URL:
   ```js
   const API_URL = "https://your-app.onrender.com/bfhl";
   ```
6. Click **Deploy** — your site will be live at `https://your-app.vercel.app`.

---

## Deploying Frontend to Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**.
2. Connect your GitHub repo.
3. Configure:
   - **Base directory:** `frontend`
   - **Build command:** *(leave empty)*
   - **Publish directory:** `frontend`
4. Update `API_URL` in `app.js` to your backend URL (same as above).
5. Click **Deploy site**.

---

## Processing Logic Summary

| Step | Description |
|------|-------------|
| **Validate** | Must match `^([A-Z])->([A-Z])$` — single uppercase letter each side, no self-loops |
| **Deduplicate** | First occurrence used; subsequent identical edges pushed to `duplicate_edges` (once) |
| **Build Graph** | Parents track children; first-encountered parent wins for multi-parent nodes |
| **Group** | Union-Find groups connected components |
| **Cycle Detection** | DFS coloring — pure cycles use lex-smallest node as root |
| **Tree Format** | Nested object `{ root: { child: { grandchild: {} } } }` |
| **Depth** | Longest root-to-leaf path (count of nodes) |
| **Summary** | `total_trees` = non-cyclic groups; `largest_tree_root` by max depth (lex tiebreak) |
