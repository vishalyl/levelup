-- Migration: Create to-do list and items tables

CREATE TABLE IF NOT EXISTS todo_lists (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '📋',
  color      TEXT NOT NULL DEFAULT '#7C3AED',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS todo_lists_user_id_idx ON todo_lists(user_id);
CREATE INDEX IF NOT EXISTS todo_lists_sort_order_idx ON todo_lists(user_id, sort_order);

CREATE TABLE IF NOT EXISTS todo_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id      UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  notes        TEXT,
  due_date     DATE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS todo_items_list_id_idx ON todo_items(list_id);
CREATE INDEX IF NOT EXISTS todo_items_user_id_idx ON todo_items(user_id);
CREATE INDEX IF NOT EXISTS todo_items_due_date_idx ON todo_items(user_id, due_date)
  WHERE due_date IS NOT NULL AND completed_at IS NULL;

ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lists"
  ON todo_lists FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own items"
  ON todo_items FOR ALL USING (user_id = auth.uid());
