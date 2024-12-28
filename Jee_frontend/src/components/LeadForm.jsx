const LeadForm = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-center mb-6">Get Started Today</h3>
              <a 
                href="https://forms.gle/ZMe6HyPFNu8LCYtaA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 text-white text-center py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Your Journey
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;
