import CacheUtils from "./CacheUtils.js"

export default class GithubUtils {
     static async  getTop100Contributors(repo,modifier){
            const cacheKey="ghrepo/"+repo+"/contribs";
            let contributors=CacheUtils.get(cacheKey);
            if(!contributors){
                const endPoint=this.githubContribEndpoint(repo);
                contributors= await fetch(endPoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }        
                }).then((res) =>{ 
                    if(res.ok&&res.status==200)return res.json() ;
                    else throw "Failed to fetch!";
                });
                contributors=contributors.filter(u=>u.type=="User");
                if(!contributors)throw "Undefined contributors?";
                if(modifier)contributors=modifier(contributors);
                CacheUtils.set(cacheKey,contributors);
            }
            return contributors;        
      
    }
     static async  resolveUser(userId){
            const cacheKey="ghuser/"+userId;
            let userData=CacheUtils.get(cacheKey);
            if(!userData){
                const endPoint=this.githubUserEndPoint(userId);
                userData= await fetch(endPoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }        
                }).then((res) =>{ 
                    if(res.ok&&res.status==200)return res.json() ;
                    else throw "Failed to fetch!";
                });
                if(!userData)throw "Undefined userData?";
                CacheUtils.set(cacheKey,userData);
            }
            return userData;        
        
    }
}
GithubUtils.githubContribEndpoint = (repo)=> `https://api.github.com/repos/${repo}/contributors?per_page=100`;
GithubUtils.githubUserEndPoint = (user)=> `https://api.github.com/users/${user}`;
