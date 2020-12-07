import CacheUtils from "./CacheUtils.js"

const OPEN_COLLECTIVE_ENDPOINT= ()=>"https://api.opencollective.com/graphql/v2";
const OPEN_COLLECTIVE_BACKER_QUERY = (org) => `
query collective ($offset: Int, $limit: Int){
    collective(slug: "${org}") {
      name
      backers: members(role: BACKER, offset: $offset, limit: $limit) {
        limit
        totalCount
        nodes {
          publicMessage
          totalDonations {
            value
            currency
            valueInCents
          }
          account {
            slug
            type
          
            
            ... on Individual {
              email
              name
              website
              imageUrl
            }
            ... on Organization {
              admins: members(role: ADMIN) {
                nodes {
                  account {
                    ... on Individual {
                      email
                      name
                      website
                      imageUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `;
export default class OpenCollectiveUtils {
  static async    getBackers(collective) {
      const cacheKey = "ocollective/" + collective + "/backers";
      let backers = CacheUtils.get(cacheKey);
      let cached=true;
      if (!backers) {
        cached=false;
        const endPoint = OPEN_COLLECTIVE_ENDPOINT(collective);
        const query = OPEN_COLLECTIVE_BACKER_QUERY(collective);
        backers = await fetch(endPoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            variables: {
              offset: 0,
              limit: 1000
            },
          })
        }).then((res) =>{ 
          if(res.ok&&res.status==200)return res.json() ;
          else throw "Failed to fetch!";
      });
        if (!backers) throw "Undefined backers?";
        CacheUtils.set(cacheKey, backers);
      }
      return [backers,cached];
 
  }

   static async getBackersFlat(collective,modifier) {
     const [res,cached]=await this.getBackers(collective);
    const backers = [];
    const backersObj = res.data.collective.backers.nodes;
    for (let i in backersObj) {
      const entry = {};
      const backer = backersObj[i];

      entry.message = backer.publicMessage;
      entry.value = backer.totalDonations.value;
      entry.currency = backer.totalDonations.currency;

      let account = backer.account;
      entry.accountUrl = "https://opencollective.com/" + account.slug;

      const subAccounts = [];
      if (account.type == "ORGANIZATION") {
        account.admins.nodes.forEach(admin => subAccounts.push(admin.account));
      } else {
        subAccounts.push(account);
      }

      subAccounts.forEach(account => {
        const subEntry = { ...entry };
        subEntry.name = account.name;
        subEntry.website = account.website;
        subEntry.avatar = account.imageUrl;
        backers.push(subEntry);
      });

    }

    if(!cached&&modifier)backers=modifier(backers);

    return backers;
  }
}
