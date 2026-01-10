import { ReactNode, Children, isValidElement, cloneElement } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface StaggeredListProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

const StaggeredList = ({ children, staggerDelay = 100, className }: StaggeredListProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.05 });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
            className: cn(
              child.props.className,
              'transition-all duration-700',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            ),
            style: {
              ...child.props.style,
              transitionDelay: `${index * staggerDelay}ms`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
          });
        }
        return child;
      })}
    </div>
  );
};

export default StaggeredList;
