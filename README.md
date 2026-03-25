# Live Streaming Dashboard

This project is a high-performance, interactive live streaming dashboard and overlay interface. It features real-time animations, a modular panel system (Leaderboard, Spotlight, Unlock Path, Rules), and a responsive design built with modern web technologies.

## Current State

The application is currently a frontend prototype. The user interface and animations are fully functional, but data such as viewer counts, live tips, and chat messages are simulated for demonstration purposes.

## Deployment Options (via Google AI Studio)

If you are viewing this project within Google AI Studio, you have several immediate deployment options:

1. Deploy to Google Cloud Run (Recommended for Production)
   - Use the "Deploy" button in the top right corner of the interface.
   - This packages the application and hosts it permanently on Google Cloud, providing a live, scalable production URL.

2. Share a Preview Link
   - Use the "Share" button to generate a public link for immediate sharing and feedback.

3. Export the Code
   - Access the Settings menu (gear icon) to export the repository directly to GitHub or download it as a ZIP file for self-hosting on platforms like Vercel, Netlify, or your own infrastructure.

## Path to a Full Production Release

To transition this application from a frontend prototype to a fully functional production system, the following backend integrations are required:

### 1. Database and Authentication
- Recommended: Firebase or Supabase.
- Purpose: To handle real-time user authentication, persist user profiles, store chat history, and manage the state of the rules and unlock paths.

### 2. Payment Processing
- Recommended: Stripe.
- Purpose: To allow users to securely purchase and send "tkns" (tips) to the broadcaster.

### 3. Real-time Communication
- Recommended: WebSockets (via Socket.io) or Firebase Realtime Database.
- Purpose: To broadcast live events (tips, new viewers, chat messages) to all connected clients instantly with minimal latency.

## Local Development

To run this project locally outside of AI Studio, ensure you have Node.js installed.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Technology Stack

- Framework: React 18
- Language: TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Material Symbols
