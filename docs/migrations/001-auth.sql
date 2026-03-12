-- 001-auth: 用户认证表 + requirements 关联用户
-- 在 Supabase SQL Editor 中执行

-- 1. 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. requirements 表新增 user_id 字段
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 3. 为 user_id 创建索引，加速按用户查询
CREATE INDEX IF NOT EXISTS idx_requirements_user_id ON requirements(user_id);
