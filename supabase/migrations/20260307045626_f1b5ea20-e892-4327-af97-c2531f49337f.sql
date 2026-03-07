
-- Drop ALL existing policies and recreate as PERMISSIVE (default)

-- candidates
DROP POLICY IF EXISTS "Anyone can register as candidate" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can update candidate status" ON public.candidates;
DROP POLICY IF EXISTS "Companies can view candidates" ON public.candidates;

CREATE POLICY "anon_insert_candidates" ON public.candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_candidates" ON public.candidates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_candidates" ON public.candidates FOR SELECT TO authenticated USING (assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- candidate_responses
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.candidate_responses;
DROP POLICY IF EXISTS "Companies can view responses" ON public.candidate_responses;

CREATE POLICY "anon_insert_responses" ON public.candidate_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_responses" ON public.candidate_responses FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- candidate_scores
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Anyone can update scores" ON public.candidate_scores;
DROP POLICY IF EXISTS "Companies can view scores" ON public.candidate_scores;

CREATE POLICY "anon_insert_scores" ON public.candidate_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_scores" ON public.candidate_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_scores" ON public.candidate_scores FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- anticheat_logs
DROP POLICY IF EXISTS "Anyone can insert anticheat logs" ON public.anticheat_logs;
DROP POLICY IF EXISTS "Companies can view anticheat logs" ON public.anticheat_logs;

CREATE POLICY "anon_insert_anticheat" ON public.anticheat_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "auth_select_anticheat" ON public.anticheat_logs FOR SELECT TO authenticated USING (candidate_id IN (SELECT id FROM candidates WHERE assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))));

-- assessments - fix public read
DROP POLICY IF EXISTS "Public can view active assessments" ON public.assessments;
DROP POLICY IF EXISTS "Companies can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Companies can insert assessments" ON public.assessments;
DROP POLICY IF EXISTS "Companies can update own assessments" ON public.assessments;

CREATE POLICY "public_select_active_assessments" ON public.assessments FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "auth_select_own_assessments" ON public.assessments FOR SELECT TO authenticated USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "auth_insert_assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "auth_update_assessments" ON public.assessments FOR UPDATE TO authenticated USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- questions - fix public read
DROP POLICY IF EXISTS "Public can view questions for active assessments" ON public.questions;
DROP POLICY IF EXISTS "Companies can manage own questions" ON public.questions;

CREATE POLICY "public_select_active_questions" ON public.questions FOR SELECT TO anon, authenticated USING (assessment_id IN (SELECT id FROM assessments WHERE status = 'active'));
CREATE POLICY "auth_manage_questions" ON public.questions FOR ALL TO authenticated USING (assessment_id IN (SELECT id FROM assessments WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- companies
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;

CREATE POLICY "auth_select_company" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth_insert_company" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_update_company" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
