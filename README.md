# 🚀 CodeMoney: AI-Powered Code Reviewer

CodeMoney is a cutting-edge **AI-powered code review and repository insights platform**. It helps developers maintain high code quality by providing automated reviews for Pull Requests using Google's Gemini AI, combined with a comprehensive dashboard to track coding activity and repository statistics.

---

## ✨ Features

- **🤖 AI Pull Request Reviews**: Automatically analyze changes in PRs and receive intelligent feedback, bug detections, and optimization suggestions using Gemini AI.
- **📊 Activity Dashboard**: A centralized view of your coding behavior, including total repositories, commits, PRs, and AI reviews.
- **🔗 GitHub Integration**: Seamlessly connect your GitHub account and manage your repositories.
- **📈 Contribution Visualizer**: Interactive contribution graphs similar to GitHub's but focused on combined insights.
- **🔍 Intelligent RAG (Retrieval-Augmented Generation)**: Uses Pinecone vector database to provide context-aware AI reviews by indexing your entire codebase.
- **💳 Subscription Management**: Built-in monetization and subscription tiers powered by Polar.sh.

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618.svg?style=for-the-badge&logo=radix-ui&logoColor=white)
![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-EE0000.svg?style=for-the-badge)

### Backend & Database
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Inngest](https://img.shields.io/badge/Inngest-000000?style=for-the-badge)

### AI & Infrastructure
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=for-the-badge)
![Better Auth](https://img.shields.io/badge/Better_Auth-000000?style=for-the-badge)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL Database
- Google AI Studio API Key (for Gemini)
- Pinecone Account & Index
- GitHub OAuth App

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/codemoney.git
   cd codemoney
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/codemoney"

   # Auth (Better Auth)
   BETTER_AUTH_SECRET="your_secret_here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"

   # AI (Google Gemini)
   GOOGLE_GENERATIVE_AI_API_KEY="your_api_key_here"

   # Vector DB (Pinecone)
   PINECONE_DB_API_KEY="your_pinecone_api_key"

   # Inngest
   INNGEST_EVENT_KEY="your_inngest_key"
   INNGEST_SIGNING_KEY="your_inngest_signing_key"

   # Payment (Polar.sh)
   POLAR_ACCESS_TOKEN="your_polar_token"
   POLAR_WEBHOOK_SECRET="your_polar_webhook_secret"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Project Structure

```text
├── app/              # Next.js App Router (Routes & Pages)
├── components/       # Shared UI Components (Shadcn)
├── module/           # Core Logic (AI, Review, Payment, etc.)
├── prisma/           # Database Schema
├── lib/              # Shared Utilities & Configurations
├── hooks/            # Custom React Hooks
└── public/           # Static Assets
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ by <a href="https://github.com/yourusername">Your Name/Organization</a></p>
