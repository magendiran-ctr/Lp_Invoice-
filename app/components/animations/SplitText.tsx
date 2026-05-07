import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// Register plugins immediately after import
gsap.registerPlugin(GSAPSplitText, useGSAP); 

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number; // Stagger delay per element in milliseconds
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 30, 
  duration = 0.3, 
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 0 }, 
  to = { opacity: 1, y: 0 }, 
  tag = 'p',
  textAlign = 'center',
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
  const animationDuration = 5; 
  
  // Define the 'hide' animation state (e.g., opacity 0)
  const hideFrom = { opacity: 0, y: 0 };
  useEffect(() => {
    // Ensure fonts are loaded for correct SplitText metrics
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      
      const el = ref.current as HTMLElement & {
        _rbsplitInstance?: GSAPSplitText;
      };

      // Clean up previous SplitText instance
      if (el._rbsplitInstance) {
        el._rbsplitInstance.revert();
        el._rbsplitInstance = undefined;
      }

      let targets: Element[] = [];

      const assignTargets = (self: GSAPSplitText) => {
        if (splitType.includes('chars') && (self as GSAPSplitText).chars?.length)
          targets = (self as GSAPSplitText).chars;
        if (!targets.length) targets = self.chars || self.words || self.lines;
      };
      
      let splitInstance;
      try {
          splitInstance = new GSAPSplitText(el, {
            type: splitType,
            smartWrap: true,
            autoSplit: splitType === 'lines',
            linesClass: 'split-line',
            wordsClass: 'split-word',
            charsClass: 'split-char',
            reduceWhiteSpace: false,
          });
          assignTargets(splitInstance);
          el._rbsplitInstance = splitInstance;
      } catch (err) {
          console.warn("GSAP SplitText failed to initialize:", err);
          return;
      }

      // Calculate stagger durations
      const staggerTime = delay / 1000;
      const totalRevealTime = targets.length * staggerTime + duration;
      const totalHideTime = targets.length * staggerTime + duration;
      
      // Time to stay visible = cycle time - reveal time - hide time
      const visibleWaitTime = animationDuration - totalRevealTime - totalHideTime;
      
      // 1. Create the master timeline that loops
      const masterTl = gsap.timeline({
          repeat: -1, // Loop indefinitely
          repeatDelay: 0,
          defaults: { willChange: 'transform, opacity', force3D: true }
      });
      
      // 2. Initial state (hidden)
      gsap.set(targets, { ...from });

      // 3. Phase 1: Reveal (Left-to-Right Typing)
      masterTl.to(targets, {
          ...to,
          duration: duration,
          ease: ease,
          stagger: staggerTime, // Stagger is left-to-right by default
      }, 0);
      
      // 4. Phase 2: Hold visible for calculated time
      masterTl.to({}, { duration: Math.max(0.1, visibleWaitTime) }); 
      
      // 5. Phase 3: Hide (Right-to-Left Cleanup/Reverse Typing)
      masterTl.to(targets, { 
          ...hideFrom, // Move to the hidden state (e.g., opacity 0)
          duration: duration,
          ease: ease,
          stagger: {
              each: staggerTime,
              from: "end" // Start the stagger from the end of the targets array
          }
      });
      
      // The timeline automatically repeats here after the cycle is complete.

      // Cleanup function
      return () => {
        masterTl.kill();
        el._rbsplitInstance?.revert();
        el._rbsplitInstance = undefined;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        fontsLoaded,
        animationDuration
      ],
      scope: ref
    }
  );

  const renderTag = () => {
    const style: React.CSSProperties = {
      textAlign,
      wordWrap: 'break-word',
      display: 'inline-block', 
      willChange: 'transform, opacity'
    };
    
    const classes = `split-parent overflow-hidden whitespace-normal ${className}`;
    
    const commonProps = { ref, style, className: classes };

    switch (tag) {
      case 'h1':
        return <h1 {...commonProps}>{text}</h1>;
      case 'h2':
        return <h2 {...commonProps}>{text}</h2>;
      case 'h3':
        return <h3 {...commonProps}>{text}</h3>;
      case 'h4':
        return <h4 {...commonProps}>{text}</h4>;
      case 'h5':
        return <h5 {...commonProps}>{text}</h5>;
      case 'h6':
        return <h6 {...commonProps}>{text}</h6>;
      default:
        return <p {...commonProps}>{text}</p>;
    }
  };

  return renderTag();
};

export default SplitText;