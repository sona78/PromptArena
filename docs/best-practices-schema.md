# Best Practices Database Schema

This document outlines the database schema for storing ML-extracted best practices from high-performing prompts.

## Tables

### `best_practices`
Stores the analyzed best practices extracted from successful prompts.

```sql
CREATE TABLE best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Code Generation', 'Text Processing', etc.
  model VARCHAR(100) NOT NULL,    -- 'Claude-3.5-Sonnet', 'GPT-4', etc.
  effectiveness_score DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  sample_count INTEGER NOT NULL, -- Number of samples this practice was derived from
  example_prompt TEXT NOT NULL,
  key_insights JSONB NOT NULL,   -- Array of insight strings
  tags JSONB NOT NULL,          -- Array of tag strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `model_performance_stats`
Aggregated statistics for each model's best practices.

```sql
CREATE TABLE model_performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(100) NOT NULL,
  total_practices INTEGER NOT NULL,
  avg_effectiveness DECIMAL(5,2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model)
);
```

### `practice_source_sessions`
Links best practices to the sessions they were derived from.

```sql
CREATE TABLE practice_source_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  best_practice_id UUID REFERENCES best_practices(id),
  session_id VARCHAR(255) NOT NULL, -- References Sessions.session_id
  contribution_score DECIMAL(5,2) NOT NULL, -- How much this session contributed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ML Pipeline Integration

### Data Flow
1. **Collection**: Prompts and their performance scores are collected from the `Sessions` table
2. **Analysis**: ML pipeline analyzes high-performing prompts to extract patterns
3. **Extraction**: Common patterns are identified and categorized
4. **Storage**: Best practices are stored with effectiveness scores and examples
5. **API**: The `/api/best-practices` endpoint serves this data to the frontend

### ML Analysis Process
1. Filter sessions with high scores (top 10-20% per model/category)
2. Extract prompt patterns using NLP techniques
3. Cluster similar patterns together
4. Calculate effectiveness scores based on performance data
5. Generate human-readable insights and examples
6. Update the database with new/updated best practices

### Scheduled Updates
- Run ML analysis daily/weekly to identify new patterns
- Update effectiveness scores as more data becomes available
- Archive outdated practices that are no longer effective
