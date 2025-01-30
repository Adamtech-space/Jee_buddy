const Features = () => {
  const features = [
    {
      icon: "robot",
      title: "AI Doubt Solver",
      description: "24/7 instant doubt resolution with step-by-step solutions and detailed explanations"
    },
    {
      icon: "book",
      title: "NCERT Solutions",
      description: "Complete NCERT solutions with topic-wise questions and solutions"
    },
    {
      icon: "journal-check",
      title: "Previous Year Papers",
      description: "Practice with past JEE papers with detailed solutions and analysis"
    },
    {
      icon: "speedometer2",
      title: "Performance Tracking",
      description: "Track your progress and identify areas for improvement"
    },
    {
      icon: "pencil-square",
      title: "Mock Tests",
      description: "Regular mock tests following JEE exam pattern"
    },
    {
      icon: "chat-dots",
      title: "Interactive Learning",
      description: "Ask questions and get instant help from our AI tutor"
    }
  ];

  return (
    <section id="features" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Complete JEE Preparation Solution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900 p-6 rounded-lg transform hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-500 bg-opacity-20 rounded-lg">
                  <i className={`bi bi-${feature.icon} text-3xl text-blue-500`}></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;