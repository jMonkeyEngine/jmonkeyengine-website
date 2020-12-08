const ShowCase=function(showCaseEl){
	console.log("Init showcase for",showCaseEl);
	const mode=showCaseEl.getAttribute("mode");


	this.getYoutubeVideos=()=>{
		const els = showCaseEl.querySelectorAll("iframe.showcaseElement.youtubeVid");
		return els;
	};

	this.getVideos=()=>{
		const els = showCaseEl.querySelectorAll("video.showcaseElement");
		return els;
	};


	this.getImages=()=>{
		const els = showCaseEl.querySelectorAll(".cover:not(.blur)");
		return els;
	};

	this.playCurrent=()=>{
		if(mode=="gallery"){
			this.getImages().forEach(el=>el.classList.add("gallery"));
		}else{
			this.getImages().forEach(el=>el.classList.remove("gallery"));
		}

		lazyLoad(showCaseEl);

		this.getVideos().forEach(el=>{
		
			if(el.style.display!="none"){
				if(mode=="gallery"){
					el.classList.add("gallery");
					el.setAttribute("controls", "");
					el.removeAttribute("loop");
					el.removeAttribute("autoplay");
					el.removeAttribute("muted");
					el.volume=1.0;
					el.muted = false;
				}else{
					el.play();
					el.removeAttribute("controls", "");
					el.setAttribute("loop");
					el.setAttribute("muted");
					el.setAttribute("autoplay");
					el.classList.remove("gallery");
					el.muted = true;

				}
			}else{
				el.pause();
				el.currentTime=0;
			} 
		});

		this.ytReloadInc=0;
		this.getYoutubeVideos().forEach(el=>{
			let osrc=el.getAttribute("osrc");
			if(!osrc){
				osrc=el.getAttribute("src");
				el.setAttribute("osrc",osrc);
			}
			if(el.style.display!="none"){
				if(mode=="gallery"){
					el.src = osrc+"?controls=1&autoplay=0&mute=0&modestbranding=1&disablekb=1&"+(this.ytReloadInc++);
				}else{
					el.src = osrc+"?controls=0&autoplay=1&mute=1&modestbranding=1&disablekb=1&"+(this.ytReloadInc++);
				}
			}else{
				el.src = osrc+"?"+(this.ytReloadInc++);
			} 
		});

	};

	


	this.currentShowcaseElement = 0;
	this.cycleShowCase = (direction) => {

		const els = showCaseEl.querySelectorAll(".showcaseElement");
		els.forEach(el=>el.style.display = "none");
		
		this.currentShowcaseElement+=direction;
		console.log("Select", this.currentShowcaseElement);
		if (this.currentShowcaseElement < 0) this.currentShowcaseElement = 0;
		else if (this.currentShowcaseElement > els.length - 1) this.currentShowcaseElement = els.length - 1;
		const el = els[this.currentShowcaseElement];
		el.style.display = "block";
		this.playCurrent();

	}



	if(mode=="gallery"){
		const showCasePrev=document.createElement("i");
		const showCaseNext=document.createElement("i");

		showCasePrev.setAttribute("id","showCasePrev");
		showCasePrev.classList.add("fas");
		showCasePrev.classList.add("fa-chevron-left");


		showCaseNext.setAttribute("id","showCaseNext");
		showCaseNext.classList.add("fas");
		showCaseNext.classList.add("fa-chevron-right");
		
		showCaseEl.append(showCasePrev);
		showCaseEl.append(showCaseNext);

		showCasePrev.addEventListener("click", (ev) => {
			ev.stopPropagation();
			this.cycleShowCase(-1)
		});

		showCaseNext.addEventListener("click", (ev) => {
			ev.stopPropagation();
			this.cycleShowCase(1)
		});

		showCaseEl.addEventListener("click", () => showCaseEl.requestFullscreen());
	}

	this.playCurrent();


}
window.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("#showcase").forEach(el=>new ShowCase(el));
});
