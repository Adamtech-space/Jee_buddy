const SuccessStories = () => {
  const stories = [
    {
      quote: "The AI feedback helped me understand my mistakes instantly. My JEE preparation improved significantly!",
      author: "Rahul S."
    },
    {
      quote: "The personalized learning approach made complex topics easy to understand.",
      author: "Priya M."
    }
  ];

  return (
    <section className="py-20 bg-black border-t border-b border-blue-500">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-12" data-aos="fade-up">
          Success Stories
        </h2>
        <div className="max-w-3xl mx-auto">
          <div id="successCarousel" className="carousel">
            {stories.map((story, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-black/50 mb-6"
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <p className="text-xl mb-4">{story.quote}</p>
                <p className="text-blue-500 font-semibold">- {story.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
