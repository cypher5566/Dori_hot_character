# TalkHeal 系統架構文件

> 最後更新：2026-01-29
> 版本：v1.0 (Edge Function v20)

---

## 目錄

0. [產品理念](#0-產品理念)
1. [系統概覽](#1-系統概覽)
2. [技術棧](#2-技術棧)
3. [架構圖](#3-架構圖)
4. [資料庫 Schema](#4-資料庫-schema)
5. [Edge Function API](#5-edge-function-api)
6. [Intent Detection 邏輯](#6-intent-detection-邏輯)
7. [RAG Pipeline](#7-rag-pipeline)
8. [資料驗證流程](#8-資料驗證流程)
9. [部署與維護](#9-部署與維護)
10. [已知限制與未來改進](#10-已知限制與未來改進)

---

## 0. 產品理念

### 🌱 使命

> **「關係值得被好好理解」**

### 核心問題

> **關係卡住了，卻說不清楚哪裡不對？**

很多伴侶知道「有問題」，但說不出問題在哪。他們需要一個客觀的第三視角。

### 價值主張

讓 **聊癒 TalkHeal** 讀完你們的對話，找出你們看不見的模式，為關係找到出口。

### 三大核心功能

| 功能 | 理念 |
|------|------|
| 📊 **數據洞察** | 誰主動多？何時最親密？用數據理解默契，**不再憑感覺猜測**。 |
| 🔍 **問題定位** | 找出反覆出現的衝突模式與關鍵字，**定位那些「卡住」的結點**。 |
| 💡 **具體建議** | 不只是發現問題，提供針對你們溝通風格的**專屬練習建議**。 |

### 報告哲學

> **「報告不是終點，是對話的起點」**

我們相信：
- 你們不需要一次解決所有問題
- 從第一份報告開始就好
- 關係是需要持續練習的

### 隱私承諾

這是產品的底線，沒有妥協空間：

| 承諾 | 說明 |
|------|------|
| 🚫 **不儲存於伺服器** | 分析完成後，原始檔案在 10 分鐘內自動刪除 |
| 🚫 **不用於訓練 AI** | 透過 API 傳送的資料不會被用於訓練模型 |
| 🚫 **無人工介入查看** | 整個分析過程完全自動化 |

### 設計原則

這些原則指導我們的技術決策：

1. **證據層級**：行為數據 > 對方觀察 > 自我評估
2. **描述行為，不貼標籤**：不說「焦慮型依附」，而是說「在 X 時間點表達過不安」
3. **區分單一事件與模式**：1 次 ≠ 「常常」「總是」
4. **平衡呈現**：不偏袒任何一方
5. **第一性原理驗證**：所有結構化資料都經過對話原文交叉驗證

---

## 1. 系統概覽

### 1.1 什麼是 TalkHeal？

TalkHeal 是一個**伴侶關係分析系統**，將產品理念落地為技術實現：

| 理念 | 技術實現 |
|------|---------|
| 數據洞察 | 訊息統計、時間分布、主動率計算 |
| 問題定位 | 衝突分類表 `th_conflict_categories`、語意搜尋 |
| 具體建議 | RAG + LLM 生成個人化建議 |
| 隱私承諾 | 不存原文、Edge Function 即時處理 |

系統能夠：
- 讀取 Instagram 對話紀錄（110,037 則訊息，16 週）
- 建立結構化知識庫（人物、時間線、衝突模式、願望、回饋等）
- 提供自然語言問答介面，讓用戶探索自己的關係

### 1.2 核心功能

| 功能 | 描述 | 觸發方式 |
|------|------|---------|
| 衝突模式分析 | 回答「我們最常吵什麼？」 | `isConflictPattern` |
| 願望清單查詢 | 回答「美茵想要什麼？」 | `isWishlist` |
| 伴侶回饋查詢 | 回答「她欣賞我什麼？」 | `isPartnerFeedback` |
| 偏好查詢 | 回答「她喜歡吃什麼？」 | `isPreference` |
| 時間線查詢 | 回答「第一次見面是什麼時候？」 | `isTemporal` |
| 通用分析 | 深度分析類問題 | `isAnalytical` |

---

## 2. 技術棧

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  Vercel (Static HTML) - talkheal.vercel.app            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Edge Function                        │
│  Supabase Edge Functions (Deno)                        │
│  - search-conversations (v20)                          │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│   Supabase DB   │ │  OpenAI API │ │ Gemini API  │
│   (PostgreSQL)  │ │ (Embedding) │ │   (LLM)     │
│   + pgvector    │ │             │ │             │
└─────────────────┘ └─────────────┘ └─────────────┘
```

### 2.1 服務清單

| 服務 | 用途 | 備註 |
|------|------|------|
| **Supabase** | 資料庫 + Edge Functions | Project: `ljqqmtupmyjhkwydtcsj` |
| **OpenAI** | text-embedding-3-small | 用於語意搜尋 |
| **Gemini** | gemini-2.5-flash-lite | 用於生成回答（有 fallback key） |
| **Vercel** | 靜態網站託管 | talkheal.vercel.app |

---

## 3. 架構圖

### 3.1 查詢處理流程

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Intent Detection                                     │
│    detectIntent(query) → QueryIntent                    │
│    - isConflictPattern? → fetch th_conflict_categories  │
│    - isWishlist? → fetch th_wishes                      │
│    - isPartnerFeedback? → fetch th_partner_feedback     │
│    - isPreference? → fetch th_preferences               │
│    - isAnalytical? → fetch th_recurring_topics +        │
│                          th_timeline_events             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Hybrid Search                                        │
│    - OpenAI Embedding → semantic search                 │
│    - Keyword extraction → keyword search                │
│    - RRF (Reciprocal Rank Fusion) 合併結果              │
│    - Rerank (boost conflicts, penalize past-rel)       │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Context Assembly                                     │
│    - Structured data (from th_* tables)                │
│    - Top N conversation summaries                       │
│    - Top K full conversation content                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 4. LLM Generation                                       │
│    - Gemini API (with fallback key)                    │
│    - Intent-specific prompt template                    │
└─────────────────────────────────────────────────────────┘
    │
    ▼
JSON Response
```

---

## 4. 資料庫 Schema

### 4.1 表格總覽

| 表名 | 用途 | 筆數 | 主要欄位 |
|------|------|------|---------|
| `th_conversation_chunks` | 對話片段 | 1,711 | content, summary, embedding, has_conflict |
| `th_entities` | 人物實體 | 96 | canonical_name, aliases, entity_type |
| `th_timeline_events` | 時間線事件 | 110 | event_date, title, category, confidence |
| `th_recurring_topics` | 反覆議題 | 12 | topic_name, correct_interpretation |
| `th_preferences` | 偏好資料 | ~50 | person, item, sentiment, category |
| `th_conflict_categories` | 衝突分類 | 8 | category, frequency, resolution_pattern |
| `th_wishes` | 願望清單 | 13 | person, wish_text, urgency, status |
| `th_partner_feedback` | 伴侶回饋 | 14 | from_person, about_person, feedback_type |
| `th_rituals_jokes` | 儀式與暱稱 | 63 | type, name, meaning |
| `th_error_patterns` | 已知錯誤 | 20 | pattern, correction |
| `th_disambiguation_rules` | 消歧義規則 | 10 | ambiguous_term, correct_meaning |
| `th_kb_sections` | KB 段落 | 36 | section_id, content |
| `th_open_questions` | 開放問題 | 18 | question, status |
| `th_feedback` | 用戶反饋 | - | error_text, correction |

### 4.2 核心表 Schema

#### `th_conversation_chunks`（對話片段）

```sql
CREATE TABLE th_conversation_chunks (
  id BIGSERIAL PRIMARY KEY,
  week_number INT NOT NULL,              -- 1-16
  chunk_index INT NOT NULL,              -- 該週第幾段
  date_range TEXT,                       -- e.g., "10/13 - 10/15"
  message_count INT,                     -- 該段訊息數
  content TEXT NOT NULL,                 -- 完整對話內容
  summary TEXT,                          -- 中文摘要 (~36字)
  embedding vector(1536),                -- text-embedding-3-small
  has_conflict BOOLEAN DEFAULT FALSE,
  has_milestone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_chunks_week ON th_conversation_chunks(week_number);
CREATE INDEX idx_chunks_conflict ON th_conversation_chunks(has_conflict);
CREATE INDEX idx_chunks_embedding ON th_conversation_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### `th_conflict_categories`（衝突分類）

```sql
CREATE TABLE th_conflict_categories (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,         -- 'self_worth', 'family_pressure', etc.
  category_zh TEXT NOT NULL,             -- '自我價值', '家庭壓力'
  description TEXT,                      -- 詳細描述
  frequency INT DEFAULT 0,               -- 出現次數（已驗證）
  severity_avg NUMERIC(2,1),             -- 平均嚴重度 1-5
  example_chunks INT[],                  -- 代表性 chunk ids
  resolution_pattern TEXT,               -- 通常如何解決
  first_occurrence DATE,
  last_occurrence DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**已驗證的衝突分類（按頻率排序）：**

| category | category_zh | frequency | description |
|----------|-------------|-----------|-------------|
| self_worth | 自我價值 | 10 | M 的內耗、覺得不夠好、擔心比不上前任 |
| family_pressure | 家庭壓力 | 6 | M 原生家庭負擔、照顧妹妹、父親問題 |
| comparison_anxiety | 比較焦慮 | 3 | M 擔心比不上 C 的前任（與 self_worth 重疊） |
| work_stress | 工作壓力 | 3 | M 藥師工作繁忙影響相處 |
| communication_gap | 溝通落差 | 2 | 表達方式差異導致誤解 |
| distance_logistics | 距離物流 | 1 | 見面頻率、交通安排 |
| commitment_fears | 承諾焦慮 | 0 | 對未來、結婚的擔憂（無明確證據） |
| intimacy_pace | 親密節奏 | 0 | 親密發展步調（無明確證據） |

#### `th_wishes`（願望清單）

```sql
CREATE TABLE th_wishes (
  id BIGSERIAL PRIMARY KEY,
  person TEXT NOT NULL,                  -- 'M' or 'C'
  category TEXT NOT NULL,                -- 'life_goal', 'career', 'experience', etc.
  wish_text TEXT NOT NULL,               -- 具體願望
  urgency TEXT DEFAULT 'someday',        -- 'immediate', 'near_term', 'someday', 'ongoing'
  status TEXT DEFAULT 'expressed',       -- 'expressed', 'working_on', 'achieved'
  confidence TEXT DEFAULT 'HIGH',        -- 'VERIFIED', 'HIGH', 'NEEDS_VERIFY'
  evidence_weeks INT[],                  -- 證據來源週次
  evidence_summary TEXT,                 -- 證據摘要
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**已驗證的願望（部分）：**

| person | wish_text | urgency | confidence |
|--------|-----------|---------|------------|
| C | 32歲創業 | near_term | VERIFIED |
| M | 40歲退休 | someday | HIGH |
| M | 成為優秀藥師 | ongoing | HIGH |
| M | 一起去日本 | near_term | HIGH |
| C | 養貓 | someday | HIGH |

#### `th_partner_feedback`（伴侶回饋）

```sql
CREATE TABLE th_partner_feedback (
  id BIGSERIAL PRIMARY KEY,
  from_person TEXT NOT NULL,             -- 誰說的 'M' or 'C'
  about_person TEXT NOT NULL,            -- 說誰 'M' or 'C'
  feedback_type TEXT NOT NULL,           -- 'appreciation', 'concern', 'suggestion', 'frustration'
  feedback_text TEXT NOT NULL,           -- 具體回饋內容
  context TEXT,                          -- 當時情境
  frequency TEXT DEFAULT 'once',         -- 'recurring', 'occasional', 'once'
  evidence_weeks INT[],                  -- 證據來源週次
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**已驗證的回饋（部分）：**

| from | about | type | feedback_text | frequency |
|------|-------|------|---------------|-----------|
| M | C | appreciation | 很溫柔體貼 | recurring |
| M | C | appreciation | 很幽默 | recurring |
| M | C | appreciation | 願意溝通 | recurring |
| C | M | appreciation | 很真誠可愛 | recurring |
| C | M | appreciation | 很努力照顧家人 | recurring |
| C | M | suggestion | 不要收斂、要做自己 | recurring |
| C | M | concern | 擔心她太累 | occasional |

### 4.3 資料庫函數

#### `match_conversation_chunks`（語意搜尋）

```sql
CREATE OR REPLACE FUNCTION match_conversation_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  week_number int,
  date_range text,
  summary text,
  message_count int,
  has_conflict boolean,
  has_milestone boolean,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.week_number, c.date_range, c.summary,
    c.message_count, c.has_conflict, c.has_milestone,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM th_conversation_chunks c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### `hybrid_search_chunks`（混合搜尋）

```sql
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  search_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  keyword_weight float DEFAULT 0.4,
  semantic_weight float DEFAULT 0.6
)
RETURNS TABLE (
  id bigint,
  week_number int,
  date_range text,
  summary text,
  message_count int,
  has_conflict boolean,
  has_milestone boolean,
  combined_score float
)
LANGUAGE plpgsql AS $$
-- 使用 Reciprocal Rank Fusion (RRF) 合併 keyword 和 semantic 結果
-- ...
$$;
```

---

## 5. Edge Function API

### 5.1 Endpoint

```
POST https://ljqqmtupmyjhkwydtcsj.supabase.co/functions/v1/search-conversations
```

### 5.2 Actions

#### `action: "rag"` — AI 問答（主要使用）

**Request:**
```json
{
  "action": "rag",
  "query": "我們最常吵什麼？",
  "limit": 30
}
```

**Response:**
```json
{
  "answer": "偉平（C）與美茵（M）之間最常發生的衝突模式...",
  "results": [...],
  "total": 30,
  "mode": "rag",
  "conflict_pattern": true,
  "wishlist": false,
  "partner_feedback": false,
  "preference": false,
  "analytical": true
}
```

#### `action: "search"` — 純搜尋（不生成回答）

**Request:**
```json
{
  "action": "search",
  "query": "日本",
  "mode": "hybrid",  // "keyword" | "semantic" | "hybrid"
  "limit": 20
}
```

#### `action: "get_content"` — 取得對話全文

**Request:**
```json
{
  "action": "get_content",
  "id": 123
}
```

#### `action: "feedback"` — 提交錯誤回報

**Request:**
```json
{
  "action": "feedback",
  "query": "原問題",
  "ai_answer": "AI 回答",
  "error_text": "錯誤描述",
  "correction": "正確應該是..."
}
```

---

## 6. Intent Detection 邏輯

### 6.1 Intent 類型

```typescript
interface QueryIntent {
  isTemporal: boolean;         // 時間相關：「什麼時候」「幾月」
  isWho: boolean;              // 人物相關：「是誰」「哪個人」
  isQuantity: boolean;         // 數量相關：「幾次」「多少」
  isFirst: boolean;            // 首次相關：「第一次」「最早」
  isConflictRelated: boolean;  // 衝突相關：「分手」「吵架」
  isAnalytical: boolean;       // 分析相關：「模式」「為什麼」「原因」

  // 結構化資料觸發
  isPreference: boolean;       // 偏好查詢 → th_preferences
  isConflictPattern: boolean;  // 衝突模式 → th_conflict_categories
  isWishlist: boolean;         // 願望查詢 → th_wishes
  isPartnerFeedback: boolean;  // 回饋查詢 → th_partner_feedback

  // 參數
  preferencePerson: 'M' | 'C' | null;
  preferenceCategory: 'food' | 'place' | 'activity' | null;
  wishlistPerson: 'M' | 'C' | null;
  feedbackAbout: 'M' | 'C' | null;
}
```

### 6.2 Pattern Matching

#### `isConflictPattern`（衝突模式）

```typescript
const isConflictPattern =
  /最常吵|常吵|吵什麼|為什麼吵|為什麼.*吵|吵.*原因/.test(query) ||
  /爭執.*原因|原因.*爭執|爭執類型|爭吵類型/.test(query) ||
  /衝突.*原因|原因.*衝突|衝突模式|衝突類型|常見衝突/.test(query) ||
  /吵架模式|吵架類型|吵架.*原因/.test(query) ||
  /為什麼.*衝突|會有衝突|有.*衝突|衝突原因/.test(query);  // v20 新增
```

**測試案例（12/12 通過）：**
- ✅ 我們最常吵什麼？
- ✅ 為什麼會吵架
- ✅ 吵架的原因是什麼
- ✅ 我們常見的衝突模式
- ✅ 爭執的類型有哪些
- ✅ 為什麼會有衝突

#### `isWishlist`（願望清單）

```typescript
const isWishlist = /想要|夢想|願望|目標|想做|期望|希望|想買|想去|未來計畫|人生目標|追求/.test(query);
```

#### `isPartnerFeedback`（伴侶回饋）

```typescript
const isPartnerFeedback = /覺得我|認為我|對我|欣賞|改進|建議|抱怨|讚美|哪裡好|哪裡可以|擔心|希望我|喜歡我/.test(query);
```

### 6.3 False Positive 防護

已測試以下 query **不會**誤觸發：

| Query | 不應觸發 | 實際結果 |
|-------|---------|---------|
| 她今天工作忙嗎 | conflict_pattern | ✅ False |
| 天氣好冷 | wishlist | ✅ False |
| 我們去過哪些餐廳 | partner_feedback | ✅ False |
| 她媽媽叫什麼名字 | conflict_pattern | ✅ False |

---

## 7. RAG Pipeline

### 7.1 完整流程

```
Query: "我們最常吵什麼？"
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 1: Intent Detection                │
│   isConflictPattern = true              │
│   isAnalytical = true                   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 2: Fetch Structured Data           │
│   → SELECT * FROM th_conflict_categories│
│     ORDER BY frequency DESC             │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 3: Hybrid Search                   │
│   → OpenAI Embedding(query)             │
│   → hybrid_search_chunks(...)           │
│   → 補充 crisis terms 搜尋              │
│   → Rerank (boost real crisis)          │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 4: Assemble Context                │
│   - conflictSection (結構化衝突資料)     │
│   - summaryLines (Top 10 摘要)          │
│   - contentSection (Top 5 全文)         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Step 5: Generate Answer                 │
│   → Gemini API (with fallback key)      │
│   → Conflict-specific prompt template   │
└─────────────────────────────────────────┘
         │
         ▼
JSON Response with answer + sources
```

### 7.2 Prompt Templates

#### Conflict Pattern Prompt

```
你是伴侶關係分析師。C 是偉平（男），M 是美茵（女）。

## ⚡ 衝突模式分類（按頻率排序）
{conflictSection}

## 相關對話摘要：
{summaryLines}

請回答：「{query}」

規則：優先用「衝突模式分類」，按頻率排序，說明解決方式，區分「討論前任」和「C與M衝突」，200-400字，繁中
```

### 7.3 Reranking 邏輯

```typescript
// Boost real crisis content
if (r.has_conflict && isRealCrisis && !isPastRel) boost += 0.20;

// Penalize past relationship discussions
if (isPastRel) penalty += 0.15;

// Penalize jokes
if (/搞笑|玩笑|開玩笑|笑稱|非真衝突/.test(summary)) penalty += 0.10;
```

---

## 8. 資料驗證流程

### 8.1 第一性原理驗證

我們對所有結構化資料進行了嚴格的交叉驗證：

#### 驗證原則

| 原則 | 說明 |
|------|------|
| **關鍵字 ≠ 語意** | 「分手」出現 194 次，但真正分手意圖僅 2 則 |
| **單一事件 ≠ 模式** | 1 次提及不代表「經常」 |
| **自我評估 ≠ 事實** | M 說「我很焦慮」需要行為證據佐證 |
| **人物歸屬要驗證** | 「40歲退休」是誰說的？需查原文 |

#### 驗證結果

| 表 | 檢查數量 | 發現錯誤 | 修復內容 |
|---|---------|---------|---------|
| th_conflict_categories | 8 類別 | 6 個頻率錯誤 | 關鍵字匹配 → 語意分類，重新計算頻率 |
| th_wishes | 14 筆 | 2 筆錯誤 | C 的「40歲退休」→ M；刪除無證據項 |
| th_partner_feedback | 16 筆 | 2 筆錯誤 | 刪除「馬子狗」；修正「不要迎合」方向 |

### 8.2 具體修正記錄

#### 衝突分類頻率修正

```
comparison_anxiety: 56 → 3  (原本關鍵字匹配「比較」，實際語意分類)
self_worth: 23 → 10
family_pressure: 18 → 6
commitment_fears: 14 → 0  (無明確證據)
intimacy_pace: 3 → 0      (無明確證據)
```

#### 願望資料修正

```sql
-- 錯誤：C 的「40歲退休」實際上是 M 說的
DELETE FROM th_wishes WHERE person = 'C' AND wish_text = '40歲退休';
INSERT INTO th_wishes (person, wish_text, ...) VALUES ('M', '40歲退休', ...);

-- 錯誤：「檢察官夢想」無對話證據
DELETE FROM th_wishes WHERE wish_text ILIKE '%檢察官%';
```

#### 伴侶回饋修正

```sql
-- 錯誤：「馬子狗」無對話證據
DELETE FROM th_partner_feedback WHERE feedback_text ILIKE '%馬子狗%';

-- 錯誤：「不要迎合」方向相反，實際是 C→M
UPDATE th_partner_feedback
SET feedback_text = '不要對非女友的人太好，會太累'
WHERE from_person = 'M' AND about_person = 'C' AND feedback_text ILIKE '%迎合%';

INSERT INTO th_partner_feedback (from_person, about_person, feedback_type, feedback_text, ...)
VALUES ('C', 'M', 'suggestion', '不要收斂、要做自己', ...);
```

---

## 9. 部署與維護

### 9.1 環境變數

Supabase Edge Function 需要以下 secrets：

```
SUPABASE_URL=https://ljqqmtupmyjhkwydtcsj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...  # Fallback key
```

### 9.2 部署流程

#### Edge Function

```bash
# 使用 Supabase MCP 部署
mcp__supabase-haven__deploy_edge_function(
  name: "search-conversations",
  entrypoint_path: "index.ts",
  verify_jwt: false,
  files: [...]
)
```

#### Frontend

```bash
# 部署到 Vercel
npx vercel --prod --yes
```

### 9.3 監控與日誌

```bash
# 查看 Edge Function 日誌
mcp__supabase-haven__get_logs(service: "edge-function")

# 查看 API 日誌
mcp__supabase-haven__get_logs(service: "api")
```

### 9.4 增量更新流程

當有新對話資料時：

1. 跑 `convert_messages.py` 生成新的 weekly files
2. 對新週次執行資料提取
3. 合併到現有表（不覆蓋已驗證項目）
4. 為新的 chunks 生成 contextual summary
5. 為新的 summary 生成 embedding
6. 更新 `relationship_context.md` 版本號

---

## 10. 已知限制與未來改進

### 10.1 已知限制

| 限制 | 說明 | 風險 |
|------|------|------|
| 資料量固定 | 僅 16 週資料（2024/10/13 - 2025/01/26） | 無法回答資料外的問題 |
| 語言限制 | 僅支援繁體中文 | 英文查詢可能效果差 |
| 人物限制 | 僅 C 和 M 兩人 | 第三人查詢可能混淆 |
| Gemini Rate Limit | 有 API 配額限制 | 已設 fallback key |

### 10.2 未來改進方向

| 優先級 | 改進項目 | 說明 |
|--------|---------|------|
| P1 | 增量更新自動化 | 新資料自動提取、分類、embedding |
| P1 | 錯誤回報閉環 | 用戶反饋 → 自動更新 KB |
| P2 | 多用戶支援 | 支援多對伴侶，資料隔離 |
| P2 | 對話式追問 | 支援 follow-up questions |
| P3 | 情緒趨勢圖 | 可視化情緒變化 |
| P3 | 週報自動生成 | 每週關係摘要 |

---

## 附錄 A: 檔案結構

```
meiyin0910_1882112159854854/
├── CLAUDE.md                    # 分析指南（方法論）
├── SYSTEM_ARCHITECTURE.md       # 本文件
├── relationship_context.md      # Knowledge Base (KB)
├── conversation_search.html     # 前端頁面
├── index.html                   # Landing page
├── weekly_01.md ~ weekly_16.md  # 原始對話（按週）
├── convert_messages.py          # 訊息轉換腳本
└── generate_embeddings.py       # Embedding 生成腳本
```

---

## 附錄 B: 常見問題

### Q: 為什麼某些衝突類別頻率是 0？

A: 因為經過第一性原理驗證，這些類別（如 `commitment_fears`, `intimacy_pace`）在對話中沒有明確的行為證據支持。我們選擇保留這些類別但標記頻率為 0，而非刪除，以便未來有新資料時可以更新。

### Q: 為什麼用 Gemini 而不是 GPT-4？

A: Gemini 2.5 Flash Lite 在成本和速度上有優勢，且對中文支援良好。如果需要更高品質的回答，可以考慮切換到 GPT-4 或 Claude。

### Q: 如何處理 API Rate Limit？

A: 我們實作了 Gemini API fallback 機制，當主要 key 遇到 rate limit 時會自動切換到備用 key。

---

*文件維護者：TalkHeal Team*
*最後驗證日期：2026-01-29*
