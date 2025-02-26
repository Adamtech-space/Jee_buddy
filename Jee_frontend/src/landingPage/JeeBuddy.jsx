import { lazy, Suspense } from 'react';
import Navbar from './common/Navbar';
import Footer from './common/Footer';
import Hero from './home/Hero';
// import SplashCursor from '../UI/SplashCursor';

// Lazy load the rest of the components
const Features = lazy(() => import('./home/Features'));
const Demo2 = lazy(() => import('./home/Demo2'));
const Resources = lazy(() => import('./home/Resources'));
const Testimonials = lazy(() => import('./home/Testimonials'));
// const Pricing = lazy(() => import('./home/Pricing'));

const JeeBuddy = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">

      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<div className="h-screen"></div>}>
          <Features />
          <Resources />
          <Demo2 />
          <Testimonials />
          {/* <Pricing /> */}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default JeeBuddy;
