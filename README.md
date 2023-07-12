Start with https://github.com/serverless-stack/sst/issues/2506

This is for setting up an Aurora Serverless v2 Cluster. Because v2 costs $40/m minimum per cluster, it uses a "common" system to only create 2 clusters max: `commonprod` and `commondev`. `commondev` is shared across every stage/environment which isn't prod.

```bash
npm run deploy:common
npm run deploy:staging
# or: npm run dev
```