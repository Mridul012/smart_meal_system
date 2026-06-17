# Smart Meal System

QR-based mess authentication that prevents meal token sharing and identity fraud — not just another CRUD app.

---

College mess systems are painfully manual. Students share meal tokens, staff can't verify who's actually in front of them, and there's no way to stop someone from eating twice. This project replaces the paper token system with time-limited QR codes tied to student identity. Each QR expires in 60 seconds, so screenshots don't work. Staff get a preview of the student's details before confirming, and every meal is recorded to block duplicates.

---

## Features

- QR codes expire in 60 seconds — screenshotting and reusing doesn't work
- Two-step scan flow: staff preview student info first, then confirm the meal
- Duplicate meal prevention — same meal type can't be served twice in one day
- Role-based access: student, staff, admin, guest
- Guest accounts have a configurable lifetime meal cap
- Admin panel to create users, manage roles, and post daily menus
- JWT authentication with bcrypt password hashing

---

## Tech Stack

**Backend** — Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, bcryptjs

**Frontend** — React 18, Vite, React Router v6, Axios, react-qr-code, @yudiel/react-qr-scanner

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas URI or a local MongoDB instance

### Install

```bash
git clone https://github.com/yourusername/smart-meal-system.git
cd smart-meal-system
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Environment Variables

Create `backend/.env`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5001
```

### Seed Demo Users

```bash
cd backend
node seed.js
```

### Run

```bash
# from project root — starts both servers concurrently
npm run dev

# or separately
npm run server   # backend on :5001
npm run client   # frontend on :5173
```

---

## Demo Credentials

| Role        | Email               | Password   |
|-------------|---------------------|------------|
| Super Admin | admin@mess.com      | admin123   |
| Staff       | staff@mess.com      | staff123   |
| Student     | student@mess.com    | student123 |

---

## API Endpoints

| Method | Endpoint               | Auth         | Description                        |
|--------|------------------------|--------------|------------------------------------|
| POST   | /api/auth/login        | None         | Login and receive JWT              |
| POST   | /api/auth/register     | Admin        | Create a new user                  |
| GET    | /api/auth/users        | Admin        | List all users                     |
| DELETE | /api/auth/users/:id    | Admin        | Delete a user                      |
| GET    | /api/qr/generate       | Student      | Generate a 60s QR token            |
| POST   | /api/qr/scan-info      | Staff/Admin  | Verify token and preview student   |
| POST   | /api/qr/validate       | Staff/Admin  | Confirm meal and record transaction|
| GET    | /api/menu              | Any          | Get today's menu                   |
| POST   | /api/menu              | Admin        | Add a menu entry                   |

---

## How the QR Flow Works

1. Student logs in and selects a meal type (breakfast, lunch, or dinner)
2. Student clicks "Generate QR" — backend signs a JWT with `userId` and `mealType`, set to expire in 60 seconds
3. Frontend renders the token as a QR code using react-qr-code, with a live countdown
4. Staff scans the QR using the camera scanner on their device
5. Scanner sends the token to `/api/qr/scan-info` — backend verifies it and returns the student's name, roll number, and meal type without writing anything to the database yet
6. Staff sees the preview card and clicks "Confirm Serve"
7. Backend runs three checks: token still valid, meal not already served today, guest limit not exceeded — if all pass, a Transaction is created and the meal is marked as served

If a student tries to scan again for the same meal, the duplicate check blocks it. If the 60 seconds ran out between scan and confirm, the token fails verification.

---

## Project Structure

```
smart-meal-system/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   └── qrController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Menu.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   └── qr.js
│   ├── seed.js
│   ├── server.js
│   └── .env
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       │   └── SegmentedControl.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AdminPanel.jsx
│       │   ├── Login.jsx
│       │   ├── StaffScanner.jsx
│       │   └── StudentDashboard.jsx
│       ├── styles/
│       │   └── global.css
│       ├── App.jsx
│       └── main.jsx
└── package.json
```

---


