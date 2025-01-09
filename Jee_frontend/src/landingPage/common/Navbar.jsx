import { useState, useEffect } from 'react'
import Button from './Button'
import Logo from './Logo'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300
      ${isScrolled 
        ? 'bg-black/80 backdrop-blur-md border-b border-gray-800' 
        : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center">
            <Logo className="h-8 w-auto text-blue-400" />
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex space-x-6">
              {['Home', 'Features', 'Resources', 'Demo'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.toLowerCase()).scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-sm font-medium transition-all duration-300
                    ${isScrolled 
                      ? 'text-gray-300 hover:text-blue-400' 
                      : 'text-gray-200 hover:text-blue-400'}
                    relative after:absolute after:bottom-0 after:left-0 after:h-[2px] 
                    after:w-0 hover:after:w-full after:bg-blue-400 
                    after:transition-all after:duration-300`}
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                className={`border-gray-700 hover:border-blue-500 text-gray-300 
                  hover:text-blue-400 transition-all duration-300
                  ${isScrolled ? 'bg-black/50' : 'bg-black/30'}`}
                onClick={() => window.location.href = '/login'}
              >
                Login
              </Button>
              <Button 
                variant="primary"
                className={`bg-gradient-to-r from-blue-600 to-purple-600 
                  hover:from-blue-700 hover:to-purple-700 text-white
                  transition-all duration-300 transform hover:scale-105
                  ${isScrolled ? 'shadow-md' : 'shadow-lg shadow-blue-500/25'}`}
                onClick={() => window.location.href = '/register'}
              >
                Get Free Trial
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden focus:outline-none
              ${isScrolled ? 'text-gray-300' : 'text-gray-200'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          ${isScrolled ? 'bg-black/95' : 'bg-black/90'}`}>
          <div className="py-6 space-y-4">
            {['Home', 'Features', 'Resources', 'Demo'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.toLowerCase()).scrollIntoView({ behavior: 'smooth' });
                  closeMenu();
                }}
                className={`block px-4 py-2 text-base font-medium transition-colors
                  ${isScrolled 
                    ? 'text-gray-300 hover:text-blue-400' 
                    : 'text-gray-200 hover:text-blue-400'}`}
              >
                {item}
              </a>
            ))}
            <div className="px-4 pt-4 space-y-3">
              <Button 
                variant="outline" 
                className="w-full border-gray-700 hover:border-blue-500 
                          text-gray-300 hover:text-blue-400 bg-black/50"
                onClick={() => {
                  closeMenu();
                  window.location.href = '/login';
                }}
              >
                Login
              </Button>
              <Button 
                variant="primary" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 
                          hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => {
                  closeMenu();
                  window.location.href = '/register';
                }}
              >
                Get Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
