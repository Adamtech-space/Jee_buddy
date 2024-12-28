const StudyResources = () => {
  const resources = [
    {
      icon: "book-half",
      title: "NCERT Books & Solutions",
      features: [
        "Complete NCERT solutions with detailed explanations",
        "Chapter-wise important concepts and formulas",
        "Visual explanations of complex topics"
      ]
    },
    {
      icon: "file-text",
      title: "Previous Year Papers",
      features: [
        "Last 15 years' JEE papers with solutions",
        "Topic-wise question classification",
        "Difficulty-level analysis for better preparation"
      ]
    },
    {
      icon: "clipboard-data",
      title: "Mock Tests",
      features: [
        "Weekly mock tests following JEE pattern",
        "Personalized performance analysis",
        "Question paper discussion sessions"
      ]
    },
    {
      icon: "robot",
      title: "AI Learning Assistant",
      features: [
        "24/7 doubt resolution support",
        "Concept clarification with examples",
        "Personalized learning recommendations"
      ]
    }
  ];

  return (
    <section id="resources" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Comprehensive Study Resources
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {resources.map((resource, index) => (
            <div key={index} className="card">
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4 flex items-center">
                  <i className={`bi bi-${resource.icon} mr-3 text-blue-500`}></i>
                  {resource.title}
                </h3>
                <ul className="space-y-3">
                  {resource.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center">
                      <i className="bi bi-check-circle-fill text-green-500 mr-3"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudyResources;
