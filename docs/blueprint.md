# **App Name**: AuctioneerAI

## Core Features:

- Real-time Player Card: Display a single player's information, including image, name, role, stats, base price, current bid, current bidder, and bid timer, all updating in real-time via Firebase.
- Moderator Control Panel: Provide a moderator panel with controls to start, pause, resume, end the auction, push the next player, and override/freeze the auction.
- AI Auto-Bidding: Implement an auto-bidding system where AI agents use Groq AI via a Flask backend to evaluate players, determine bid amounts, and automatically bid based on team needs, role balance and a bidding strategy. The system will use Firebase to store user and agent data, and track budgets. The bidding strategy will use a tool to determine when to bid, and when to stop.
- Bidding Mode Toggle: Allow users to switch between manual and automatic bidding modes. Firebase will manage the state of this toggle for each user/agent.
- AI Player Recommendations: Show Groq AI-powered player recommendations to human users via the UI, along with a brief reason for the recommendation.

## Style Guidelines:

- Primary color: Dark blue (#0E1C36) to convey trust and professionalism.
- Secondary color: Light gray (#F0F4F8) for clean and neutral backgrounds.
- Accent: Teal (#26A69A) for interactive elements and highlights.
- Clean and modern sans-serif typography to ensure readability and a professional look.
- Use crisp and clear icons to represent player roles, stats, and auction controls.
- A card-based layout for displaying player information, ensuring clarity and focus.
- Subtle animations for bid updates and timer transitions to provide a smooth user experience.

## Original User Request:
I am building an IPL Auction Platform with two bidding modes (manual for users, automatic for AI agents). I will use Firebase for real-time data, Groq AI for smart bidding and player evaluation, and Flask for backend logic. The auction has a moderator who controls the flow.

💡 Features I Want Firebase to Support:
🔴 1. Real-time Auction UI
Show one player at a time in a card format with:

Player image

Name

Role (Opener, Bowler, etc.)

Stats (batting average, economy, etc.)

Base price

Display current bid and current bidder in real-time.

Show countdown timer for bid expiry.

👨‍⚖️ 2. Moderator Control
Add a moderator panel (separate authenticated user) who:

Starts/pauses/resumes/ends the auction.

Pushes the next player for bidding.

Overrides or freezes the auction if needed.

Structure:

plaintext
Copy
Edit
/auctionStatus
  - currentPlayerId
  - currentBid
  - currentBidderId
  - bidTimer
  - isPaused
  - moderatorId
🧠 3. Automatic vs Manual Bidding
Human users bid manually through the UI.

AI agents automatically bid based on:

Team needs

Role balance

Player evaluation score

Allow toggle between "auto" and "manual" mode for each participant.

Structure:

plaintext
Copy
Edit
/users
  - userId
    - name
    - wallet
    - mode: "auto" | "manual"
    - currentTeam
    - budget

/aiAgents
  - agentId
    - strategyType: "smart" | "aggressive" | "balanced"
    - teamLogic
    - budget
🤖 4. AI-Based Logic (via Groq AI + Flask)
Groq AI will provide:

🧠 Player Evaluation – Based on latest stats and match performance.

📊 Smart Recommendations – Suggest players to human users.

🎯 Bidding Strategy – Decide if an AI agent should bid, how much to bid, and when to stop.

🔄 Auto-Bid Engine – Flask server fetches data from Firebase, uses Groq AI to evaluate, then pushes bids back.

Example Firestore usage:

plaintext
Copy
Edit
/groqSuggestions
  - userId
    - recommendedPlayerIds
    - reason

/aiBids
  - agentId
    - bidDecision
    - timestamp
🎯 Flow Summary:
Moderator starts auction → player card is shown in UI (real-time from Firebase).

Human users place bids manually through UI.

AI agents use Groq AI via Flask to evaluate & auto-bid.

Firebase handles all real-time syncing of auction state, bids, and team compositions.

After timeout, the player is sold, and next player is pushed by moderator.
  