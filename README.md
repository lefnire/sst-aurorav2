Start with https://github.com/serverless-stack/sst/issues/2506

This sets up Aurora Serverless v2. Because v2 costs $40/m minimum per cluster, it provides 3 possible options:

## 1. Just local (start here)
This assumes you have a local Postgres installation (eg Docker). It will skip creating the common stack resources (VPC, RDS, etc)
```bash
npm run dev
```

Nice & simple. Free.

## 2. `commondev` - shared b/w all dev envs
This creates a common stack for all development environments. A single common stack which is shared across everything that's not literally named `prod`. So `staging|dev|test|user1|user2|etc` will all be piggy-backing on the same VPC and Aurora Serverless v2 Cluster. To differentiate between the environments, a separately-named `databaseName` (which is `myapp${stage}` by default) is used. This means you incure a minimum of $40/m for all environments. 

```bash
npm run deploy:common
npm run deploy:staging
# npm run dev
```

## 3. `commonprod` - single "common" (not really) instance for prod 
When it's show-time, you launch a single common stack, which is only ever used by prod (ie it's not actually a common stack, just consistency). 

```
npx sst deploy --stage commonprod
npx sst deploy --stage common
```

Now it's $80/m minimum. $40 for prod, $40 for everything else.