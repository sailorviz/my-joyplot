import { forwardRef, useImperativeHandle } from "react";

const CQTIllustration = forwardRef((_, ref) => {

  useImperativeHandle(ref, () => ({

    setIllustrationStep(step){

      const layers = document.querySelectorAll(".cqtIllustration-layer");

      layers.forEach(el => el.style.opacity = 0);

      document.querySelector(".base").style.opacity = 1;

      if(step >= 1){
        document.querySelector(".overlay1").style.opacity = 1;
      }
      if(step >= 2){
        document.querySelector(".overlay2").style.opacity = 1;
      }
      if(step >= 3){
        document.querySelector(".overlay3").style.opacity = 1;
      }
      if(step >= 4){
        document.querySelector(".overlay4").style.opacity = 1;
      }
      if(step >= 5){
        document.querySelector(".overlay5").style.opacity = 1;
      }

    },

  }));

  return (

    <div id="cqt-illustration">

      <img src="/imgs/cqt/base_background.png" className="cqtIllustration-layer base"/>

      <img src="/imgs/cqt/step1.png" className="cqtIllustration-layer overlay1"/>
      <img src="/imgs/cqt/step2.png" className="cqtIllustration-layer overlay2"/>
      <img src="/imgs/cqt/step3.png" className="cqtIllustration-layer overlay3"/>
      <img src="/imgs/cqt/step4.png" className="cqtIllustration-layer overlay4"/>
      <img src="/imgs/cqt/step5.png" className="cqtIllustration-layer overlay5"/>

    </div>

  );

});

export default CQTIllustration;