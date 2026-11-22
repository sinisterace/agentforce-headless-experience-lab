# post-site-setup — deploy AFTER the Experience site exists

This folder is **outside `packageDirectories`**, so the base deploy skips it.

## Why
`sharingRules/Company_Knowledge__c` grants the **site guest user** read access to the active `Company_Knowledge__c` record (so the public hub's `companyBrandHero` renders the live brand). Its `<guestUser>Company_Agentforce_Service_Agent</guestUser>` refers to the guest user that **only exists after the Experience site is created**. Deploying it before the site exists **fails** — which is why it's held out of the base deploy.

## When to deploy
After you've created + activated the Experience Cloud site `Company_Agentforce_Service_Agent` (URL prefix `companyagentforceserviceagent`) in the target org:
`sf project deploy start -d post-site-setup -o <org>`

Then assign the `Company_Knowledge_Guest_Read` permission set to that site's guest user. Both are required for guest read (along with the `with sharing` / USER_MODE `CompanyBrandController`, which is already in `force-app`).
