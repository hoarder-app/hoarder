# Database

## Database Migrations

- The database schema lives in `packages/db/schema.ts`.
- Changing the schema, requires a migration.
- You can generate the migration by running `pnpm drizzle-kit generate:sqlite` in the `packages/db` dir.
- You can then apply the migration by running `pnpm run migrate`.


## Drizzle Studio

You can start the drizzle studio by running `pnpm db:studio` in the root of the repo.

## Database Schema Documentation

### Overview

The database schema lives in `packages/db/schema.ts` and is designed using Drizzle ORM for SQLite.

### Common Field Types

These field types are used across multiple tables in the schema.

#### ID Field

A text field for storing UUIDs, generated using createId() from @paralleldrive/cuid2.

#### Created At Field

An integer field storing a timestamp of when the record was created.

#### Modified At Field

An integer field representing the timestamp when the record was last modified, with an onUpdate trigger to automatically update the value when the record is modified.

### Tables

#### Enum Types

Several tables use enum constants defined in the schema:

- `BookmarkTypes` is imported from "@karakeep/shared/types/bookmarks" and includes LINK ("link"), TEXT ("text"), ASSET ("asset"), and UNKNOWN ("unknown").
- `AssetTypes` is defined in the schema and includes LINK_BANNER_IMAGE, LINK_SCREENSHOT, ASSET_SCREENSHOT, LINK_FULL_PAGE_ARCHIVE, LINK_PRECRAWLED_ARCHIVE, LINK_VIDEO, BOOKMARK_ASSET, and UNKNOWN.

The documentation below shows the string values for readability.

#### Users

The `user` table stores user information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the user, generated using createId() |
| name | TEXT (Not Null) | User's name |
| email | TEXT (Not Null, Unique) | User's email address |
| emailVerified | INTEGER (Timestamp_ms) | Timestamp when the email was verified |
| image | TEXT | URL to the user's profile image |
| password | TEXT | User's password (hashed) |
| salt | TEXT (Not Null, Default: "") | Salt used for password hashing |
| role | TEXT (Enum: ["admin", "user"], Default: "user") | User's role |

#### Accounts

The `account` table stores user account information from various providers.

| Column | Type | Description |
|--------|------|-------------|
| userId | TEXT (Not Null, Foreign Key: user.id) | ID of the user this account belongs to |
| type | TEXT (Not Null) | Type of the account |
| provider | TEXT (Not Null) | Provider of the account |
| providerAccountId | TEXT (Not Null) | Provider-specific account ID |
| refresh_token | TEXT | Refresh token for the account |
| access_token | TEXT | Access token for the account |
| expires_at | INTEGER | Expiration time of the access token |
| token_type | TEXT | Type of the token |
| scope | TEXT | Scope of the token |
| id_token | TEXT | ID token for the account |
| session_state | TEXT | Session state |

**Primary Key**: (provider, providerAccountId)

#### Sessions

The `session` table stores user session information.

| Column | Type | Description |
|--------|------|-------------|
| sessionToken | TEXT (Primary Key) | Unique session token, generated using createId() |
| userId | TEXT (Not Null, Foreign Key: user.id) | ID of the user this session belongs to |
| expires | INTEGER (Timestamp_ms) | Expiration time of the session |

#### Verification Tokens

The `verificationToken` table stores tokens used for email verification.

| Column | Type | Description |
|--------|------|-------------|
| identifier | TEXT (Not Null) | Identifier for the token (e.g., email) |
| token | TEXT (Not Null) | Verification token |
| expires | INTEGER (Timestamp_ms) | Expiration time of the token |

**Primary Key**: (identifier, token)

#### API Keys

The `apiKey` table stores API keys for users.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the API key |
| name | TEXT (Not Null) | Name of the API key |
| createdAt | INTEGER (Timestamp, Not Null) | Creation time of the API key |
| keyId | TEXT (Not Null, Unique) | Unique identifier for the key |
| keyHash | TEXT (Not Null) | Hash of the API key |
| userId | TEXT (Not Null, Foreign Key: user.id) | ID of the user this API key belongs to |

**Unique Constraint**: (name, userId)

#### Bookmarks

The `bookmarks` table stores bookmark information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the bookmark, generated using createId() |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the bookmark |
| modifiedAt | INTEGER (Timestamp, Default: current timestamp, Auto-updates on modification) | Last modification time of the bookmark |
| title | TEXT | Title of the bookmark |
| archived | INTEGER (Boolean, Not Null, Default: false) | Whether the bookmark is archived |
| favourited | INTEGER (Boolean, Not Null, Default: false) | Whether the bookmark is favorited |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this bookmark belongs to |
| taggingStatus | TEXT (Enum: ["pending", "failure", "success"], Default: "pending") | Status of tagging for the bookmark |
| summarizationStatus | TEXT (Enum: ["pending", "failure", "success"], Default: "pending") | Status of summarization for the bookmark |
| summary | TEXT | Summary of the bookmark |
| note | TEXT | Note associated with the bookmark |
| type | TEXT (Not Null, Enum: ["link", "text", "asset"]) | Type of the bookmark |

**Indexes**:
- userId
- archived
- favourited
- createdAt

#### Bookmark Links

The `bookmarkLinks` table stores information about bookmarks that are links.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key, Foreign Key: bookmarks.id, onDelete: cascade) | Unique identifier for the bookmark link, generated using createId() |
| url | TEXT (Not Null) | URL of the link |
| title | TEXT | Title of the link |
| description | TEXT | Description of the link |
| author | TEXT | Author of the link |
| publisher | TEXT | Publisher of the link |
| datePublished | INTEGER (Timestamp) | Publication date of the link |
| dateModified | INTEGER (Timestamp) | Last modification date of the link |
| imageUrl | TEXT | URL of the image associated with the link |
| favicon | TEXT | Favicon of the link |
| content | TEXT | Content of the link |
| htmlContent | TEXT | HTML content of the link |
| crawledAt | INTEGER (Timestamp) | Time when the link was crawled |
| crawlStatus | TEXT (Enum: ["pending", "failure", "success"], Default: "pending") | Status of the crawl for the link |
| crawlStatusCode | INTEGER (Default: 200) | HTTP status code of the crawl |

**Index**: url

#### Assets

The `assets` table stores information about assets associated with bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the asset. Note: Unlike most tables, this has no default function as IDs are generated by the caller |
| assetType | TEXT (Not Null, Enum: ["linkBannerImage", "linkScreenshot", "assetScreenshot", "linkFullPageArchive", "linkPrecrawledArchive", "linkVideo", "bookmarkAsset", "unknown"]) | Type of the asset |
| size | INTEGER (Not Null, Default: 0) | Size of the asset |
| contentType | TEXT | Content type of the asset |
| fileName | TEXT | File name of the asset |
| bookmarkId | TEXT (Nullable, Foreign Key: bookmarks.id, onDelete: cascade) | ID of the bookmark this asset belongs to |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this asset belongs to |

**Indexes**:
- bookmarkId
- assetType
- userId

#### Highlights

The `highlights` table stores highlights made on bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the highlight |
| bookmarkId | TEXT (Not Null, Foreign Key: bookmarks.id, onDelete: cascade) | ID of the bookmark this highlight belongs to |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this highlight belongs to |
| startOffset | INTEGER (Not Null) | Start offset of the highlight |
| endOffset | INTEGER (Not Null) | End offset of the highlight |
| color | TEXT (Not Null, Enum: ["red", "green", "blue", "yellow"], Default: "yellow") | Color of the highlight |
| text | TEXT | Text of the highlight |
| note | TEXT | Note associated with the highlight |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the highlight |

**Indexes**:
- bookmarkId
- userId

#### Bookmark Texts

The `bookmarkTexts` table stores text content of bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key, Foreign Key: bookmarks.id, onDelete: cascade) | Unique identifier for the bookmark text |
| text | TEXT | Text content of the bookmark |
| sourceUrl | TEXT | Source URL of the text |

#### Bookmark Assets

The `bookmarkAssets` table stores asset content of bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key, Foreign Key: bookmarks.id, onDelete: cascade) | Unique identifier for the bookmark asset |
| assetType | TEXT (Not Null, Enum: ["image", "pdf"]) | Type of the asset |
| assetId | TEXT (Not Null) | Unique identifier for the asset (e.g., external storage ID) |
| content | TEXT | Content of the asset |
| metadata | TEXT | Metadata of the asset |
| fileName | TEXT | File name of the asset |
| sourceUrl | TEXT | Source URL of the asset |

#### Bookmark Tags

The `bookmarkTags` table stores tags for bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the tag |
| name | TEXT (Not Null) | Name of the tag |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the tag |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this tag belongs to |

**Unique Constraints**:
- (userId, name)
- (userId, id)

**Indexes**:
- name
- userId

#### Tags on Bookmarks

The `tagsOnBookmarks` table stores the relationship between tags and bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| bookmarkId | TEXT (Not Null, Foreign Key: bookmarks.id, onDelete: cascade) | ID of the bookmark |
| tagId | TEXT (Not Null, Foreign Key: bookmarkTags.id, onDelete: cascade) | ID of the tag |
| attachedAt | INTEGER (Timestamp, Nullable, Default: current timestamp) | Time when the tag was attached to the bookmark |
| attachedBy | TEXT (Not Null, Enum: ["ai", "human"]) | Who attached the tag (must be either "ai" or "human") |

**Primary Key**: (bookmarkId, tagId)

**Indexes**:
- tagId
- bookmarkId

#### Bookmark Lists

The `bookmarkLists` table stores lists of bookmarks.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the list |
| name | TEXT (Not Null) | Name of the list |
| description | TEXT | Description of the list |
| icon | TEXT (Not Null) | Icon of the list |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the list |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this list belongs to |
| type | TEXT (Not Null, Enum: ["manual", "smart"]) | Type of the list |
| query | TEXT | Query for smart lists |
| parentId | TEXT (Nullable, Foreign Key: bookmarkLists.id, onDelete: set null) | ID of the parent list |

**Indexes**:
- userId
- (userId, id) (Unique)

#### Bookmarks in Lists

The `bookmarksInLists` table stores the relationship between bookmarks and lists.

| Column | Type | Description |
|--------|------|-------------|
| bookmarkId | TEXT (Not Null, Foreign Key: bookmarks.id, onDelete: cascade) | ID of the bookmark |
| listId | TEXT (Not Null, Foreign Key: bookmarkLists.id, onDelete: cascade) | ID of the list |
| addedAt | INTEGER (Timestamp, Nullable, Default: current timestamp) | Time when the bookmark was added to the list |

**Primary Key**: (bookmarkId, listId)

**Foreign Keys**:
- bookmarkId references bookmarks.id onDelete: cascade
- listId references bookmarkLists.id onDelete: cascade

**Indexes**:
- bookmarkId
- listId

#### Custom Prompts

The `customPrompts` table stores custom prompts for users.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the prompt, generated using createId() |
| text | TEXT (Not Null) | Text of the prompt |
| enabled | INTEGER (Boolean, Not Null) | Whether the prompt is enabled |
| appliesTo | TEXT (Not Null, Enum: ["all_tagging", "text", "images", "summary"]) | What the prompt applies to |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the prompt |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this prompt belongs to |

**Index**: userId

#### RSS Feeds

The `rssFeeds` table stores RSS feed information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the RSS feed, generated using createId() |
| name | TEXT (Not Null) | Name of the RSS feed |
| url | TEXT (Not Null) | URL of the RSS feed |
| enabled | INTEGER (Boolean, Not Null, Default: true) | Whether the RSS feed is enabled |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the RSS feed |
| lastFetchedAt | INTEGER (Timestamp, Nullable) | Last time the RSS feed was fetched |
| lastFetchedStatus | TEXT (Enum: ["pending", "failure", "success"], Default: "pending") | Status of the last fetch |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this RSS feed belongs to |

**Index**: userId

#### Webhooks

The `webhooks` table stores webhook information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the webhook, generated using createId() |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the webhook |
| url | TEXT (Not Null) | URL of the webhook |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this webhook belongs to |
| events | TEXT (JSON, Not Null) | Events the webhook is subscribed to as an array of strings. Valid events are: "created", "edited", "crawled", or "ai tagged". Defined as `$type<("created" | "edited" | "crawled" | "ai tagged")[]>()` in the schema. |
| token | TEXT (Nullable) | Token for the webhook |

**Index**: userId

#### RSS Feed Imports

The `rssFeedImports` table stores information about imports from RSS feeds.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the import |
| createdAt | INTEGER (Timestamp, Not Null, Default: current timestamp) | Creation time of the import |
| entryId | TEXT (Not Null) | ID of the entry in the RSS feed |
| rssFeedId | TEXT (Not Null, Foreign Key: rssFeeds.id, onDelete: cascade) | ID of the RSS feed |
| bookmarkId | TEXT (Nullable, Foreign Key: bookmarks.id, onDelete: set null) | ID of the bookmark created from the import |

**Indexes**:
- rssFeedImports_feedIdIdx_idx on rssFeedId
- rssFeedImports_entryIdIdx_idx on entryId

**Unique Constraint**: (rssFeedId, entryId)

#### Config

The `config` table stores configuration settings.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT (Primary Key) | Key of the configuration setting |
| value | TEXT (Not Null) | Value of the configuration setting |

#### Rule Engine Rules

The `ruleEngineRules` table stores rules for the rule engine.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the rule, generated using createId() |
| enabled | INTEGER (Boolean, Not Null, Default: true) | Whether the rule is enabled |
| name | TEXT (Not Null) | Name of the rule |
| description | TEXT | Description of the rule |
| event | TEXT (Not Null) | Event that triggers the rule |
| condition | TEXT (Not Null) | Condition for the rule |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this rule belongs to |
| listId | TEXT (Nullable) | ID of the list associated with the rule |
| tagId | TEXT (Nullable) | ID of the tag associated with the rule |

**Index**: userId

**Foreign Keys**:
- (userId, tagId) references (bookmarkTags.userId, bookmarkTags.id) onDelete: cascade
- (userId, listId) references (bookmarkLists.userId, bookmarkLists.id) onDelete: cascade
- userId references users.id onDelete: cascade

#### Rule Engine Actions

The `ruleEngineActions` table stores actions for the rule engine.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (Primary Key) | Unique identifier for the action, generated using createId() |
| userId | TEXT (Not Null, Foreign Key: user.id, onDelete: cascade) | ID of the user this action belongs to |
| ruleId | TEXT (Not Null, Foreign Key: ruleEngineRules.id, onDelete: cascade) | ID of the rule this action belongs to |
| action | TEXT (Not Null) | Action to be performed |
| listId | TEXT (Nullable) | ID of the list associated with the action |
| tagId | TEXT (Nullable) | ID of the tag associated with the action |

**Indexes**:
- userId
- ruleId

**Foreign Keys**:
- (userId, tagId) references (bookmarkTags.userId, bookmarkTags.id) onDelete: cascade
- (userId, listId) references (bookmarkLists.userId, bookmarkLists.id) onDelete: cascade
- userId references users.id onDelete: cascade
- ruleId references ruleEngineRules.id onDelete: cascade

### Relations

#### User Relations

- **Tags**: A user can have multiple tags.
- **Bookmarks**: A user can have multiple bookmarks.
- **Webhooks**: A user can have multiple webhooks.
- **Rules**: A user can have multiple rules.

#### Bookmark Relations

- **User**: A bookmark belongs to a user.
- **Link**: A bookmark can have a link.
- **Text**: A bookmark can have text content.
- **Asset**: A bookmark can have an asset.
- **Tags on Bookmarks**: A bookmark can have multiple tags.
- **Bookmarks in Lists**: A bookmark can be in multiple lists.
- **Assets**: A bookmark can have multiple assets.
- **RSS Feeds**: A bookmark can be imported from multiple RSS feeds.

#### Asset Relations

- **Bookmark**: An asset belongs to a bookmark.

#### Bookmark Tags Relations

- **User**: A tag belongs to a user.
- **Tags on Bookmarks**: A tag can be associated with multiple bookmarks.

#### Tags on Bookmarks Relations

- **Tag**: A tag association belongs to a tag.
- **Bookmark**: A tag association belongs to a bookmark.

#### API Key Relations

- **User**: An API key belongs to a user.

#### Bookmark Lists Relations

- **Bookmarks in Lists**: A list can have multiple bookmarks.
- **User**: A list belongs to a user.
- **Parent**: A list can have a parent list (enabling hierarchical list structure).
- **Children**: A list can have multiple child lists (implied by the parent relation).

#### Bookmarks in Lists Relations

- **Bookmark**: A bookmark in a list belongs to a bookmark.
- **List**: A bookmark in a list belongs to a list.

#### Webhooks Relations

- **User**: A webhook belongs to a user.

#### Rule Engine Rules Relations

- **User**: A rule belongs to a user.
- **Actions**: A rule can have multiple actions.

#### Rule Engine Actions Relations

- **Rule**: An action belongs to a rule.
- **User**: An action belongs to a user (defined through foreign key but not explicitly in the relations object).

#### RSS Feed Imports Relations

- **RSS Feed**: An import belongs to an RSS feed.
- **Bookmark**: An import can create a bookmark.

#### RSS Feeds Relations

- **RSS Feed Imports**: An RSS feed can have multiple imports.
- **User**: An RSS feed belongs to a user.
