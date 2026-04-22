import { useRef } from "react";
import './styles/app.css';
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import { VolumeProvider, useVolume } from "./components/VolumeContext";
import ScrollForFlowingSongs from "./steps/ScrollForFlowingSongs";
import ScrollForIntro from "./steps/ScrollForIntro";
import ScrollForTransitionOne from "./steps/ScrollForTransitionOne";
import ScrollForTop50Songs from "./steps/ScrollForTop50Songs";
import ScrollForTransitionTwo from "./steps/ScrollForTransitionTwo";
import ScrollForFourCurves from "./steps/ScrollForFourCurves";
import ScrollForTransitionThree from "./steps/ScrollForTransitionThree";
import ScrollForJoyplot from "./steps/ScrollForJoyplot";
import ScrollForTransitionFour from "./steps/ScrollForTransitionFour";
import ScrollForCQTIllustration from "./steps/ScrollForCQTIllustration";
import ScrollForCQT from "./steps/ScrollForCQT";
import ScrollForTransitionFive from "./steps/ScrollForTransitionFive";
import ScrollForHPCPIllustration from "./steps/ScrollForHPCPIllustration";
import ScrollForHPCPComparision from "./steps/ScrollForHPCPComparision";
import ScrollForHPCPExample from "./steps/ScrollForHPCPExample";
import ScrollForHPCPCircle from "./steps/ScrollForHPCPCircle";
import ScrollForNebula from "./steps/ScrollForNebula";
import Ending from "./steps/Ending";


function AppContent() {
  const { language, toggleLanguage } = useLanguage();
  const { rawVolume, setVolume, isMuted, toggleMute } = useVolume();

  const introRef = useRef(null);
  const flowingSongsRef = useRef(null);
  const transitionOneRef = useRef(null);
  const topSongsRef = useRef(null);
  const transitionTwoRef = useRef(null);
  const joyplotRef = useRef(null);
  const fourCurvesRef = useRef(null);
  const transitionThreeRef = useRef(null);
  const transitionFourRef = useRef(null);
  const cqtIllustrationRef = useRef(null);
  const cqtRef = useRef(null);
  const transitionFiveRef = useRef(null);
  const hpcpIllustrationRef = useRef(null);
  const hpcpComparisionRef = useRef(null);
  const hpcpExampleRef = useRef(null);
  const hpcpCircleRef = useRef(null);
  const nebulaRef = useRef(null);
  const endingRef = useRef(null);

  return (
    <div className="app-container">
      <div className="global-controls">
        <button className="global-controls__lang-btn" onClick={toggleLanguage}>
          {language === 'zh' ? 'English' : '中文'}
        </button>
        
        <div className="global-controls__volume-panel">
          <button className="global-controls__mute-btn" onClick={toggleMute}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={rawVolume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="global-controls__slider"
          />
          <span className="global-controls__volume-label">
            {isMuted ? 'Muted' : `${Math.round(rawVolume * 100)}%`}
          </span>
        </div>
      </div>

      <div ref={introRef}>
        <ScrollForIntro />
      </div>
      <div ref={flowingSongsRef}>
        <ScrollForFlowingSongs />
      </div>
      <div ref={transitionOneRef}>
        <ScrollForTransitionOne
          onContinue={() => topSongsRef.current?.scrollIntoView()}
          onGoBack={() => introRef.current?.scrollIntoView()}
        />
      </div>
      <div ref={topSongsRef}>
        <ScrollForTop50Songs />
      </div>
      <div ref={transitionTwoRef}>
        <ScrollForTransitionTwo
          onContinue={() => fourCurvesRef.current?.scrollIntoView()}
          onGoBack={() => introRef.current?.scrollIntoView()}
        />
      </div>
      <div ref={fourCurvesRef}>
        <ScrollForFourCurves />
      </div>
      <div ref={transitionThreeRef}>
        <ScrollForTransitionThree
          onContinue={() => joyplotRef.current?.scrollIntoView()}
          onGoBack={() => introRef.current?.scrollIntoView()}
        />
      </div>
      <div ref={joyplotRef}>
        <ScrollForJoyplot />
      </div>
      <div ref={transitionFourRef}>
        <ScrollForTransitionFour
          onContinue={() => cqtIllustrationRef.current?.scrollIntoView()}
          onGoBack={() => introRef.current?.scrollIntoView()}
        />
      </div>
      <div ref={cqtIllustrationRef}>
        <ScrollForCQTIllustration />
      </div>
      <div ref={cqtRef}>
        <ScrollForCQT />
      </div>
      <div ref={transitionFiveRef}>
        <ScrollForTransitionFive
          onContinue={() => hpcpIllustrationRef.current?.scrollIntoView()}
          onGoBack={() => introRef.current?.scrollIntoView()}
        />
      </div>
      <div ref={hpcpIllustrationRef}>
        <ScrollForHPCPIllustration />
      </div>
      <div ref={hpcpComparisionRef}>
        <ScrollForHPCPComparision />
      </div>
      <div ref={hpcpExampleRef}>
        <ScrollForHPCPExample />
      </div>
      <div ref={hpcpCircleRef}>
        <ScrollForHPCPCircle />
      </div>
      <div ref={nebulaRef}>
        <ScrollForNebula />
      </div>
      <div ref={endingRef}>
        <Ending />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <VolumeProvider>        {/* 必须包裹 AppContent */}
        <AppContent />
      </VolumeProvider>
    </LanguageProvider>
  );
}
