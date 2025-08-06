# Spin

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fspin&env=NEXT_PUBLIC_ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20AI%20code%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fapi-keys&project-name=spin-ai&repository-name=spin-ai)

A modern AI-powered code editor and playground built with Next.js, featuring real-time preview, file management, and AI-assisted coding capabilities.

## ✨ Features

- 🚀 **AI-Powered Code Generation**: Generate React components and applications using natural language
- 💻 **Interactive Code Editor**: Built with Sandpack for a seamless coding experience
- 👁️ **Real-time Preview**: See changes instantly as you code
- 📂 **File Management**: Intuitive file explorer for project organization
- 🛠️ **Modern Tech Stack**: Next.js 14, TypeScript, and Tailwind CSS
- 🔌 **Wallet Integration**: Connect with Phantom wallet for Web3 capabilities
- 🎨 **Dark Theme**: Beautiful dark UI for comfortable coding sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Anthropic API key (for AI features)
- Phantom Wallet (for Web3 features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/spin.git
   cd spin
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Update the `.env.local` file with your API keys.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Code Editor**: Sandpack
- **State Management**: React Context
- **Wallet**: Phantom Wallet Integration
- **UI Components**: Radix UI Primitives

## 📝 Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fspin&env=NEXT_PUBLIC_ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20AI%20code%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fapi-keys&project-name=spin-ai&repository-name=spin-ai)

### Other Platforms

You can also deploy to other platforms that support Next.js:
- Netlify
- AWS Amplify
- Heroku
- Docker

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Code editing powered by [Sandpack](https://sandpack.codesandbox.io/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)