import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WalletContextProvider from './Tools/WalletContextProvider'
import Navbar from './Components/Items/Navbar'
import Home from './Components/Pages/Home'
import NFT from './Components/Pages/NFT'
import MintMarketplace from './Components/Pages/MintMarketplace'
import Candymachine from './Components/Pages/Candymachine'
import Collection from './Components/Pages/Collection'
import Profile from './Components/Pages/Profile'
import Footer from './Components/Items/Footer'
import ScrollToTop from './Components/Utils/ScrollToTop'
import Tokenomics from './Components/Pages/Tokenomics'
import Marketplace from './Components/Pages/Marketplace'
import CreateCollectionGuide from './Components/Pages/CreateCollectionGuide'
import FromScratch from './Components/Pages/AI/FromScratch'
import Reference from './Components/Pages/AI/Reference'

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <div className="min-h-screen w-full bg-gradient-to-br from-black to-gray-900 text-white flex flex-col">
          <ScrollToTop />
          <Navbar />
          <div className="w-full mx-auto flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nft" element={<NFT />} />
              <Route path="/mint-marketplace" element={<MintMarketplace />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/mint" element={<Candymachine />} />
              <Route path="/collection/:id" element={<Collection />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tokenomics" element={<Tokenomics />} />
              <Route path="/create-guide" element={<CreateCollectionGuide />} />
              <Route path="/ai/from-scratch" element={<FromScratch />} />
              <Route path="/ai/reference" element={<Reference />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </WalletContextProvider>
  )
}

export default App
