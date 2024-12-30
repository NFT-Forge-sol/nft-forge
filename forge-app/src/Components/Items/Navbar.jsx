import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from '@nextui-org/react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function AppNavbar() {
  return (
    <Navbar className="bg-forge-400/50 backdrop-blur-md border-b border-primary-500/20" maxWidth="full">
      <NavbarBrand>
        <div className="flex items-center gap-2">
          <p className="font-bold text-inherit">FORGE AI</p>
        </div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link href="/" className="text-white">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/nft" className="text-white">
            NFT
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/mint" className="text-white">
            Mint
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/marketplace" className="text-white">
            Marketplace
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <WalletMultiButton className="!bg-forge-400 hover:!bg-forge-300 !text-white border border-primary-500/50 hover:border-primary-500 !rounded-lg !py-2" />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
