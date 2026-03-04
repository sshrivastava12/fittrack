-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  unit_preference TEXT NOT NULL DEFAULT 'lbs' CHECK (unit_preference IN ('lbs', 'kg')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- EXERCISES
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest','back','shoulders','arms','legs','core','cardio')),
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Global exercises visible to all; custom ones only to owner
CREATE POLICY "Global exercises visible to all authenticated" ON exercises
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (is_custom = FALSE OR user_id = auth.uid())
  );

CREATE POLICY "Users can insert custom exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

CREATE POLICY "Users can update own custom exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id AND is_custom = TRUE);

CREATE POLICY "Users can delete own custom exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id AND is_custom = TRUE);

-- ============================================================
-- ROUTINES
-- ============================================================
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ROUTINE EXERCISES
-- ============================================================
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  default_sets INTEGER NOT NULL DEFAULT 3,
  default_reps INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own routine exercises" ON routine_exercises
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM routines WHERE id = routine_id)
  );

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workouts" ON workouts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- WORKOUT SETS
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  reps INTEGER,
  weight DECIMAL(8,2),
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('lbs', 'kg')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout sets" ON workout_sets
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id)
  );

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(8,2) NOT NULL,
  reps INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'lbs' CHECK (unit IN ('lbs', 'kg')),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  UNIQUE (user_id, exercise_id)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own PRs" ON personal_records
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_finished_at ON workouts(finished_at);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);

-- ============================================================
-- SEED EXERCISE LIBRARY (~60 exercises)
-- ============================================================
INSERT INTO exercises (name, muscle_group, is_custom, user_id) VALUES
  -- CHEST
  ('Bench Press', 'chest', FALSE, NULL),
  ('Incline Bench Press', 'chest', FALSE, NULL),
  ('Decline Bench Press', 'chest', FALSE, NULL),
  ('Dumbbell Flyes', 'chest', FALSE, NULL),
  ('Cable Crossover', 'chest', FALSE, NULL),
  ('Push-Up', 'chest', FALSE, NULL),
  ('Chest Dip', 'chest', FALSE, NULL),
  ('Machine Chest Press', 'chest', FALSE, NULL),

  -- BACK
  ('Deadlift', 'back', FALSE, NULL),
  ('Pull-Up', 'back', FALSE, NULL),
  ('Chin-Up', 'back', FALSE, NULL),
  ('Barbell Row', 'back', FALSE, NULL),
  ('Lat Pulldown', 'back', FALSE, NULL),
  ('Cable Row', 'back', FALSE, NULL),
  ('T-Bar Row', 'back', FALSE, NULL),
  ('Dumbbell Row', 'back', FALSE, NULL),
  ('Face Pull', 'back', FALSE, NULL),

  -- SHOULDERS
  ('Overhead Press (Barbell)', 'shoulders', FALSE, NULL),
  ('Dumbbell Shoulder Press', 'shoulders', FALSE, NULL),
  ('Lateral Raises', 'shoulders', FALSE, NULL),
  ('Front Raises', 'shoulders', FALSE, NULL),
  ('Rear Delt Flyes', 'shoulders', FALSE, NULL),
  ('Arnold Press', 'shoulders', FALSE, NULL),
  ('Upright Row', 'shoulders', FALSE, NULL),
  ('Shrugs', 'shoulders', FALSE, NULL),

  -- ARMS
  ('Barbell Curl', 'arms', FALSE, NULL),
  ('Dumbbell Curl', 'arms', FALSE, NULL),
  ('Hammer Curl', 'arms', FALSE, NULL),
  ('Preacher Curl', 'arms', FALSE, NULL),
  ('Tricep Dip', 'arms', FALSE, NULL),
  ('Skull Crushers', 'arms', FALSE, NULL),
  ('Tricep Pushdown', 'arms', FALSE, NULL),
  ('Overhead Tricep Extension', 'arms', FALSE, NULL),
  ('Concentration Curl', 'arms', FALSE, NULL),
  ('Cable Curl', 'arms', FALSE, NULL),

  -- LEGS
  ('Squat', 'legs', FALSE, NULL),
  ('Leg Press', 'legs', FALSE, NULL),
  ('Romanian Deadlift', 'legs', FALSE, NULL),
  ('Leg Curl', 'legs', FALSE, NULL),
  ('Leg Extension', 'legs', FALSE, NULL),
  ('Calf Raises', 'legs', FALSE, NULL),
  ('Hip Thrust', 'legs', FALSE, NULL),
  ('Lunges', 'legs', FALSE, NULL),
  ('Bulgarian Split Squat', 'legs', FALSE, NULL),
  ('Hack Squat', 'legs', FALSE, NULL),
  ('Sumo Deadlift', 'legs', FALSE, NULL),
  ('Step-Ups', 'legs', FALSE, NULL),

  -- CORE
  ('Plank', 'core', FALSE, NULL),
  ('Crunches', 'core', FALSE, NULL),
  ('Russian Twist', 'core', FALSE, NULL),
  ('Dead Bug', 'core', FALSE, NULL),
  ('Ab Rollout', 'core', FALSE, NULL),
  ('Hanging Leg Raise', 'core', FALSE, NULL),
  ('Cable Crunch', 'core', FALSE, NULL),
  ('Bicycle Crunches', 'core', FALSE, NULL),

  -- CARDIO
  ('Running', 'cardio', FALSE, NULL),
  ('Cycling', 'cardio', FALSE, NULL),
  ('Rowing Machine', 'cardio', FALSE, NULL),
  ('Jump Rope', 'cardio', FALSE, NULL),
  ('Elliptical', 'cardio', FALSE, NULL),
  ('Stair Climber', 'cardio', FALSE, NULL)

ON CONFLICT DO NOTHING;
