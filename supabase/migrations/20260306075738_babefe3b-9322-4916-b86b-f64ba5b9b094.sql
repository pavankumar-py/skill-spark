
-- Drop ALL existing policies on candidate-facing tables and recreate as PERMISSIVE

-- candidates
DROP POLICY IF EXISTS "Anyone can register as candidate" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can update candidate status" ON public.candidates;
DROP POLICY IF EXISTS "Companies can view candidates" ON public.candidates;

CREATE POLICY "Anyone can register as candidate" ON public.candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update candidate status" ON public.candidates FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Companies can view candidates" ON public.candidates FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- candidate_responses
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.candidate_responses;
DROP POLICY IF EXISTS "Companies can view responses" ON public.candidate_responses;

CREATE POLICY "Anyone can insert responses" ON public.candidate_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Companies can view responses" ON public.candidate_responses FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- candidate_scores
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Companies can view scores" ON public.candidate_scores;

CREATE POLICY "Anyone can insert scores" ON public.candidate_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON public.candidate_scores FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Companies can view scores" ON public.candidate_scores FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- anticheat_logs
DROP POLICY IF EXISTS "Anyone can insert anticheat logs" ON public.anticheat_logs;
DROP POLICY IF EXISTS "Companies can view anticheat logs" ON public.anticheat_logs;

CREATE POLICY "Anyone can insert anticheat logs" ON public.anticheat_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Companies can view anticheat logs" ON public.anticheat_logs FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- assessments public read
DROP POLICY IF EXISTS "Public can view active assessments" ON public.assessments;
CREATE POLICY "Public can view active assessments" ON public.assessments FOR SELECT TO anon, authenticated USING (status = 'active');

-- questions public read
DROP POLICY IF EXISTS "Public can view questions for active assessments" ON public.questions;
CREATE POLICY "Public can view questions for active assessments" ON public.questions FOR SELECT TO anon, authenticated USING (assessment_id IN (SELECT id FROM assessments WHERE status = 'active'));
