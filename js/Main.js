import CacheUtils from "./CacheUtils.js";
import GithubUtils from "./GithubUtils.js";
import OpenCollectiveUtils from "./OpenCollectiveUtils.js";
// import Christmas from "./Christmas.js";

class OpenCollectiveService{
	 static async init(){

		const collective="jmonkeyengine";

		this.backers=await OpenCollectiveUtils.getBackersFlat(collective,this.backers,(res)=>window.shuffleArray(res));
		console.assert(this.backers,"Backers can't be undefined");
		
		this.backersWithMessage = this.backers.filter(el=>el.message);
		
		this.cycleBackers();
		this.cycleMessage();
		setInterval(() =>{
			this.cycleBackers();
		}, 5000);
	}

	 static async cycleBackers () {
		this.shownBacker=CacheUtils.cachedCycle("backers",0,this.backers.length-1,10000);
		const backer = this.backers[this.shownBacker];
		document.querySelectorAll("#backerName").forEach(el=>{
			el.setAttribute("href", backer.accountUrl);
			el.innerHTML = backer.name;
		});
	}

	 static async cycleMessage () {
			this.shownBackerMessage=CacheUtils.cachedCycle("backersMex",0,this.backersWithMessage.length-1,10000);
			const backer = this.backersWithMessage[this.shownBackerMessage];
			document.querySelectorAll("#backerMessage").forEach(el=>{
				el.innerHTML = backer.message?backer.message:"   ";
			});
			document.querySelectorAll("#backerMessageName").forEach(el=>{				
				el.innerText = "- "+backer.name;
				el.setAttribute("href", backer.accountUrl);				
			});	
	}

}

class GithubService{
	 static async init(){

		this.contributors=[];
		this.contributors.push(...await GithubUtils.getTop100Contributors("jMonkeyEngine/jmonkeyengine"),(res)=>window.shuffleArray(res));
		this.contributors.push(...await GithubUtils.getTop100Contributors("jMonkeyEngine/sdk"),(res)=>window.shuffleArray(res));
		this.contributors.push(...await GithubUtils.getTop100Contributors("jMonkeyEngine/wiki"),(res)=>window.shuffleArray(res));

		this.resolveUsers();
		this.cycleContributors();
		setInterval(() =>{
			this.cycleContributors();
		}, 5000);
	}

	 static async cycleContributors () {
		this.shownContributor=CacheUtils.cachedCycle("contribs",0,this.contributors.length-1,20000);
		
		let contributor = this.contributors[this.shownContributor];
		contributor=await GithubUtils.resolveUser(contributor.login);
		document.querySelectorAll("#contributorName").forEach(contributorNameEl=>{
			contributorNameEl.innerText = contributor.name?contributor.name:contributor.login;
			contributorNameEl.setAttribute("href", contributor.html_url);
		});
	}

	 static async resolveUsers(){
		 console.log("Look for github users to resolve...")
		document.querySelectorAll("[github-user]").forEach(el=>{
			const user=el.getAttribute("github-user");
			console.log("Found user needing resolution",el,user)

			GithubUtils.resolveUser(user).then(user=>{
				// console.log(user,"read for resolution!");
				const properties={};
				properties.name=user.name;
				if(!properties.name)properties.name=user.login;
				properties.link=user.html_url;
				properties.bio=user.bio;
				properties.twitter_username=user.twitter_username;
				properties.twitter_link=user.twitter_username?"https://twitter.com/"+user.twitter_username:undefined;
				properties.public_repos=user.public_repos;
				properties.hireable=user.hireable;
				properties.email=user.email;
				properties.blog=user.blog;
				properties.avatar_url=user.avatar_url;
				for(let k in properties){
					const v=properties[k];
					if(!v)continue;
					const attr="ghresolve-"+k;
					el.querySelectorAll("["+attr+"]").forEach(eel=>{
						const realattr=eel.getAttribute(attr);
						eel.style.display="inline-block";
						if(realattr==="innerText"){
							eel.innerText=v;
						}else{
							eel.setAttribute(realattr,v);
						}
					})
					// el.querySelectorAll(".gh"+k).forEach(eel=>eel.style.display="inline-block");
					// el.querySelectorAll("a.gh"+k).forEach(eel=>eel.setAttribute("href",v));
					// el.querySelectorAll("span.gh"+k).forEach(eel=>eel.innerText=v);					
				}
			});
		});
	}
}


window.addEventListener("DOMContentLoaded", function () {
	OpenCollectiveService.init();
	GithubService.init();
	// Christmas.init();
});



