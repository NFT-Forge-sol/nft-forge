import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WalletContextProvider from './Tools/WalletContextProvider'
import Navbar from './Components/Items/Navbar'
import Home from './Components/Pages/Home'
import NFT from './Components/Pages/NFT'
import Marketplace from './Components/Pages/Marketplace'
import Candymachine from './Components/Pages/Candymachine'
import Collection from './Components/Pages/Collection'
import Profile from './Components/Pages/Profile'
import Footer from './Components/Items/Footer'

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <div className="min-h-screen w-full bg-gradient-to-br from-black to-gray-900 text-white flex flex-col">
          <Navbar />
          <div className="w-full mx-auto flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nft" element={<NFT />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/mint" element={<Candymachine />} />
              <Route path="/collection/:id" element={<Collection />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </WalletContextProvider>
  )
}

export default App
