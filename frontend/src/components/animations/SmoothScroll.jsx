import { useEffect } from 'react';
import { useLocomotiveScroll } from 'react-locomotive-scroll';

const SmoothScroll = ({ children }) => {
  const { scroll } = useLocomotiveScroll();

  useEffect(() => {
    if (scroll) {
      scroll.on('scroll', (args) => {
        // Custom scroll handling
      });
    }

    return () => {
      if (scroll) {
        scroll.destroy();
      }
    };
  }, [scroll]);

  return (
    <div data-scroll-container>
      <div data-scroll-section>
        {children}
      </div>
    </div>
  );
};

export default SmoothScroll;
