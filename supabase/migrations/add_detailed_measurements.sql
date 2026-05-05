-- Migration to add detailed body measurement columns
-- Run this in Supabase SQL Editor

ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS tummy NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS shoulder NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS left_biceps NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS right_biceps NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS left_forearm NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS right_forearm NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS left_calf NUMERIC;
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS right_calf NUMERIC;

-- Update the existing record with the full measurement data
UPDATE body_measurements
SET
  tummy = 38,
  shoulder = 21,
  left_biceps = 12,
  right_biceps = 13,
  left_forearm = 10.5,
  right_forearm = 11,
  left_calf = 15.5,
  right_calf = 16
WHERE date = '2026-05-05' AND user_id = '63577717-b31a-4659-ad26-f76c18229c5e';
