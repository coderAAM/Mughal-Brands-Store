import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type AnimationType = 
  | 'fade-up' 
  | 'fade-down' 
  | 'fade-left' 
  | 'fade-right' 
  | 'scale-up' 
  | 'scale-down'
  | 'slide-up'
  | 'rotate-in';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

const animationClasses: Record<AnimationType, { initial: string; animate: string }> = {
  'fade-up': {
    initial: 'opacity-0 translate-y-10',
    animate: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    initial: 'opacity-0 -translate-y-10',
    animate: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    initial: 'opacity-0 translate-x-10',
    animate: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    initial: 'opacity-0 -translate-x-10',
    animate: 'opacity-100 translate-x-0',
  },
  'scale-up': {
    initial: 'opacity-0 scale-90',
    animate: 'opacity-100 scale-100',
  },
  'scale-down': {
    initial: 'opacity-0 scale-110',
    animate: 'opacity-100 scale-100',
  },
  'slide-up': {
    initial: 'opacity-0 translate-y-20',
    animate: 'opacity-100 translate-y-0',
  },
  'rotate-in': {
    initial: 'opacity-0 rotate-6 scale-95',
    animate: 'opacity-100 rotate-0 scale-100',
  },
};

const AnimatedSection = forwardRef<HTMLDivElement, AnimatedSectionProps>(
  ({ children, animation = 'fade-up', delay = 0, duration = 600, className, threshold = 0.1 }, forwardedRef) => {
    const { ref, isVisible } = useScrollAnimation({ threshold });

    return (
      <div
        ref={(el) => {
          // Handle both refs
          (ref as React.MutableRefObject<HTMLElement | null>).current = el;
          if (typeof forwardedRef === 'function') {
            forwardedRef(el);
          } else if (forwardedRef) {
            forwardedRef.current = el;
          }
        }}
        className={cn(
          'transition-all',
          isVisible ? animationClasses[animation].animate : animationClasses[animation].initial,
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
    );
  }
);

AnimatedSection.displayName = 'AnimatedSection';

export default AnimatedSection;
