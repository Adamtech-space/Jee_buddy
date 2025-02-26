import FluidBackground from '../../UI/FluidBackground';

const About = () => {
  return (
    <section id="about" className="relative py-20 overflow-hidden">
      <FluidBackground />
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">About Us</h2>
          <p className="text-gray-600 mb-6">
            Your company description and story goes here. Share what makes your business unique
            and why customers should choose you.
          </p>
        </div>
      </div>
    </section>
  )
}

export default About
