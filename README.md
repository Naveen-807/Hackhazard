# AuctioneerAI

## Overview
AuctioneerAI is a real-time IPL auction platform with AI-powered auto-bidding, wallet-based authentication, and synchronized auction state for all users.

## Features
- Real-time auction state sync (Socket.IO backend)
- AI moderator agent controls auction flow
- AI and human bidding (manual/auto)
- Wallet-based authentication (MetaMask)
- User/team/budget management
- User-friendly error handling and feedback
- Secure backend (no private keys in frontend)

## Setup

### Prerequisites
- Node.js (18+ recommended)
- npm or yarn
- MetaMask browser extension

### Environment Variables
Create a `.env` file in the root with:
```
NEXT_PUBLIC_AUCTION_BACKEND_URL=http://localhost:4000
GROQ_API_KEY=your-groq-api-key
```

### Install Dependencies
```
npm install
```

### Start Backend (Socket.IO server)
```
npm run start:server
# or
node src/server/index.ts
```

### Start Frontend (Next.js)
```
npm run dev
```

## Usage
- Connect your wallet (MetaMask) to join the auction.
- Place manual bids or enable auto-bidding.
- All auction state is synchronized in real time.
- AI moderator manages auction flow and transitions.

## Architecture
- **Frontend:** Next.js + React + TypeScript
- **Backend:** Express + Socket.IO (TypeScript, in-memory state for MVP)
- **AI Logic:** Centralized in `src/lib/ai-bidding-agent.ts`
- **User Management:** Wallet-based, tracked in backend

## Testing
- Unit tests: Add tests in `src/__tests__/` for core logic (AI, auction, bidding)
- Integration tests: Simulate auction flow and user actions

## Security
- No private keys or sensitive data in frontend
- All user input validated on backend
- Rate limiting and DDoS protection recommended for production

## Configuration
- All environment variables documented above
- Update backend URL and API keys as needed

## Contributing
Pull requests welcome! Please add tests and update documentation for any changes.

---

For more details, see `docs/blueprint.md`.
