import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement actual search API call here
      // For now, we'll just simulate a search
      await new Promise(resolve => setTimeout(resolve, 300));
      setSearchResults([
        // Example results - replace with actual API data
        { id: 1, title: 'Kinematics', type: 'chapter' },
        { id: 2, title: 'Newton\'s Laws', type: 'chapter' },
        // ... more results
      ]);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SearchContext.Provider 
      value={{ 
        searchQuery, 
        setSearchQuery,
        searchResults,
        isSearching,
        handleSearch,
        clearSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

SearchProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SearchContext; 