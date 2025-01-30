import Navbar from './common/Navbar';
import Footer from './common/Footer';
import Hero from './home/Hero';
import Features from './home/Features';
import Demo2 from './home/Demo2';
import Resources from './home/Resources';
import Testimonials from './home/Testimonials';
import Pricing from './home/Pricing';

const JeeBuddy = () => {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          'linear-gradient(135deg, #211e42 24%, #4a2a5c 24%, #812099 50%, #994dcc 50%)',
      }}
    >
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Resources />
        <Demo2 />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default JeeBuddy;
