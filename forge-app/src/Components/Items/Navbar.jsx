import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from '@nextui-org/react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function AppNavbar() {
  return (
    <Navbar isBordered className="bg-black/30 backdrop-blur-md">
      <NavbarBrand>
        <p className="font-bold text-inherit">FORGE AI</p>
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
          <WalletMultiButton />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
