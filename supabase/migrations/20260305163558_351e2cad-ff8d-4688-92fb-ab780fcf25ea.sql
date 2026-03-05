
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Companies table (profile for each auth user / company)
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  employee_count TEXT,
  hiring_role TEXT,
  industry TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own company" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own company" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own company" ON public.companies FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  experience_level TEXT,
  aptitude_count INT DEFAULT 10,
  coding_count INT DEFAULT 2,
  aptitude_difficulty TEXT DEFAULT 'Medium',
  coding_difficulty TEXT DEFAULT 'Medium',
  coding_topics TEXT[] DEFAULT '{}',
  duration_minutes INT DEFAULT 60,
  anti_cheat BOOLEAN DEFAULT true,
  allow_execution BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view own assessments" ON public.assessments FOR SELECT
  USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));
CREATE POLICY "Public can view active assessments" ON public.assessments FOR SELECT
  USING (status = 'active');
CREATE POLICY "Companies can insert assessments" ON public.assessments FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));
CREATE POLICY "Companies can update own assessments" ON public.assessments FOR UPDATE
  USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('aptitude', 'coding')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer INT,
  coding_title TEXT,
  coding_description TEXT,
  coding_difficulty TEXT,
  coding_topic TEXT,
  test_cases JSONB,
  starter_code JSONB,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can manage own questions" ON public.questions FOR ALL
  USING (assessment_id IN (SELECT id FROM public.assessments WHERE company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())));
CREATE POLICY "Public can view questions for active assessments" ON public.questions FOR SELECT
  USING (assessment_id IN (SELECT id FROM public.assessments WHERE status = 'active'));

-- Candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view candidates" ON public.candidates FOR SELECT
  USING (assessment_id IN (SELECT id FROM public.assessments WHERE company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())));
CREATE POLICY "Anyone can register as candidate" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update candidate status" ON public.candidates FOR UPDATE USING (true);

-- Candidate Responses
CREATE TABLE public.candidate_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_index INT,
  code_answer TEXT,
  language TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view responses" ON public.candidate_responses FOR SELECT
  USING (candidate_id IN (SELECT id FROM public.candidates WHERE assessment_id IN (SELECT id FROM public.assessments WHERE company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))));
CREATE POLICY "Anyone can insert responses" ON public.candidate_responses FOR INSERT WITH CHECK (true);

-- Candidate Scores
CREATE TABLE public.candidate_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
  aptitude_score NUMERIC DEFAULT 0,
  coding_score NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view scores" ON public.candidate_scores FOR SELECT
  USING (candidate_id IN (SELECT id FROM public.candidates WHERE assessment_id IN (SELECT id FROM public.assessments WHERE company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))));
CREATE POLICY "Anyone can insert scores" ON public.candidate_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON public.candidate_scores FOR UPDATE USING (true);

-- Anti-Cheat Logs
CREATE TABLE public.anticheat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anticheat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view anticheat logs" ON public.anticheat_logs FOR SELECT
  USING (candidate_id IN (SELECT id FROM public.candidates WHERE assessment_id IN (SELECT id FROM public.assessments WHERE company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))));
CREATE POLICY "Anyone can insert anticheat logs" ON public.anticheat_logs FOR INSERT WITH CHECK (true);

-- Auto-create company profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.companies (user_id, company_name, employee_count, hiring_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    COALESCE(NEW.raw_user_meta_data->>'employee_count', ''),
    COALESCE(NEW.raw_user_meta_data->>'hiring_role', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
