# Spin - AI-Powered Web Development Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fspin&env=NEXT_PUBLIC_ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20AI%20code%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fapi-keys&project-name=spin-ai&repository-name=spin-ai)

Spin is a cutting-edge AI-powered web development platform that allows you to generate, edit, and preview web applications using natural language. Built with Next.js, Anthropic's Claude API, and Sandpack-React components, Spin provides a seamless development experience right in your browser.

## ✨ Features

- 🤖 **AI-Powered Code Generation**: Generate complete React applications from natural language descriptions
- 💻 **Interactive Code Editor**: Full-featured Monaco editor with syntax highlighting and autocompletion
- 👀 **Live Preview**: Real-time preview of your applications
- 📁 **File Management**: Intuitive file explorer for project navigation
- 🧪 **In-Browser Testing**: Run tests directly in the browser
- 🖥️ **Console Output**: View logs and debugging information
- 📤 **Export Projects**: Download your project as a ZIP file
- 🔌 **Wallet Integration**: Connect with Phantom wallet for blockchain interactions
- 🎨 **Beautiful UI**: Modern, responsive design with dark theme support

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **AI**: Anthropic Claude API
- **Code Environment**: Sandpack-React components
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Wallet**: Phantom Wallet integration
- **State Management**: React Context API
- **UI Components**: Radix UI Primitives

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- An Anthropic API key
- Phantom Wallet extension (for wallet features)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/spin.git
   cd spin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Update the environment variables in .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 🚀 Deployment

### Vercel

1. Push your code to a GitHub repository
2. Import the repository into Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fspin&env=NEXT_PUBLIC_ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20AI%20code%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com%2Fsettings%2Fapi-keys&project-name=spin-ai&repository-name=spin-ai)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Sandpack](https://sandpack.codesandbox.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
