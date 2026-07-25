-- ============================================================
-- MD TASKBOARD - FULL SCHEMA (Tables + Stored Procedures)
-- Prefix: md_  |  No Foreign Keys (integrity handled in functions)
-- Safe to re-run: tables/indexes use IF NOT EXISTS,
-- functions use CREATE OR REPLACE (inherently safe to re-run)
-- ============================================================

-- ========================================
-- TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS md_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('owner','admin','member')) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS md_boards (
  id SERIAL PRIMARY KEY,
  workspace_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_lists (
  id SERIAL PRIMARY KEY,
  board_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_tasks (
  id SERIAL PRIMARY KEY,
  list_id INT NOT NULL,
  board_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assigned_to INT,
  created_by INT NOT NULL,
  due_date DATE,
  priority VARCHAR(20) CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  position INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_comments (
  id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_activity_log (
  id SERIAL PRIMARY KEY,
  task_id INT,
  board_id INT,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS md_refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- INDEXES (manual, since no FK auto-indexing)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_md_workspace_members_ws ON md_workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_md_workspace_members_user ON md_workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_md_boards_workspace ON md_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_md_lists_board ON md_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_md_tasks_list ON md_tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_md_tasks_board ON md_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_md_comments_task ON md_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_md_activity_task ON md_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_md_activity_board ON md_activity_log(board_id);
CREATE INDEX IF NOT EXISTS idx_md_refresh_user ON md_refresh_tokens(user_id);

-- ========================================
-- SAFETY NET: drop every md_ function regardless of its old signature
-- before recreating them below. CREATE OR REPLACE FUNCTION cannot change
-- a function's return columns/types in place (Postgres error 42P13) — so
-- as this script evolves over time, a plain CREATE OR REPLACE can fail
-- against an older copy of a function. This makes the whole file safe to
-- re-run unconditionally, no matter what changed.
-- ========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'md\_%'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- ========================================
-- FUNCTIONS: AUTH
-- ========================================

CREATE OR REPLACE FUNCTION md_register_user(
  p_name VARCHAR, p_email VARCHAR, p_password_hash TEXT
) RETURNS TABLE(id INT, name VARCHAR, email VARCHAR) AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM md_users u WHERE u.email = p_email) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS';
  END IF;

  RETURN QUERY
  INSERT INTO md_users (name, email, password_hash)
  VALUES (p_name, p_email, p_password_hash)
  RETURNING md_users.id, md_users.name, md_users.email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_user_by_email(
  p_email VARCHAR
) RETURNS TABLE(id INT, name VARCHAR, email VARCHAR, password_hash TEXT, is_active BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.password_hash, u.is_active
  FROM md_users u
  WHERE u.email = p_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_user_by_id(
  p_user_id INT
) RETURNS TABLE(id INT, name VARCHAR, email VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email FROM md_users u WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Public-safe email lookup (no password_hash) — used by the "invite member" UI
CREATE OR REPLACE FUNCTION md_find_user_public(
  p_email VARCHAR
) RETURNS TABLE(id INT, name VARCHAR, email VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email FROM md_users u WHERE u.email = p_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_store_refresh_token(
  p_user_id INT, p_token TEXT, p_expires_at TIMESTAMP
) RETURNS VOID AS $$
BEGIN
  INSERT INTO md_refresh_tokens (user_id, token, expires_at)
  VALUES (p_user_id, p_token, p_expires_at);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_validate_refresh_token(
  p_token TEXT
) RETURNS TABLE(user_id INT) AS $$
BEGIN
  RETURN QUERY
  SELECT rt.user_id FROM md_refresh_tokens rt
  WHERE rt.token = p_token AND rt.expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_TOKEN';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_revoke_refresh_token(
  p_token TEXT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM md_refresh_tokens WHERE token = p_token;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTIONS: WORKSPACES
-- ========================================

CREATE OR REPLACE FUNCTION md_create_workspace(
  p_name VARCHAR, p_owner_id INT
) RETURNS TABLE(id INT, name VARCHAR) AS $$
DECLARE
  v_ws_id INT;
BEGIN
  INSERT INTO md_workspaces (name, owner_id)
  VALUES (p_name, p_owner_id)
  RETURNING md_workspaces.id INTO v_ws_id;

  INSERT INTO md_workspace_members (workspace_id, user_id, role)
  VALUES (v_ws_id, p_owner_id, 'owner');

  RETURN QUERY
  SELECT md_workspaces.id, md_workspaces.name FROM md_workspaces WHERE md_workspaces.id = v_ws_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_user_workspaces(
  p_user_id INT
) RETURNS TABLE(id INT, name VARCHAR, role VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.name, wm.role
  FROM md_workspaces w
  JOIN md_workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = p_user_id
  ORDER BY w.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_check_member_role(
  p_workspace_id INT, p_user_id INT, p_min_role VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
  v_rank INT;
  v_min_rank INT;
BEGIN
  SELECT role INTO v_role FROM md_workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;

  v_rank := CASE v_role WHEN 'owner' THEN 3 WHEN 'admin' THEN 2 ELSE 1 END;
  v_min_rank := CASE p_min_role WHEN 'owner' THEN 3 WHEN 'admin' THEN 2 ELSE 1 END;

  IF v_rank < v_min_rank THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSIONS';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_add_workspace_member(
  p_workspace_id INT, p_user_id INT, p_role VARCHAR
) RETURNS TABLE(id INT, workspace_id INT, user_id INT, role VARCHAR) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_workspaces w WHERE w.id = p_workspace_id) THEN
    RAISE EXCEPTION 'WORKSPACE_NOT_FOUND';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM md_users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM md_workspace_members m WHERE m.workspace_id = p_workspace_id AND m.user_id = p_user_id) THEN
    RAISE EXCEPTION 'ALREADY_A_MEMBER';
  END IF;

  RETURN QUERY
  INSERT INTO md_workspace_members (workspace_id, user_id, role)
  VALUES (p_workspace_id, p_user_id, p_role)
  RETURNING md_workspace_members.id, md_workspace_members.workspace_id,
            md_workspace_members.user_id, md_workspace_members.role;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_workspace_members(
  p_workspace_id INT
) RETURNS TABLE(user_id INT, name VARCHAR, email VARCHAR, role VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, wm.role
  FROM md_workspace_members wm
  JOIN md_users u ON u.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTIONS: BOARDS & LISTS
-- ========================================

CREATE OR REPLACE FUNCTION md_create_board(
  p_workspace_id INT, p_title VARCHAR, p_user_id INT
) RETURNS TABLE(id INT, title VARCHAR) AS $$
DECLARE
  v_board_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_workspaces w WHERE w.id = p_workspace_id) THEN
    RAISE EXCEPTION 'WORKSPACE_NOT_FOUND';
  END IF;

  INSERT INTO md_boards (workspace_id, title, created_by)
  VALUES (p_workspace_id, p_title, p_user_id)
  RETURNING md_boards.id INTO v_board_id;

  INSERT INTO md_activity_log (board_id, user_id, action)
  VALUES (v_board_id, p_user_id, 'created board "' || p_title || '"');

  RETURN QUERY SELECT md_boards.id, md_boards.title FROM md_boards WHERE md_boards.id = v_board_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_workspace_boards(
  p_workspace_id INT
) RETURNS TABLE(id INT, title VARCHAR, created_at TIMESTAMP) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_workspaces w WHERE w.id = p_workspace_id) THEN
    RAISE EXCEPTION 'WORKSPACE_NOT_FOUND';
  END IF;

  RETURN QUERY
  SELECT b.id, b.title, b.created_at FROM md_boards b
  WHERE b.workspace_id = p_workspace_id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Resolve a board's workspace_id (used by Node access-control middleware)
CREATE OR REPLACE FUNCTION md_get_board_workspace(
  p_board_id INT
) RETURNS TABLE(workspace_id INT) AS $$
BEGIN
  RETURN QUERY SELECT b.workspace_id FROM md_boards b WHERE b.id = p_board_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOARD_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Combined check: does this user have at least `member` access to this board's workspace?
-- Raises BOARD_NOT_FOUND if the board doesn't exist, NOT_A_MEMBER if the user has no access.
CREATE OR REPLACE FUNCTION md_check_board_access(
  p_board_id INT, p_user_id INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_workspace_id INT;
BEGIN
  SELECT b.workspace_id INTO v_workspace_id FROM md_boards b WHERE b.id = p_board_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'BOARD_NOT_FOUND';
  END IF;

  PERFORM md_check_member_role(v_workspace_id, p_user_id, 'member');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Resolve a list's board_id (used by Node access-control middleware)
CREATE OR REPLACE FUNCTION md_get_board_id_by_list(
  p_list_id INT
) RETURNS TABLE(board_id INT) AS $$
BEGIN
  RETURN QUERY SELECT l.board_id FROM md_lists l WHERE l.id = p_list_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Resolve a task's board_id (used by Node access-control middleware)
CREATE OR REPLACE FUNCTION md_get_board_id_by_task(
  p_task_id INT
) RETURNS TABLE(board_id INT) AS $$
BEGIN
  RETURN QUERY SELECT t.board_id FROM md_tasks t WHERE t.id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_create_list(
  p_board_id INT, p_title VARCHAR
) RETURNS TABLE(id INT, title VARCHAR, "position" INT) AS $$
DECLARE
  v_position INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_boards b WHERE b.id = p_board_id) THEN
    RAISE EXCEPTION 'BOARD_NOT_FOUND';
  END IF;

  SELECT COALESCE(MAX(l.position), 0) + 1 INTO v_position
  FROM md_lists l WHERE l.board_id = p_board_id;

  RETURN QUERY
  INSERT INTO md_lists (board_id, title, position)
  VALUES (p_board_id, p_title, v_position)
  RETURNING md_lists.id, md_lists.title, md_lists.position;
END;
$$ LANGUAGE plpgsql;

-- FIXED: now raises LIST_NOT_FOUND if the list doesn't exist
CREATE OR REPLACE FUNCTION md_reorder_list(
  p_list_id INT, p_new_position INT
) RETURNS VOID AS $$
BEGIN
  UPDATE md_lists SET position = p_new_position WHERE id = p_list_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_rename_list(
  p_list_id INT, p_title VARCHAR
) RETURNS TABLE(id INT, title VARCHAR) AS $$
BEGIN
  UPDATE md_lists SET title = p_title WHERE md_lists.id = p_list_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;

  RETURN QUERY SELECT md_lists.id, md_lists.title FROM md_lists WHERE md_lists.id = p_list_id;
END;
$$ LANGUAGE plpgsql;

-- Deletes a list along with every task inside it, and those tasks' comments
-- and activity log entries — manual cascade since there are no foreign keys.
CREATE OR REPLACE FUNCTION md_delete_list(
  p_list_id INT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_lists WHERE id = p_list_id) THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;

  DELETE FROM md_comments WHERE task_id IN (SELECT id FROM md_tasks WHERE list_id = p_list_id);
  DELETE FROM md_activity_log WHERE task_id IN (SELECT id FROM md_tasks WHERE list_id = p_list_id);
  DELETE FROM md_tasks WHERE list_id = p_list_id;
  DELETE FROM md_lists WHERE id = p_list_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_board_full(
  p_board_id INT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'board_id', b.id,
    'title', b.title,
    'lists', (
      SELECT COALESCE(json_agg(list_data ORDER BY (list_data->>'position')::INT), '[]'::json)
      FROM (
        SELECT json_build_object(
          'id', l.id,
          'title', l.title,
          'position', l.position,
          'tasks', (
            SELECT COALESCE(json_agg(t.* ORDER BY t.position), '[]'::json)
            FROM md_tasks t WHERE t.list_id = l.id
          )
        ) AS list_data
        FROM md_lists l WHERE l.board_id = b.id
      ) sub
    )
  ) INTO v_result
  FROM md_boards b WHERE b.id = p_board_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'BOARD_NOT_FOUND';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTIONS: TASKS
-- ========================================

CREATE OR REPLACE FUNCTION md_create_task(
  p_list_id INT, p_board_id INT, p_title VARCHAR, p_user_id INT
) RETURNS TABLE(id INT, title VARCHAR, "position" INT) AS $$
DECLARE
  v_position INT;
  v_task_id INT;
  v_actual_board_id INT;
BEGIN
  SELECT l.board_id INTO v_actual_board_id FROM md_lists l WHERE l.id = p_list_id;

  IF v_actual_board_id IS NULL THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;

  IF v_actual_board_id != p_board_id THEN
    RAISE EXCEPTION 'LIST_BOARD_MISMATCH';
  END IF;

  SELECT COALESCE(MAX(t.position), 0) + 1 INTO v_position
  FROM md_tasks t WHERE t.list_id = p_list_id;

  INSERT INTO md_tasks (list_id, board_id, title, created_by, position)
  VALUES (p_list_id, p_board_id, p_title, p_user_id, v_position)
  RETURNING md_tasks.id INTO v_task_id;

  INSERT INTO md_activity_log (task_id, board_id, user_id, action)
  VALUES (v_task_id, p_board_id, p_user_id, 'created task "' || p_title || '"');

  RETURN QUERY
  SELECT md_tasks.id, md_tasks.title, md_tasks.position FROM md_tasks WHERE md_tasks.id = v_task_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_update_task(
  p_task_id INT, p_title VARCHAR, p_description TEXT,
  p_assigned_to INT, p_due_date DATE, p_priority VARCHAR, p_user_id INT
) RETURNS VOID AS $$
BEGIN
  UPDATE md_tasks
  SET title = p_title,
      description = p_description,
      assigned_to = p_assigned_to,
      due_date = p_due_date,
      priority = p_priority,
      updated_at = NOW()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;

  INSERT INTO md_activity_log (task_id, user_id, action)
  VALUES (p_task_id, p_user_id, 'updated task details');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_move_task(
  p_task_id INT, p_new_list_id INT, p_new_position INT, p_user_id INT
) RETURNS VOID AS $$
DECLARE
  v_task_board_id INT;
  v_new_list_board_id INT;
BEGIN
  SELECT board_id INTO v_task_board_id FROM md_tasks WHERE id = p_task_id;
  IF v_task_board_id IS NULL THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;

  SELECT board_id INTO v_new_list_board_id FROM md_lists WHERE id = p_new_list_id;
  IF v_new_list_board_id IS NULL THEN
    RAISE EXCEPTION 'LIST_NOT_FOUND';
  END IF;

  IF v_new_list_board_id != v_task_board_id THEN
    RAISE EXCEPTION 'LIST_BOARD_MISMATCH';
  END IF;

  UPDATE md_tasks
  SET list_id = p_new_list_id, position = p_new_position, updated_at = NOW()
  WHERE id = p_task_id;

  INSERT INTO md_activity_log (task_id, user_id, action)
  VALUES (p_task_id, p_user_id, 'moved task to list ' || p_new_list_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_toggle_task_complete(
  p_task_id INT, p_is_completed BOOLEAN, p_user_id INT
) RETURNS VOID AS $$
BEGIN
  UPDATE md_tasks SET is_completed = p_is_completed, updated_at = NOW()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;

  INSERT INTO md_activity_log (task_id, user_id, action)
  VALUES (p_task_id, p_user_id,
    CASE WHEN p_is_completed THEN 'marked task complete' ELSE 'marked task incomplete' END);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_delete_task(
  p_task_id INT
) RETURNS VOID AS $$
BEGIN
  DELETE FROM md_comments WHERE task_id = p_task_id;
  DELETE FROM md_activity_log WHERE task_id = p_task_id;
  DELETE FROM md_tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCTIONS: COMMENTS & ACTIVITY
-- ========================================

CREATE OR REPLACE FUNCTION md_add_comment(
  p_task_id INT, p_user_id INT, p_content TEXT
) RETURNS TABLE(id INT, content TEXT, created_at TIMESTAMP) AS $$
DECLARE
  v_comment_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM md_tasks t WHERE t.id = p_task_id) THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;

  INSERT INTO md_comments (task_id, user_id, content)
  VALUES (p_task_id, p_user_id, p_content)
  RETURNING md_comments.id INTO v_comment_id;

  INSERT INTO md_activity_log (task_id, user_id, action)
  VALUES (p_task_id, p_user_id, 'added a comment');

  RETURN QUERY
  SELECT md_comments.id, md_comments.content, md_comments.created_at
  FROM md_comments WHERE md_comments.id = v_comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_task_comments(
  p_task_id INT
) RETURNS TABLE(id INT, content TEXT, user_id INT, user_name VARCHAR, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.content, u.id, u.name, c.created_at
  FROM md_comments c
  JOIN md_users u ON u.id = c.user_id
  WHERE c.task_id = p_task_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_task_activity(
  p_task_id INT
) RETURNS TABLE(id INT, action VARCHAR, user_name VARCHAR, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.action, u.name, a.created_at
  FROM md_activity_log a
  JOIN md_users u ON u.id = a.user_id
  WHERE a.task_id = p_task_id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION md_get_board_activity(
  p_board_id INT, p_limit INT DEFAULT 20
) RETURNS TABLE(id INT, action VARCHAR, user_name VARCHAR, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.action, u.name, a.created_at
  FROM md_activity_log a
  JOIN md_users u ON u.id = a.user_id
  WHERE a.board_id = p_board_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;