import { Link } from 'react-router-dom'
import { Button } from '@nextui-org/react'

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="bg-forge-400/50 backdrop-blur-md border-t border-primary-500/20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">FORGE AI</h3>
            <p className="text-sm text-gray-300">
              Create, mint, and trade unique AI-generated NFTs on the Solana blockchain.
            </p>
            <div className="flex gap-4">
              <Button
                isIconOnly
                className="bg-forge-300/50 hover:bg-forge-300"
                size="sm"
                as="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterIcon />
              </Button>
              <Button
                isIconOnly
                className="bg-forge-300/50 hover:bg-forge-300"
                size="sm"
                as="a"
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon />
              </Button>
              <Button
                isIconOnly
                className="bg-forge-300/50 hover:bg-forge-300"
                size="sm"
                as="a"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/mint" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Mint
                </Link>
              </li>
              <li>
                <Link to="/tokenomics" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Tokenomics
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Generation */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">AI Generation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/ai/from-scratch" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  From Scratch
                </Link>
              </li>
              <li>
                <Link to="/ai/reference" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Reference Image
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-primary-500 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/NFT-Forge-sol/nft-forge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-primary-500 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-gray-300 hover:text-primary-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-500/20 text-center">
          <p className="text-sm text-gray-300">© {new Date().getFullYear()} FORGE AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
