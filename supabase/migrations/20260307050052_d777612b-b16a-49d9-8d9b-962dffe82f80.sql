
-- Allow anyone to SELECT their own candidate row for active assessments
CREATE POLICY "anon_select_candidates_active" ON public.candidates 
FOR SELECT TO anon, authenticated 
USING (assessment_id IN (SELECT id FROM assessments WHERE status = 'active'));
