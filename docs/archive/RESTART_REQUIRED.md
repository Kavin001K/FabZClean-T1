# ⚠️ CRITICAL ACTION REQUIRED: RESTART SERVER

## The Problem
You are seeing **404 Errors** and **WebSocket Errors** because your server has been running for **7 hours** without restarting.
I have made changes to the code, but the running server **does not know about them yet**.

## The Fix
I have updated your configuration so the server will auto-restart in the future. But for now, you must do this manually **ONE LAST TIME**.

### 🛑 Step 1: Stop the Server
1.  Go to your terminal where `npm run dev` is running.
2.  Press **Ctrl + C** to stop it.

### 🟢 Step 2: Start the Server
1.  Run the command:
    ```bash
    npm run dev
    ```
2.  Wait for it to say "Server running on port 5001".

### 🧪 Step 3: Test
1.  Refresh your browser.
2.  **Print Bill**: Should work now.
3.  **WhatsApp**: Should work or show a clear error log in the terminal.

## Why this happened?
The `dev` script was missing the `watch` flag, so it wasn't reloading when I fixed the code. I have added it now, so you won't face this issue again.
