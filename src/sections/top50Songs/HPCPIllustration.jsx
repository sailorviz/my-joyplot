import { forwardRef, useImperativeHandle, useRef } from "react";

const HPCPIllustration = forwardRef((_, ref) => {
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({

    setIllustrationStep(step){
      const root = containerRef.current;
      const layers = root.querySelectorAll(".hpcpIllustration-layer");

      layers.forEach(el => el.style.opacity = 0);
      // 限定查询作用域，而不是全局查询，有些类名可能重复导致冲突。
      root.querySelector(".base").style.opacity = 1;

      if(step >= 1){
        root.querySelector(".overlay1").style.opacity = 1;
      }
      if(step >= 2){
        root.querySelector(".overlay2").style.opacity = 1;
      }
      if(step >= 3){
        root.querySelector(".overlay3").style.opacity = 1;
      }
      if(step >= 4){
        root.querySelector(".overlay4").style.opacity = 1;
      }
      if(step >= 5){
        root.querySelector(".overlay5").style.opacity = 1;
      }

    },

  }));

  return (

    <div id="hpcp-illustration" ref={containerRef}>

      <img src="/imgs/hpcp/base_background.png" className="hpcpIllustration-layer base"/>

      <img src="/imgs/hpcp/step1.png" className="hpcpIllustration-layer overlay1"/>
      <img src="/imgs/hpcp/step2.png" className="hpcpIllustration-layer overlay2"/>
      <img src="/imgs/hpcp/step3.png" className="hpcpIllustration-layer overlay3"/>
      <img src="/imgs/hpcp/step4.png" className="hpcpIllustration-layer overlay4"/>
      <img src="/imgs/hpcp/step5.png" className="hpcpIllustration-layer overlay5"/>

    </div>

  );

});

export default HPCPIllustration;