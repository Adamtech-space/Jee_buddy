import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PropTypes from 'prop-types';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 5,
  rotationEnd = 0,
  wordAnimationEnd = 0,
  blurStrength = 10,
  containerClassName = "",
  textClassName = ""
}) => {
  const containerRef = useRef(null);
  const words = children.split(' ');

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const wordElements = container.querySelectorAll('.word');
    
    if (!wordElements.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top center+=100',
        end: 'bottom center',
        scrub: true,
        markers: false,
      },
    });

    wordElements.forEach((word, i) => {
      tl.fromTo(
        word,
        {
          opacity: baseOpacity,
          rotateX: baseRotation,
          filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
        },
        {
          opacity: 1,
          rotateX: rotationEnd,
          filter: 'blur(0px)',
          duration: 1,
        },
        i * wordAnimationEnd
      );
    });

    return () => {
      tl.kill();
    };
  }, [scrollContainerRef, enableBlur, baseRotation, baseOpacity, rotationEnd, wordAnimationEnd, blurStrength]);

  return (
    <div ref={containerRef} className={`my-5 ${containerClassName}`}>
      <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>
        {words.map((word, i) => (
          <span key={i} className="word inline-block mx-[0.2em]">
            {word}
          </span>
        ))}
      </p>
    </div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.string.isRequired,
  scrollContainerRef: PropTypes.object,
  enableBlur: PropTypes.bool,
  baseOpacity: PropTypes.number,
  baseRotation: PropTypes.number,
  rotationEnd: PropTypes.number,
  wordAnimationEnd: PropTypes.number,
  blurStrength: PropTypes.number,
  containerClassName: PropTypes.string,
  textClassName: PropTypes.string
};

export default ScrollReveal;
