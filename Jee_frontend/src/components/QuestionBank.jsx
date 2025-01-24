import { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { getQuestionBankList } from '../interceptors/services';

const QuestionBank = () => {
  const navigate = useNavigate();
  const { subject } = useParams();
  const { isChatOpen, chatWidth } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [questionBankData, setQuestionBankData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    const fetchQuestionBank = async () => {
      if (!subject) return;

      try {
        const response = await getQuestionBankList(subject);
        const questionBankData = response.data.data;

        // Group questions by exam type
        const groupedQuestions = questionBankData.reduce((acc, question) => {
          if (!acc[question.exam_type]) {
            acc[question.exam_type] = [];
          }
          acc[question.exam_type].push(question);
          return acc;
        }, {});

        // Sort by year within each group
        Object.keys(groupedQuestions).forEach((examType) => {
          groupedQuestions[examType].sort((a, b) => b.year - a.year);
        });

        setQuestionBankData(groupedQuestions);
        setFilteredData(groupedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching question bank:', error);
        setLoading(false);
      }
    };

    fetchQuestionBank();
  }, [subject]);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredData(questionBankData);
      return;
    }

    const filtered = Object.entries(questionBankData).reduce(
      (acc, [examType, questions]) => {
        const filteredQuestions = questions.filter(
          (question) =>
            question.year.toLowerCase().includes(query.toLowerCase()) ||
            examType.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredQuestions.length > 0) {
          acc[examType] = filteredQuestions;
        }

        return acc;
      },
      {}
    );

    setFilteredData(filtered);
  };

  const handlePdfClick = (url) => {
    const encodedUrl = encodeURIComponent(url);
    navigate(`/dashboard/${subject}/pdf/${encodedUrl}`, {
      state: { pdfUrl: url },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Search Bar */}
      <div
        className={`fixed z-40 transition-all duration-300 ease-in-out bg-black/95 backdrop-blur-sm 
        ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'} 
        left-0 right-0 top-16 w-full md:left-64`}
        style={{
          right:
            isChatOpen && window.innerWidth >= 768 ? `${chatWidth}px` : '0',
        }}
      >
        <div className="w-full h-full px-2 sm:px-4 md:px-6 py-2">
          <div className="relative w-full flex justify-center md:justify-start">
            <div className="relative w-full max-w-xl sm:max-w-md md:max-w-xl">
              <input
                type="text"
                placeholder="Search by year..."
                className="w-full bg-gray-900/80 text-white border border-gray-800 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                onChange={(e) => handleSearch(e.target.value)}
                value={searchQuery}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 md:h-5 md:w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add spacing div to prevent content from being hidden */}
      <div className="h-[3.25rem]" />

      <h2 className="text-3xl font-bold mb-8 capitalize">
        {subject} Question Bank
      </h2>

      {!filteredData || Object.keys(filteredData).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : 'No question banks available for this subject.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(filteredData).map(([examType, questions]) => (
            <div key={examType} className="space-y-6">
              <h3 className="text-2xl font-semibold text-white flex items-center">
                {examType}
                <span className="ml-3 text-sm px-3 py-1 bg-blue-500 rounded-full">
                  {questions.length} Papers
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => handlePdfClick(question.pdf_url)}
                    className="bg-gray-900 rounded-xl p-6 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {question.year} Paper
                        </h3>
                      </div>
                      <div className="text-blue-500">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
