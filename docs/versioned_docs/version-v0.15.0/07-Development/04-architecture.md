# Architecture

![Architecture Diagram](/img/architecture/arch.png)

- Webapp: NextJS based using sqlite for data storage.
- Redis: Used with BullMQ for scheduling background jobs for the workers.
- Workers: Consume the jobs from redis and executes them, there are three job types:
  1. Crawling: Fetches the content of links using a headless chrome browser running in the workers container.
  2. OpenAI: Uses OpenAI APIs to infer the tags of the content.
  3. Indexing: Indexes the content in meilisearch for faster retrieval during search.
