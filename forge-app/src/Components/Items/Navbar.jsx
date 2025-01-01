import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@nextui-org/react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Image as ImageIcon, User, Wand2 } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'

export default function AppNavbar() {
  const { publicKey } = useWallet()
  const navigate = useNavigate()
  const icons = {
    chevron: <ChevronDown size={20} />,
    wand: <Wand2 className="text-primary-500" size={24} />,
    image: <ImageIcon className="text-primary-500" size={24} />,
  }

  const handleProfile = () => {
    if (!publicKey) {
      document.querySelector('.wallet-adapter-button-trigger')?.click()
    } else {
      navigate('/profile')
    }
  }

  return (
    <Navbar className="bg-forge-400/50 backdrop-blur-md border-b border-primary-500/20" maxWidth="full">
      <NavbarBrand>
        <div className="flex items-center gap-2">
          <p className="font-bold text-inherit">FORGE AI</p>
        </div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link to="/" className="text-white hover:text-primary-500 transition-colors">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/tokenomics" className="text-white hover:text-primary-500 transition-colors">
            Tokenomics
          </Link>
        </NavbarItem>
        <Dropdown className="bg-forge-400/95 active:border-none active:outline-none">
          <NavbarItem>
            <DropdownTrigger>
              <Button
                disableRipple
                className="p-0 bg-transparent data-[hover=true]:bg-transparent text-white hover:text-primary-500 font-[500]"
                endContent={icons.chevron}
                style={{ fontSize: 16, border: 'none', outline: 'none' }}
                radius="sm"
                variant="light"
              >
                AI Generation
              </Button>
            </DropdownTrigger>
          </NavbarItem>
          <DropdownMenu
            aria-label="AI Generation Options"
            className="w-[340px] bg-forge-400/95 backdrop-blur-md hover:border-none "
            itemClasses={{
              base: 'gap-4',
            }}
          >
            <DropdownItem
              key="from-scratch"
              description="Create unique AI-generated NFTs from text"
              startContent={icons.wand}
              as={Link}
              to="/ai/from-scratch"
              className="text-white data-[hover=true]:text-primary-500 data-[hover=true]:bg-forge-300/50"
            >
              From Scratch
            </DropdownItem>
            <DropdownItem
              key="reference-image"
              description="Generate variations of existing images using AI"
              startContent={icons.image}
              as={Link}
              to="/ai/reference"
              className="text-white data-[hover=true]:text-primary-500 data-[hover=true]:bg-forge-300/50"
            >
              Reference Image
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <NavbarItem>
          <Link to="/mint" className="text-white hover:text-primary-500 transition-colors">
            Mint
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link to="/marketplace" className="text-white hover:text-primary-500 transition-colors">
            Marketplace
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        <NavbarItem>
          <WalletMultiButton className="!bg-forge-400 hover:!bg-forge-300 !text-white border border-primary-500/50 hover:border-primary-500 !rounded-lg !py-2" />
        </NavbarItem>
        <NavbarItem>
          <Button
            isIconOnly
            className="bg-forge-400 hover:bg-forge-300 text-white border border-primary-500/50 hover:border-primary-500 rounded-lg"
            aria-label="Profile"
            onPress={handleProfile}
            style={{ outline: 'none' }}
          >
            <User size={20} />
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}
